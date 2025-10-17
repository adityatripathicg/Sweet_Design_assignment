import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings, AlertCircle, CheckCircle, Loader2, Filter, Map, BarChart3 } from 'lucide-react';
import { WorkflowNodeData } from '../../types/workflow';

interface TransformNodeData extends WorkflowNodeData {
  type: 'transform';
}

const TransformNode: React.FC<NodeProps<TransformNodeData>> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'processing':
        return 'border-orange-500 bg-orange-50 animate-pulse';
      default:
        return 'border-green-500 bg-green-50';
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

  const getOperationIcon = () => {
    const config = data.config as any;
    switch (config?.operation) {
      case 'filter':
        return <Filter className="w-4 h-4 text-green-600" />;
      case 'map':
        return <Map className="w-4 h-4 text-green-600" />;
      case 'aggregate':
        return <BarChart3 className="w-4 h-4 text-green-600" />;
      default:
        return <Settings className="w-4 h-4 text-green-600" />;
    }
  };

  const getOperationLabel = () => {
    const config = data.config as any;
    if (config?.operation) {
      return config.operation.toUpperCase();
    }
    return 'TRANSFORM';
  };

  const getScriptPreview = () => {
    const config = data.config as any;
    if (config?.script) {
      // Extract first meaningful line of script
      const lines = config.script.split('\n').filter((line: string) => 
        line.trim() && !line.trim().startsWith('//')
      );
      const firstLine = lines[0] || '';
      return firstLine.length > 30 
        ? `${firstLine.substring(0, 30)}...`
        : firstLine;
    }
    return 'No script configured';
  };

  return (
    <div className={`workflow-node ${getStatusColor()} ${selected ? 'ring-2 ring-primary-500' : ''}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />

      <div className="px-4 py-3 w-[220px] max-w-[220px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getOperationIcon()}
            <span className="text-xs font-medium text-green-800 uppercase tracking-wide">
              {getOperationLabel()}
            </span>
          </div>
          {getStatusIcon()}
        </div>

        {/* Label */}
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {data.label}
          </h3>
        </div>

        {/* Transform Configuration Info */}
        <div className="text-xs text-gray-600">
          {data.config && (data.config as any).operation ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                <span className="text-gray-500 text-xs">Operation:</span>
                <span className="font-medium capitalize text-xs truncate">
                  {(data.config as any).operation}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Script:</span>
                <div className="mt-1 p-2 bg-green-100 rounded text-xs font-mono leading-tight break-words max-w-full overflow-hidden">
                  {getScriptPreview()}
                </div>
              </div>
              {(data.config as any).parameters && 
                Object.keys((data.config as any).parameters).length > 0 && (
                <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                  <span className="text-gray-500 text-xs">Params:</span>
                  <span className="text-xs truncate">{Object.keys((data.config as any).parameters).length}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-orange-600">Not configured</span>
          )}
        </div>

        {/* Execution Info */}
        {data.lastExecuted && (
          <div className="mt-3 pt-2 border-t border-green-200 text-xs text-gray-500">
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
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
};

export default TransformNode;
