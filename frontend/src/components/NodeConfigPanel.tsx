import React from 'react';
import { 
  Settings, 
  Database, 
  Brain, 
  Send, 
  Trash2,
  TestTube,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { WorkflowNode } from '../types/workflow';
import DatabaseConfig from './config/DatabaseConfig';
import AIConfig from './config/AIConfig';
import TransformConfig from './config/TransformConfig';
import OutputConfig from './config/OutputConfig';

interface NodeConfigPanelProps {
  selectedNode: WorkflowNode | null;
  onUpdateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose?: () => void;
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'database':
      return <Database className="w-5 h-5 text-blue-600" />;
    case 'ai':
      return <Brain className="w-5 h-5 text-purple-600" />;
    case 'transform':
      return <Settings className="w-5 h-5 text-green-600" />;
    case 'output':
      return <Send className="w-5 h-5 text-orange-600" />;
    default:
      return <Settings className="w-5 h-5 text-gray-600" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'processing':
      return <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />;
    default:
      return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  }
};

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onClose,
}) => {
  if (!selectedNode) {
    return (
      <div className="bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-gray-500">
        <Settings className="w-12 h-12 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No Node Selected</h3>
        <p className="text-sm text-center">
          Select a node from the workflow to configure its settings and view execution details.
        </p>
      </div>
    );
  }

  const handleConfigUpdate = (config: any) => {
    onUpdateNode(selectedNode.id, { config });
  };

  const handleLabelUpdate = (label: string) => {
    onUpdateNode(selectedNode.id, { label });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      onDeleteNode(selectedNode.id);
    }
  };

  const renderConfigComponent = () => {
    switch (selectedNode.data.type) {
      case 'database':
        return (
          <DatabaseConfig
            config={selectedNode.data.config}
            onUpdate={handleConfigUpdate}
          />
        );
      case 'ai':
        return (
          <AIConfig
            config={selectedNode.data.config}
            onUpdate={handleConfigUpdate}
          />
        );
      case 'transform':
        return (
          <TransformConfig
            config={selectedNode.data.config}
            onUpdate={handleConfigUpdate}
          />
        );
      case 'output':
        return (
          <OutputConfig
            config={selectedNode.data.config}
            onUpdate={handleConfigUpdate}
          />
        );
      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Configuration not available for this node type.</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Mobile Close Button */}
      {onClose && (
        <div className="lg:hidden p-3 border-b border-gray-200">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-150"
            aria-label="Close configuration panel"
          >
            Close Configuration →
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getNodeIcon(selectedNode.data.type)}
            <div>
              <h3 className="font-semibold text-gray-800 capitalize">
                {selectedNode.data.type} Node
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon(selectedNode.data.status)}
                <span className="text-sm text-gray-600 capitalize">
                  {selectedNode.data.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-150"
            title="Delete Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Node Label */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Label
          </label>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => handleLabelUpdate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter node label..."
          />
        </div>

        {/* Execution Info */}
        {selectedNode.data.lastExecuted && (
          <div className="text-xs text-gray-500">
            Last executed: {selectedNode.data.lastExecuted.toLocaleString()}
            {selectedNode.data.executionTime && (
              <span> ({selectedNode.data.executionTime}ms)</span>
            )}
          </div>
        )}

        {selectedNode.data.errorMessage && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-600">{selectedNode.data.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Configuration Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Configuration</h4>
          {renderConfigComponent()}
        </div>

        {/* Test Connection Button for Database Nodes */}
        {selectedNode.data.type === 'database' && (
          <div className="mt-6">
            <button className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150">
              <TestTube className="w-4 h-4 mr-2" />
              Test Connection
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>Node ID: {selectedNode.id}</span>
            <span>Type: {selectedNode.data.type}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
