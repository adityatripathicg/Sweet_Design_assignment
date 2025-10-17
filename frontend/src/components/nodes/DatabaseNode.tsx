import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { WorkflowNodeData } from '../../types/workflow';

interface DatabaseNodeData extends WorkflowNodeData {
  type: 'database';
}

const DatabaseNode: React.FC<NodeProps<DatabaseNodeData>> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'processing':
        return 'border-orange-500 bg-orange-50 animate-pulse';
      default:
        return 'border-blue-500 bg-blue-50';
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

  const getDatabaseTypeLabel = () => {
    const config = data.config as any;
    if (config?.type) {
      return config.type.toUpperCase();
    }
    return 'DB';
  };

  return (
    <div 
      className={`workflow-node ${getStatusColor()} ${selected ? 'ring-2 ring-primary-500' : ''}`}
      role="article"
      aria-label={`Database node: ${data.label}, Status: ${data.status}`}
      tabIndex={selected ? 0 : -1}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        aria-label="Input connection point"
      />

      <div className="px-4 py-3 min-w-[180px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-800 uppercase tracking-wide">
              {getDatabaseTypeLabel()}
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

        {/* Connection Info */}
        <div className="text-xs text-gray-600">
          {data.config && (data.config as any).host ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Host:</span>
                <span className="font-mono truncate max-w-20">
                  {(data.config as any).host}
                </span>
              </div>
              <div className="flex justify-between">
                <span>DB:</span>
                <span className="font-mono truncate max-w-20">
                  {(data.config as any).database || 'Not set'}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-orange-600">Not configured</span>
          )}
        </div>

        {/* Execution Info */}
        {data.lastExecuted && (
          <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Last run:</span>
              <span>{data.lastExecuted.toLocaleTimeString()}</span>
            </div>
            {data.executionTime && (
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{data.executionTime}ms</span>
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
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        aria-label="Output connection point"
      />
      
      {/* Screen reader status description */}
      <div className="sr-only">
        Status: {data.status}. 
        {data.errorMessage && `Error: ${data.errorMessage}. `}
        {data.lastExecuted && `Last executed at ${data.lastExecuted.toLocaleString()}. `}
      </div>
    </div>
  );
};

export default DatabaseNode;
