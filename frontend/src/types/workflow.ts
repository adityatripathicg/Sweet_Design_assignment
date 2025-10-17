import { Node, Edge } from 'reactflow';

export type NodeStatus = 'idle' | 'processing' | 'running' | 'success' | 'error';
export type WorkflowStatus = 'draft' | 'running' | 'completed' | 'error';

export type NodeType = 'database' | 'ai' | 'transform' | 'output';
export type DatabaseType = 'mysql' | 'postgresql' | 'mongodb';
export type OutputType = 'slack' | 'email' | 'webhook';

export interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface AIConfig {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TransformConfig {
  operation: 'filter' | 'map' | 'aggregate' | 'join';
  script: string;
  parameters: Record<string, any>;
}

export interface OutputConfig {
  type: OutputType;
  webhook?: {
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
  };
  slack?: {
    webhook: string;
    channel?: string;
  };
  email?: {
    to: string[];
    subject: string;
    template?: string;
  };
}

export type NodeConfig = DatabaseConfig | AIConfig | TransformConfig | OutputConfig;

export interface WorkflowNodeData {
  label: string;
  type: NodeType;
  config: NodeConfig;
  status: NodeStatus;
  lastExecuted?: Date;
  executionTime?: number;
  errorMessage?: string;
}

export interface WorkflowNode extends Node {
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: React.CSSProperties;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  inputData?: any;
  outputData?: any;
  errorMessage?: string;
  executionTimeMs?: number;
  startedAt: Date;
  completedAt?: Date;
  nodeExecutions: NodeExecution[];
}

export interface NodeExecution {
  id: string;
  workflowExecutionId: string;
  nodeId: string;
  nodeType: NodeType;
  status: NodeStatus;
  inputData?: any;
  outputData?: any;
  errorMessage?: string;
  executionTimeMs?: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface DraggableNodeType {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultConfig: Partial<NodeConfig>;
  color: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface WorkflowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
