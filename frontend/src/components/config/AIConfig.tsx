import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AIConfig as AIConfigType } from '../../types/workflow';
import { Brain, Info } from 'lucide-react';

interface AIConfigProps {
  config: any;
  onUpdate: (config: AIConfigType) => void;
}

const AIConfig: React.FC<AIConfigProps> = ({ config, onUpdate }) => {
  const [formData, setFormData] = useState<AIConfigType>({
    model: 'mixtral-8x7b-32768',
    prompt: 'Analyze the following data and provide insights:',
    temperature: 0.7,
    maxTokens: 1000,
    ...config,
  });

  // Use useEffect without onUpdate dependency to avoid infinite loops
  useEffect(() => {
    onUpdate(formData);
  }, [formData]);

  const handleInputChange = useCallback((field: keyof AIConfigType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const modelOptions = useMemo(() => [
    {
      value: 'mixtral-8x7b-32768',
      label: 'Mixtral 8x7B',
      description: 'Fast and efficient for most tasks',
    },
    {
      value: 'llama2-70b-4096',
      label: 'Llama 2 70B',
      description: 'More powerful, better reasoning',
    },
    {
      value: 'gemma-7b-it',
      label: 'Gemma 7B',
      description: 'Good balance of speed and quality',
    },
  ], []);

  const promptTemplates = useMemo(() => [
    {
      title: 'Customer Analysis',
      prompt: `Analyze the customer data provided and identify:
1. Key customer segments
2. Buying patterns and trends
3. Customer satisfaction indicators
4. Recommendations for improvement

Data to analyze:`,
    },
    {
      title: 'Sales Insights',
      prompt: `Review the sales data and provide:
1. Performance summary
2. Top performing products/services
3. Sales trends over time
4. Growth opportunities

Sales data:`,
    },
    {
      title: 'Data Summary',
      prompt: `Summarize the following data and highlight:
1. Key metrics and KPIs
2. Notable patterns or anomalies
3. Important trends
4. Actionable insights

Data:`,
    },
    {
      title: 'Custom Analysis',
      prompt: 'Analyze the following data and provide insights:',
    },
  ], []);

  const applyTemplate = useCallback((template: typeof promptTemplates[0]) => {
    handleInputChange('prompt', template.prompt);
  }, [handleInputChange]);

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Model
        </label>
        <select
          value={formData.model}
          onChange={(e) => handleInputChange('model', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Model Description */}
        {modelOptions.find(opt => opt.value === formData.model) && (
          <p className="mt-1 text-xs text-gray-600 flex items-center">
            <Info className="w-3 h-3 mr-1" />
            {modelOptions.find(opt => opt.value === formData.model)?.description}
          </p>
        )}
      </div>

      {/* Prompt Templates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt Templates
        </label>
        <div className="grid grid-cols-2 gap-2">
          {promptTemplates.map((template, index) => (
            <button
              key={index}
              onClick={() => applyTemplate(template)}
              className="p-2 text-xs text-left bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors duration-150"
            >
              <div className="font-medium text-purple-800">{template.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Prompt
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => handleInputChange('prompt', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none custom-scrollbar"
          placeholder="Enter your analysis prompt here..."
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Be specific about what insights you want</span>
          <span>{formData.prompt.length} characters</span>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Settings</h4>
        
        {/* Temperature */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperature: {formData.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>More focused (0)</span>
            <span>More creative (1)</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Tokens
          </label>
          <input
            type="number"
            value={formData.maxTokens}
            onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value) || 1000)}
            min="100"
            max="4000"
            step="100"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="1000"
          />
          <p className="mt-1 text-xs text-gray-500">
            Maximum length of AI response (100-4000 tokens)
          </p>
        </div>
      </div>

      {/* Preview Box */}
      <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
        <div className="flex items-center mb-2">
          <Brain className="w-4 h-4 text-purple-600 mr-2" />
          <span className="text-sm font-medium text-purple-800">Configuration Preview</span>
        </div>
        <div className="text-xs space-y-1 text-gray-600">
          <div><span className="font-medium">Model:</span> {formData.model}</div>
          <div><span className="font-medium">Temperature:</span> {formData.temperature}</div>
          <div><span className="font-medium">Max Tokens:</span> {formData.maxTokens}</div>
          <div><span className="font-medium">Prompt Length:</span> {formData.prompt.length} characters</div>
        </div>
      </div>
    </div>
  );
};

export default AIConfig;
