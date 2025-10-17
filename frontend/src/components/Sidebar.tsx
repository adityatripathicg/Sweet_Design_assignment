import React from 'react';
import { 
  Database, 
  Brain, 
  Settings, 
  Send,
  Slack,
  Mail,
  Globe,
  Plus
} from 'lucide-react';
import { DraggableNodeType } from '../types/workflow';

const nodeTypes: DraggableNodeType[] = [
  {
    type: 'database',
    label: 'Database',
    description: 'Connect to MySQL, PostgreSQL, or MongoDB',
    icon: <Database className="w-6 h-6" />,
    defaultConfig: {
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
    },
    color: 'blue',
  },
  {
    type: 'ai',
    label: 'AI Processor',
    description: 'Analyze data using Groq AI models',
    icon: <Brain className="w-6 h-6" />,
    defaultConfig: {
      model: 'mixtral-8x7b-32768',
      prompt: 'Analyze the following data and provide insights:',
      temperature: 0.7,
      maxTokens: 1000,
    },
    color: 'purple',
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Filter, map, or transform data',
    icon: <Settings className="w-6 h-6" />,
    defaultConfig: {
      operation: 'map',
      script: '// Transform your data here\nreturn data.map(item => ({ ...item, processed: true }));',
      parameters: {},
    },
    color: 'green',
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Send results to Slack, Email, or Webhook',
    icon: <Send className="w-6 h-6" />,
    defaultConfig: {
      type: 'webhook',
      webhook: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    color: 'orange',
  },
];


const getColorClasses = (color: string) => {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
    green: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
    orange: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.blue;
};

const DraggableNode: React.FC<{ nodeType: DraggableNodeType }> = ({ nodeType }) => {
  const onDragStart = (event: React.DragEvent, nodeType: DraggableNodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow keyboard users to interact with draggable nodes
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Could implement keyboard-based node addition here
    }
  };

  return (
    <div
      className={`p-4 border-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:outline-none ${getColorClasses(nodeType.color)}`}
      onDragStart={(event) => onDragStart(event, nodeType)}
      onKeyDown={handleKeyDown}
      draggable
      tabIndex={0}
      role="button"
      aria-label={`Drag ${nodeType.label} node to canvas. ${nodeType.description}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {nodeType.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1">{nodeType.label}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {nodeType.description}
          </p>
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <div className="bg-white border-r border-gray-200 p-4 overflow-y-auto custom-scrollbar h-full">
      {/* Mobile Close Button */}
      {onClose && (
        <div className="lg:hidden mb-4 pb-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-150"
            aria-label="Close sidebar"
          >
            ← Close
          </button>
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Workflow Components</h2>
        <p className="text-sm text-gray-600">
          Drag and drop components to build your workflow
        </p>
      </div>

      <div className="space-y-4">
        {nodeTypes.map((nodeType) => (
          <DraggableNode key={nodeType.type} nodeType={nodeType} />
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150 flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Test Connection</span>
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Output Examples</h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Slack className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Slack Integration</span>
            </div>
            <p className="text-xs text-gray-600">
              Send workflow results to Slack channels
            </p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Email Notifications</span>
            </div>
            <p className="text-xs text-gray-600">
              Send email alerts and reports
            </p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Webhook APIs</span>
            </div>
            <p className="text-xs text-gray-600">
              Send data to external services
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
