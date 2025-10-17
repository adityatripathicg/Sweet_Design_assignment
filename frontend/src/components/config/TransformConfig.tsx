import React, { useState, useEffect } from 'react';
import { TransformConfig as TransformConfigType } from '../../types/workflow';
import { Settings, Code, Play } from 'lucide-react';

interface TransformConfigProps {
  config: any;
  onUpdate: (config: TransformConfigType) => void;
}

const TransformConfig: React.FC<TransformConfigProps> = ({ config, onUpdate }) => {
  const [formData, setFormData] = useState<TransformConfigType>({
    operation: 'map',
    script: '// Transform your data here\nreturn data.map(item => ({ ...item, processed: true }));',
    parameters: {},
    ...config,
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const handleInputChange = (field: keyof TransformConfigType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const operationTypes = [
    {
      value: 'filter',
      label: 'Filter',
      description: 'Remove items based on conditions',
      template: `// Filter data based on conditions
return data.filter(item => {
  // Add your filtering logic here
  return item.value > 100;
});`,
    },
    {
      value: 'map',
      label: 'Map',
      description: 'Transform each item in the dataset',
      template: `// Transform each item in the data
return data.map(item => {
  // Add your transformation logic here
  return {
    ...item,
    processed: true,
    timestamp: new Date().toISOString()
  };
});`,
    },
    {
      value: 'aggregate',
      label: 'Aggregate',
      description: 'Calculate summaries and statistics',
      template: `// Aggregate data into summary statistics
const result = {
  total: data.length,
  sum: data.reduce((acc, item) => acc + (item.value || 0), 0),
  average: data.reduce((acc, item) => acc + (item.value || 0), 0) / data.length,
  max: Math.max(...data.map(item => item.value || 0)),
  min: Math.min(...data.map(item => item.value || 0))
};
return result;`,
    },
    {
      value: 'join',
      label: 'Join',
      description: 'Combine data from multiple sources',
      template: `// Join data with external dataset
// Assumes parameters.joinData contains the data to join with
const joinData = parameters.joinData || [];
return data.map(item => {
  const match = joinData.find(j => j.id === item.id);
  return match ? { ...item, ...match } : item;
});`,
    },
  ];

  const applyTemplate = (operation: typeof operationTypes[0]) => {
    setFormData(prev => ({
      ...prev,
      operation: operation.value as any,
      script: operation.template,
    }));
  };

  const addParameter = () => {
    const key = prompt('Enter parameter name:');
    if (key && key.trim()) {
      const value = prompt('Enter parameter value:');
      setFormData(prev => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          [key.trim()]: value || '',
        },
      }));
    }
  };

  const removeParameter = (key: string) => {
    setFormData(prev => ({
      ...prev,
      parameters: Object.fromEntries(
        Object.entries(prev.parameters).filter(([k]) => k !== key)
      ),
    }));
  };

  const updateParameter = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-4">
      {/* Operation Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operation Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {operationTypes.map((op) => (
            <button
              key={op.value}
              onClick={() => applyTemplate(op)}
              className={`p-3 text-left border rounded-md transition-colors duration-150 ${
                formData.operation === op.value
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-sm">{op.label}</div>
              <div className="text-xs text-gray-600 mt-1">{op.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Transform Script */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Transform Script
          </label>
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">JavaScript</span>
          </div>
        </div>
        <textarea
          value={formData.script}
          onChange={(e) => handleInputChange('script', e.target.value)}
          rows={12}
          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none custom-scrollbar bg-gray-50"
          placeholder="Enter your JavaScript transformation code..."
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Available: data (array), parameters (object)</span>
          <span>{formData.script.split('\n').length} lines</span>
        </div>
      </div>

      {/* Parameters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Parameters
          </label>
          <button
            onClick={addParameter}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            + Add Parameter
          </button>
        </div>
        
        {Object.entries(formData.parameters).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(formData.parameters).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={key}
                    disabled
                    className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md font-mono"
                  />
                  <input
                    type="text"
                    value={value as string}
                    onChange={(e) => updateParameter(key, e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Parameter value"
                  />
                </div>
                <button
                  onClick={() => removeParameter(key)}
                  className="text-red-500 hover:text-red-700 text-xs px-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md border border-gray-200">
            <Settings className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No parameters defined</p>
            <p className="text-xs">Parameters can be used in your script</p>
          </div>
        )}
      </div>

      {/* Code Examples */}
      <div className="bg-green-50 border border-green-200 rounded-md p-3">
        <div className="flex items-center mb-2">
          <Code className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">Common Examples</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Add calculated field:</div>
            <code className="text-gray-600">
              {'return data.map(item => ({...item, total: item.price * item.quantity}));'}
            </code>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Filter by condition:</div>
            <code className="text-gray-600">
              {"return data.filter(item => item.status === 'active');"}
            </code>
          </div>
          <div className="bg-white p-2 rounded border">
            <div className="font-medium mb-1">Group and count:</div>
            <code className="text-gray-600">
              {'return data.reduce((acc, item) => {acc[item.category] = (acc[item.category] || 0) + 1; return acc;}, {});'}
            </code>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="flex items-center mb-2">
          <Play className="w-4 h-4 text-gray-600 mr-2" />
          <span className="text-sm font-medium text-gray-800">Configuration Summary</span>
        </div>
        <div className="text-xs space-y-1 text-gray-600">
          <div><span className="font-medium">Operation:</span> {formData.operation}</div>
          <div><span className="font-medium">Script Lines:</span> {formData.script.split('\n').length}</div>
          <div><span className="font-medium">Parameters:</span> {Object.keys(formData.parameters).length}</div>
        </div>
      </div>
    </div>
  );
};

export default TransformConfig;
