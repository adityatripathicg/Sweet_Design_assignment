import { v4 as uuidv4 } from 'uuid';
import { 
  Workflow, 
  WorkflowExecution, 
  NodeExecution, 
  WorkflowNode, 
  ExecutionContext,
  NodeStatus,
  WorkflowStatus
} from '../types';
import { query } from '../database/mockConnection';
import { DatabaseService } from './DatabaseService';
import { AIService } from './AIService';
import { TransformService } from './TransformService';
import { OutputService } from './OutputService';
import { validateExecutionOrder } from '../utils/validation';
import { logWorkflowExecution, logNodeExecution } from '../middleware/logger';

export class WorkflowExecutionService {
  private databaseService: DatabaseService;
  private aiService: AIService;
  private transformService: TransformService;
  private outputService: OutputService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.aiService = new AIService();
    this.transformService = new TransformService();
    this.outputService = new OutputService();
  }

  async executeWorkflow(workflow: Workflow, inputData?: any): Promise<WorkflowExecution> {
    const executionId = uuidv4();
    const startTime = Date.now();

    // Create execution record
    const execution: WorkflowExecution = {
      id: executionId,
      workflow_id: workflow.id,
      status: 'running',
      input_data: inputData,
      started_at: new Date(),
    };

    try {
      // Insert execution record
      await query(
        `INSERT INTO workflow_executions (id, workflow_id, status, input_data, started_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [execution.id, execution.workflow_id, execution.status, execution.input_data, execution.started_at]
      );

      // Validate and get execution order
      const executionOrder = validateExecutionOrder(
        workflow.config.nodes, 
        workflow.config.edges
      );

      if (executionOrder.length !== workflow.config.nodes.length) {
        throw new Error('Workflow contains cycles or invalid dependencies');
      }

      // Create execution context
      const context: ExecutionContext = {
        workflowId: workflow.id,
        executionId: executionId,
        nodes: workflow.config.nodes,
        edges: workflow.config.edges,
        currentData: inputData || null,
        nodeExecutions: new Map(),
      };

      // Execute nodes in topological order
      for (const nodeId of executionOrder) {
        const node = workflow.config.nodes.find(n => n.id === nodeId);
        if (!node) {
          throw new Error(`Node ${nodeId} not found in workflow`);
        }

        await this.executeNode(node, context);
      }

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Update execution record with success
      await query(
        `UPDATE workflow_executions 
         SET status = $1, completed_at = NOW(), execution_time_ms = $2 
         WHERE id = $3`,
        ['completed', executionTime, executionId]
      );

      execution.status = 'completed';
      execution.completed_at = new Date();
      execution.execution_time_ms = executionTime;

      logWorkflowExecution(workflow.id, executionId, 'completed', executionTime);

      return execution;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Update execution record with error
      await query(
        `UPDATE workflow_executions 
         SET status = $1, error_message = $2, completed_at = NOW(), execution_time_ms = $3 
         WHERE id = $4`,
        ['error', error.message, executionTime, executionId]
      );

      execution.status = 'error';
      execution.error_message = error.message;
      execution.completed_at = new Date();
      execution.execution_time_ms = executionTime;

      logWorkflowExecution(workflow.id, executionId, 'error', executionTime, error.message);

      return execution;
    }
  }

  private async executeNode(node: WorkflowNode, context: ExecutionContext): Promise<void> {
    const nodeExecutionId = uuidv4();
    const startTime = Date.now();

    // Create node execution record
    const nodeExecution: NodeExecution = {
      id: nodeExecutionId,
      workflow_execution_id: context.executionId,
      node_id: node.id,
      node_type: node.type,
      status: 'running',
      input_data: context.currentData,
      started_at: new Date(),
    };

    try {
      // Insert node execution record
      await query(
        `INSERT INTO node_executions 
         (id, workflow_execution_id, node_id, node_type, status, input_data, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          nodeExecution.id, 
          nodeExecution.workflow_execution_id, 
          nodeExecution.node_id,
          nodeExecution.node_type, 
          nodeExecution.status, 
          nodeExecution.input_data, 
          nodeExecution.started_at
        ]
      );

      // Get input data from predecessor nodes
      const inputData = await this.getNodeInputData(node, context);

      // Execute node based on type
      let outputData: any;
      switch (node.type) {
        case 'database':
          outputData = await this.databaseService.executeQuery(node.data.config, inputData);
          break;
        case 'ai':
          outputData = await this.aiService.processData(node.data.config, inputData);
          break;
        case 'transform':
          outputData = await this.transformService.transformData(node.data.config, inputData);
          break;
        case 'output':
          outputData = await this.outputService.sendOutput(node.data.config, inputData);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Update node execution with success
      await query(
        `UPDATE node_executions 
         SET status = $1, output_data = $2, completed_at = NOW(), execution_time_ms = $3 
         WHERE id = $4`,
        ['success', outputData, executionTime, nodeExecutionId]
      );

      nodeExecution.status = 'success';
      nodeExecution.output_data = outputData;
      nodeExecution.completed_at = new Date();
      nodeExecution.execution_time_ms = executionTime;

      // Store node execution in context
      context.nodeExecutions.set(node.id, nodeExecution);

      // Update current data for next nodes
      context.currentData = outputData;

      logNodeExecution(node.id, node.type, 'success', executionTime);

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Update node execution with error
      await query(
        `UPDATE node_executions 
         SET status = $1, error_message = $2, completed_at = NOW(), execution_time_ms = $3 
         WHERE id = $4`,
        ['error', error.message, executionTime, nodeExecutionId]
      );

      nodeExecution.status = 'error';
      nodeExecution.error_message = error.message;
      nodeExecution.completed_at = new Date();
      nodeExecution.execution_time_ms = executionTime;

      // Store failed node execution in context
      context.nodeExecutions.set(node.id, nodeExecution);

      logNodeExecution(node.id, node.type, 'error', executionTime, error.message);

      throw error;
    }
  }

  private async getNodeInputData(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    // Find predecessor nodes (nodes that have edges pointing to this node)
    const predecessorEdges = context.edges.filter(edge => edge.target === node.id);
    
    if (predecessorEdges.length === 0) {
      // No predecessors, use workflow input data
      return context.currentData;
    }

    if (predecessorEdges.length === 1) {
      // Single predecessor, use its output data
      const predecessorNodeId = predecessorEdges[0].source;
      const predecessorExecution = context.nodeExecutions.get(predecessorNodeId);
      return predecessorExecution?.output_data || null;
    }

    // Multiple predecessors, combine their output data
    const combinedData: any = {};
    for (const edge of predecessorEdges) {
      const predecessorExecution = context.nodeExecutions.get(edge.source);
      if (predecessorExecution?.output_data) {
        combinedData[edge.source] = predecessorExecution.output_data;
      }
    }

    return combinedData;
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    const result = await query(
      'SELECT * FROM workflow_executions WHERE id = $1',
      [executionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async getNodeExecutions(executionId: string): Promise<NodeExecution[]> {
    const result = await query(
      'SELECT * FROM node_executions WHERE workflow_execution_id = $1 ORDER BY started_at',
      [executionId]
    );

    return result.rows;
  }

  async cancelExecution(executionId: string): Promise<void> {
    // Note: This is a simplified implementation
    // In a production system, you'd need proper cancellation logic
    await query(
      `UPDATE workflow_executions 
       SET status = 'cancelled', completed_at = NOW() 
       WHERE id = $1 AND status = 'running'`,
      [executionId]
    );
  }
}
