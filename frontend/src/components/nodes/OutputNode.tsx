import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Send, AlertCircle, CheckCircle, Loader2, Slack, Mail, Globe } from 'lucide-react';
import { WorkflowNodeData } from '../../types/workflow';

interface OutputNodeData extends WorkflowNodeData {
  type: 'output';
}

const OutputNode: React.FC<NodeProps<OutputNodeData>> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'processing':
        return 'border-orange-500 bg-orange-50 animate-pulse';
      default:
        return 'border-orange-500 bg-orange-50';
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

  const getOutputTypeIcon = () => {
    const config = data.config as any;
    switch (config?.type) {
      case 'slack':
        return <Slack className="w-4 h-4 text-green-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'webhook':
        return <Globe className="w-4 h-4 text-purple-600" />;
      default:
        return <Send className="w-4 h-4 text-orange-600" />;
    }
  };

  const getOutputTypeLabel = () => {
    const config = data.config as any;
    if (config?.type) {
      return config.type.toUpperCase();
    }
    return 'OUTPUT';
  };

  const getDestinationInfo = () => {
    const config = data.config as any;
    if (!config?.type) return 'Not configured';

    switch (config.type) {
      case 'slack':
        return config.slack?.channel ? `#${config.slack.channel}` : 'Slack webhook';
      case 'email':
        return config.email?.to?.length > 0 
          ? `${config.email.to.length} recipient(s)` 
          : 'No recipients';
      case 'webhook':
        if (config.webhook?.url) {
          const url = new URL(config.webhook.url);
          return url.hostname;
        }
        return 'No URL set';
      default:
        return 'Unknown type';
    }
  };

  const getMethodInfo = () => {
    const config = data.config as any;
    if (config?.type === 'webhook' && config.webhook?.method) {
      return config.webhook.method;
    }
    return null;
  };

  return (
    <div className={`workflow-node ${getStatusColor()} ${selected ? 'ring-2 ring-primary-500' : ''}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />

      <div className="px-4 py-3 w-[220px] max-w-[220px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getOutputTypeIcon()}
            <span className="text-xs font-medium text-orange-800 uppercase tracking-wide">
              {getOutputTypeLabel()}
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

        {/* Output Configuration Info */}
        <div className="text-xs text-gray-600">
          {data.config ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                <span className="text-gray-500 text-xs">Type:</span>
                <span className="font-medium capitalize text-xs truncate">
                  {(data.config as any).type || 'Not set'}
                </span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                <span className="text-gray-500 text-xs">Destination:</span>
                <span className="font-mono text-xs truncate leading-tight">
                  {getDestinationInfo()}
                </span>
              </div>
              {getMethodInfo() && (
                <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                  <span className="text-gray-500 text-xs">Method:</span>
                  <span className="font-medium text-xs truncate">
                    {getMethodInfo()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-orange-600">Not configured</span>
          )}
        </div>

        {/* Execution Info */}
        {data.lastExecuted && (
          <div className="mt-3 pt-2 border-t border-orange-200 text-xs text-gray-500">
            <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
              <span className="text-gray-500 text-xs">Last sent:</span>
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

      {/* No output handle since this is a terminal node */}
    </div>
  );
};

export default OutputNode;
