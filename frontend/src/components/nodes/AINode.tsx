import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Brain, AlertCircle, CheckCircle, Loader2, Zap } from 'lucide-react';
import { WorkflowNodeData } from '../../types/workflow';

interface AINodeData extends WorkflowNodeData {
  type: 'ai';
}

const AINode: React.FC<NodeProps<AINodeData>> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'processing':
        return 'border-orange-500 bg-orange-50 animate-pulse';
      default:
        return 'border-purple-500 bg-purple-50';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getModelName = () => {
    const config = data.config as any;
    if (config?.model) {
      // Extract just the model name without version numbers
      const model = config.model.split('-')[0];
      return model.charAt(0).toUpperCase() + model.slice(1);
    }
    return 'AI';
  };

  const getPromptPreview = () => {
    const config = data.config as any;
    if (config?.prompt) {
      return config.prompt.length > 40 
        ? `${config.prompt.substring(0, 40)}...`
        : config.prompt;
    }
    return 'No prompt configured';
  };

  return (
    <div 
      className={`workflow-node ${getStatusColor()} ${selected ? 'ring-2 ring-primary-500' : ''}`}
      role="article"
      aria-label={`AI node: ${data.label}, Status: ${data.status}`}
      tabIndex={selected ? 0 : -1}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
        aria-label="Input connection point"
      />

      <div className="px-4 py-3 w-[220px] max-w-[220px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-medium text-purple-800 uppercase tracking-wide">
              {getModelName()}
            </span>
            <Zap className="w-3 h-3 text-yellow-500" />
          </div>
          {getStatusIcon()}
        </div>

        {/* Label */}
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {data.label}
          </h3>
        </div>

        {/* AI Configuration Info */}
        <div className="text-xs text-gray-600">
          {data.config && (data.config as any).model ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                <span className="text-gray-500 text-xs">Model:</span>
                <span className="font-mono text-xs truncate">
                  {(data.config as any).model.split('-')[0]}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Prompt:</span>
                <div className="mt-1 p-2 bg-purple-100 rounded text-xs font-mono leading-tight break-words max-w-full overflow-hidden">
                  {getPromptPreview()}
                </div>
              </div>
              {(data.config as any).temperature && (
                <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                  <span className="text-gray-500 text-xs">Temp:</span>
                  <span className="text-xs truncate">{(data.config as any).temperature}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-orange-600">Not configured</span>
          )}
        </div>

        {/* Execution Info */}
        {data.lastExecuted && (
          <div className="mt-3 pt-2 border-t border-purple-200 text-xs text-gray-500">
            <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
              <span className="text-gray-500 text-xs">Last run:</span>
              <span className="font-mono text-xs truncate">
                {data.lastExecuted.toLocaleTimeString()}
              </span>
            </div>
            {data.executionTime && (
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start mt-1">
                <span className="text-gray-500 text-xs">Duration:</span>
                <span className="font-mono text-xs truncate">
                  {data.executionTime}ms
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {data.errorMessage && (
          <div className="mt-2 p-1 bg-red-100 border border-red-200 rounded text-xs text-red-600">
            {data.errorMessage.length > 50 
              ? `${data.errorMessage.substring(0, 50)}...` 
              : data.errorMessage}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
        aria-label="Output connection point"
      />
      
      {/* Screen reader status description */}
      <div className="sr-only">
        Status: {data.status}. 
        {data.errorMessage && `Error: ${data.errorMessage}. `}
        {data.lastExecuted && `Last executed at ${data.lastExecuted.toLocaleString()}. `}
        Model: {(data.config as any)?.model || 'Not configured'}.
      </div>
    </div>
  );
};

export default AINode;
