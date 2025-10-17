export type NodeStatus = 'idle' | 'processing' | 'running' | 'success' | 'error';
export type WorkflowStatus = 'draft' | 'running' | 'completed' | 'error';
export type NodeType = 'database' | 'ai' | 'transform' | 'output';
export type DatabaseType = 'mysql' | 'postgresql' | 'mongodb';
export type OutputType = 'slack' | 'email' | 'webhook';

// Database Configuration Types
export interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

// AI Configuration Types
export interface AIConfig {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

// Transform Configuration Types
export interface TransformConfig {
  operation: 'filter' | 'map' | 'aggregate' | 'join';
  script: string;
  parameters: Record<string, any>;
}

// Output Configuration Types
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

// Workflow Node Types
export interface WorkflowNodeData {
  label: string;
  type: NodeType;
  config: NodeConfig;
  status: NodeStatus;
  lastExecuted?: Date;
  executionTime?: number;
  errorMessage?: string;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
}

// Database Entity Types
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  config: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    version: string;
  };
  status: WorkflowStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Connection {
  id: string;
  workflow_id: string;
  name: string;
  type: DatabaseType;
  config: any; // Encrypted connection details
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: WorkflowStatus;
  input_data?: any;
  output_data?: any;
  error_message?: string;
  execution_time_ms?: number;
  started_at: Date;
  completed_at?: Date;
}

export interface NodeExecution {
  id: string;
  workflow_execution_id: string;
  node_id: string;
  node_type: NodeType;
  status: NodeStatus;
  input_data?: any;
  output_data?: any;
  error_message?: string;
  execution_time_ms?: number;
  started_at: Date;
  completed_at?: Date;
}

// API Request/Response Types
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface ExecuteWorkflowRequest {
  inputData?: any;
}

export interface TestConnectionRequest {
  type: DatabaseType;
  config: DatabaseConfig;
}

export interface ProcessAIRequest {
  model: string;
  prompt: string;
  data: any;
  temperature?: number;
  maxTokens?: number;
}

// Service Response Types
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  latency?: number;
}

export interface AIProcessResult {
  success: boolean;
  result?: string;
  error?: string;
  tokens_used?: number;
  processing_time?: number;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Error Types
export interface APIError {
  message: string;
  code?: string;
  status: number;
  details?: any;
}

// Execution Context
export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  currentData: any;
  nodeExecutions: Map<string, NodeExecution>;
}
