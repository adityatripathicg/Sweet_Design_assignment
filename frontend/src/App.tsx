import React, { useState, useCallback, useRef, Suspense, lazy } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  ReactFlowProvider,
  Panel,
  BackgroundVariant,
} from 'reactflow';
import { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import './index.css';

import { WorkflowNode } from './types/workflow';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import main shell components normally for immediate availability
import Sidebar from './components/Sidebar';
import NodeConfigPanel from './components/NodeConfigPanel';
import Toolbar from './components/Toolbar';

// Only lazy load the heavy node components
const DatabaseNode = lazy(() => import('./components/nodes/DatabaseNode'));
const AINode = lazy(() => import('./components/nodes/AINode'));
const TransformNode = lazy(() => import('./components/nodes/TransformNode'));
const OutputNode = lazy(() => import('./components/nodes/OutputNode'));

// Loading component for Suspense fallbacks
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
    <span className="ml-2 text-sm text-gray-600">Loading...</span>
  </div>
);

// Custom node types
const nodeTypes = {
  database: DatabaseNode,
  ai: AINode,
  transform: TransformNode,
  output: OutputNode,
};

const initialNodes: WorkflowNode[] = [];
const initialEdges: Edge[] = [];

function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        animated: true,
        style: { stroke: '#0ea5e9', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      toast.success('Nodes connected successfully!');
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNode(node);
    // Auto-open config panel on mobile when node is selected
    if (window.innerWidth < 1024) {
      setConfigPanelOpen(true);
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      // Check if the dropped element is valid
      if (!nodeData || typeof nodeData !== 'object') {
        return;
      }

      const position = reactFlowInstance.current.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: WorkflowNode = {
        id: `${nodeData.type}_${Date.now()}`,
        type: nodeData.type,
        position,
        data: {
          label: nodeData.label,
          type: nodeData.type,
          config: nodeData.defaultConfig || {},
          status: 'idle',
        },
      };

      setNodes((nds) => nds.concat(newNode));
      toast.success(`${nodeData.label} node added to workflow!`);
    },
    [setNodes]
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<WorkflowNode['data']>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
      toast.info('Node deleted from workflow');
    },
    [setNodes, setEdges, selectedNode]
  );

  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setWorkflowName('Untitled Workflow');
    toast.info('Workflow cleared');
  }, [setNodes, setEdges]);

  const saveWorkflow = useCallback(async () => {
    try {
      const workflow = {
        name: workflowName,
        nodes,
        edges,
      };
      
      // TODO: Implement API call to save workflow
      console.log('Saving workflow:', workflow);
      toast.success('Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    }
  }, [workflowName, nodes, edges]);

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      toast.warning('Add nodes to the workflow before executing');
      return;
    }

    setIsExecuting(true);
    try {
      // TODO: Implement workflow execution logic
      console.log('Executing workflow with nodes:', nodes);
      
      // Simulate execution
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        updateNodeData(node.id, { status: 'processing' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateNodeData(node.id, { status: 'success', lastExecuted: new Date() });
      }
      
      toast.success('Workflow executed successfully!');
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute workflow');
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, updateNodeData]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <Toolbar
        workflowName={workflowName}
        onWorkflowNameChange={setWorkflowName}
        onSave={saveWorkflow}
        onExecute={executeWorkflow}
        onClear={clearWorkflow}
        isExecuting={isExecuting}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenConfig={() => setConfigPanelOpen(true)}
        selectedNodeExists={!!selectedNode}
      />

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col lg:grid lg:grid-cols-workflow">
        {/* Mobile Sidebar Overlay */}
        <div className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className={`absolute left-0 top-0 h-full w-80 max-w-full bg-white transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Center Canvas */}
        <div className="relative flex-1" ref={reactFlowWrapper}>
          <Suspense fallback={<LoadingSpinner />}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onInit={(instance) => {
                reactFlowInstance.current = instance;
              }}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[20, 20]}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />
            <Controls
              position="bottom-right"
              className="bg-white border border-gray-200 rounded-lg shadow-lg"
            />
            <MiniMap
              nodeColor="#0ea5e9"
              nodeStrokeWidth={3}
              position="bottom-left"
              className="bg-white border border-gray-200 rounded-lg"
            />
            <Panel position="top-center" className="bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Nodes: {nodes.length}</span>
                <span>Connections: {edges.length}</span>
                {isExecuting && (
                  <span className="text-warning-600 font-medium loading-dots">
                    Executing workflow
                  </span>
                )}
              </div>
            </Panel>
            </ReactFlow>
          </Suspense>
        </div>

        {/* Mobile Config Panel Overlay */}
        <div className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${configPanelOpen && selectedNode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setConfigPanelOpen(false)} />
          <div className={`absolute right-0 top-0 h-full w-80 max-w-full bg-white transition-transform duration-300 ${configPanelOpen && selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
            <NodeConfigPanel
              selectedNode={selectedNode}
              onUpdateNode={updateNodeData}
              onDeleteNode={deleteNode}
              onClose={() => setConfigPanelOpen(false)}
            />
          </div>
        </div>

        {/* Desktop Right Configuration Panel */}
        <div className="hidden lg:block">
          <NodeConfigPanel
            selectedNode={selectedNode}
            onUpdateNode={updateNodeData}
            onDeleteNode={deleteNode}
          />
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder />
    </ReactFlowProvider>
  );
}

export default App;
