import React, { useState } from 'react';
import { 
  Save, 
  Play, 
  Trash2, 
  Download, 
  Upload, 
  Settings,
  HelpCircle,
  Loader2,
  Menu,
  PanelRightOpen
} from 'lucide-react';

interface ToolbarProps {
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
  onSave: () => void;
  onExecute: () => void;
  onClear: () => void;
  isExecuting: boolean;
  onOpenSidebar?: () => void;
  onOpenConfig?: () => void;
  selectedNodeExists?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  workflowName,
  onWorkflowNameChange,
  onSave,
  onExecute,
  onClear,
  isExecuting,
  onOpenSidebar,
  onOpenConfig,
  selectedNodeExists,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(workflowName);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setTempName(workflowName);
  };

  const handleNameSave = () => {
    onWorkflowNameChange(tempName);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(workflowName);
    setIsEditingName(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo and Workflow Name */}
        <div className="flex items-center space-x-4">
          {/* Mobile Navigation Buttons */}
          <div className="flex lg:hidden items-center space-x-2">
            {onOpenSidebar && (
              <button
                onClick={onOpenSidebar}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
                title="Open Components"
                aria-label="Open components sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {onOpenConfig && selectedNodeExists && (
              <button
                onClick={onOpenConfig}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
                title="Configure Node"
                aria-label="Open node configuration"
              >
                <PanelRightOpen className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SD</span>
            </div>
            <span className="font-bold text-gray-800 hidden sm:block">Sweet Design Hub</span>
          </div>
          
          <div className="h-6 w-px bg-gray-300" />
          
          {isEditingName ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleKeyPress}
                className="px-2 py-1 text-lg font-semibold bg-transparent border-b-2 border-primary-500 focus:outline-none min-w-0"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={handleNameEdit}
              className="text-lg font-semibold text-gray-800 hover:text-primary-600 transition-colors duration-150"
            >
              {workflowName}
            </button>
          )}
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={onSave}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
              title="Save workflow"
            >
              <Save className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              onClick={onExecute}
              disabled={isExecuting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              title={isExecuting ? 'Executing workflow...' : 'Execute workflow'}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Execute</span>
                </>
              )}
            </button>

            <button
              onClick={onClear}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
              title="Clear workflow"
            >
              <Trash2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex items-center space-x-1">
            <button
              title="Export Workflow"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              title="Import Workflow"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              title="Settings"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              title="Help"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
