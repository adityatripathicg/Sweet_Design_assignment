import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/mockConnection';
import { 
  AppError, 
  createNotFoundError, 
  createValidationError 
} from '../middleware/errorHandler';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  CreateWorkflowRequest, 
  UpdateWorkflowRequest,
  ExecuteWorkflowRequest,
  WorkflowValidationResult
} from '../types';
import { WorkflowExecutionService } from '../services/WorkflowExecutionService';
import { validateWorkflowNodes, validateWorkflowEdges } from '../utils/validation';
import { logWorkflowExecution } from '../middleware/logger';

const executionService = new WorkflowExecutionService();

// GET /api/workflows
export const getAllWorkflows = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, search, status } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const queryParams: any[] = [];
  let paramCounter = 1;

  // Add search filter
  if (search) {
    whereClause += ` AND (name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`;
    queryParams.push(`%${search}%`);
    paramCounter++;
  }

  // Add status filter
  if (status) {
    whereClause += ` AND status = $${paramCounter}`;
    queryParams.push(status);
    paramCounter++;
  }

  // Calculate offset
  const offset = (Number(page) - 1) * Number(limit);
  
  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM workflows ${whereClause}`,
    queryParams
  );
  
  const total = parseInt(countResult.rows[0].total);

  // Get workflows with pagination
  const result = await query(
    `SELECT id, name, description, status, created_at, updated_at,
            jsonb_array_length(config->'nodes') as node_count,
            jsonb_array_length(config->'edges') as edge_count
     FROM workflows 
     ${whereClause}
     ORDER BY updated_at DESC 
     LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
    [...queryParams, Number(limit), offset]
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

// POST /api/workflows
export const createWorkflow = async (req: Request, res: Response): Promise<void> => {
  const { name, description, nodes = [], edges = [] }: CreateWorkflowRequest = req.body;

  if (!name || name.trim().length === 0) {
    throw createValidationError('Workflow name is required');
  }

  // Validate nodes and edges
  const nodeValidation = validateWorkflowNodes(nodes);
  if (!nodeValidation.isValid) {
    throw createValidationError('Invalid workflow nodes', nodeValidation.errors);
  }

  const edgeValidation = validateWorkflowEdges(edges, nodes);
  if (!edgeValidation.isValid) {
    throw createValidationError('Invalid workflow edges', edgeValidation.errors);
  }

  const workflowId = uuidv4();
  const config = {
    nodes,
    edges,
    version: '1.0.0',
  };

  const result = await query(
    `INSERT INTO workflows (id, name, description, config, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [workflowId, name.trim(), description?.trim(), JSON.stringify(config), 'draft']
  );

  const workflow = result.rows[0];
  workflow.config = JSON.parse(workflow.config);

  res.status(201).json({
    success: true,
    data: workflow,
    message: 'Workflow created successfully',
  });
};

// GET /api/workflows/:id
export const getWorkflowById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM workflows WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw createNotFoundError('Workflow');
  }

  const workflow = result.rows[0];
  workflow.config = JSON.parse(workflow.config);

  res.json({
    success: true,
    data: workflow,
  });
};

// PUT /api/workflows/:id
export const updateWorkflow = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, nodes, edges }: UpdateWorkflowRequest = req.body;

  // Check if workflow exists
  const existingResult = await query(
    'SELECT * FROM workflows WHERE id = $1',
    [id]
  );

  if (existingResult.rows.length === 0) {
    throw createNotFoundError('Workflow');
  }

  const existingWorkflow = existingResult.rows[0];
  const existingConfig = JSON.parse(existingWorkflow.config);

  // Prepare update fields
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramCounter = 1;

  // Update name if provided
  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      throw createValidationError('Workflow name cannot be empty');
    }
    updateFields.push(`name = $${paramCounter}`);
    updateValues.push(name.trim());
    paramCounter++;
  }

  // Update description if provided
  if (description !== undefined) {
    updateFields.push(`description = $${paramCounter}`);
    updateValues.push(description?.trim());
    paramCounter++;
  }

  // Update config if nodes or edges provided
  if (nodes !== undefined || edges !== undefined) {
    const newNodes = nodes || existingConfig.nodes;
    const newEdges = edges || existingConfig.edges;

    // Validate the new configuration
    const nodeValidation = validateWorkflowNodes(newNodes);
    if (!nodeValidation.isValid) {
      throw createValidationError('Invalid workflow nodes', nodeValidation.errors);
    }

    const edgeValidation = validateWorkflowEdges(newEdges, newNodes);
    if (!edgeValidation.isValid) {
      throw createValidationError('Invalid workflow edges', edgeValidation.errors);
    }

    const newConfig = {
      ...existingConfig,
      nodes: newNodes,
      edges: newEdges,
      version: '1.0.0',
    };

    updateFields.push(`config = $${paramCounter}`);
    updateValues.push(JSON.stringify(newConfig));
    paramCounter++;
  }

  // Add updated_at
  updateFields.push(`updated_at = NOW()`);

  if (updateFields.length === 1) { // Only updated_at
    throw createValidationError('No fields to update');
  }

  // Add workflow ID for WHERE clause
  updateValues.push(id);

  const result = await query(
    `UPDATE workflows SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
    updateValues
  );

  const workflow = result.rows[0];
  workflow.config = JSON.parse(workflow.config);

  res.json({
    success: true,
    data: workflow,
    message: 'Workflow updated successfully',
  });
};

// DELETE /api/workflows/:id
export const deleteWorkflow = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM workflows WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw createNotFoundError('Workflow');
  }

  res.json({
    success: true,
    message: 'Workflow deleted successfully',
  });
};

// POST /api/workflows/:id/run
export const executeWorkflow = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { inputData }: ExecuteWorkflowRequest = req.body;

  // Get workflow
  const workflowResult = await query(
    'SELECT * FROM workflows WHERE id = $1',
    [id]
  );

  if (workflowResult.rows.length === 0) {
    throw createNotFoundError('Workflow');
  }

  const workflow = workflowResult.rows[0];
  workflow.config = JSON.parse(workflow.config);

  try {
    // Update workflow status to running
    await query(
      'UPDATE workflows SET status = $1 WHERE id = $2',
      ['running', id]
    );

    // Execute workflow
    const execution = await executionService.executeWorkflow(workflow, inputData);
    
    // Update workflow status based on execution result
    const finalStatus = execution.status === 'completed' ? 'completed' : 'error';
    await query(
      'UPDATE workflows SET status = $1 WHERE id = $2',
      [finalStatus, id]
    );

    logWorkflowExecution(
      id,
      execution.id,
      execution.status,
      execution.execution_time_ms,
      execution.error_message
    );

    res.json({
      success: true,
      data: execution,
      message: execution.status === 'completed' 
        ? 'Workflow executed successfully' 
        : 'Workflow execution completed with errors',
    });

  } catch (error: any) {
    // Update workflow status to error
    await query(
      'UPDATE workflows SET status = $1 WHERE id = $2',
      ['error', id]
    );

    logWorkflowExecution(id, 'failed', 'error', undefined, error.message);
    throw error;
  }
};

// GET /api/workflows/:id/executions
export const getWorkflowExecutions = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if workflow exists
  const workflowResult = await query(
    'SELECT id FROM workflows WHERE id = $1',
    [id]
  );

  if (workflowResult.rows.length === 0) {
    throw createNotFoundError('Workflow');
  }

  const offset = (Number(page) - 1) * Number(limit);

  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) as total FROM workflow_executions WHERE workflow_id = $1',
    [id]
  );
  
  const total = parseInt(countResult.rows[0].total);

  // Get executions
  const result = await query(
    `SELECT * FROM workflow_executions 
     WHERE workflow_id = $1 
     ORDER BY started_at DESC 
     LIMIT $2 OFFSET $3`,
    [id, Number(limit), offset]
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

// POST /api/workflows/:id/validate
export const validateWorkflow = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Get workflow
  const result = await query(
    'SELECT * FROM workflows WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw createNotFoundError('Workflow');
  }

  const workflow = result.rows[0];
  const config = JSON.parse(workflow.config);

  // Validate nodes and edges
  const nodeValidation = validateWorkflowNodes(config.nodes);
  const edgeValidation = validateWorkflowEdges(config.edges, config.nodes);

  const validation: WorkflowValidationResult = {
    isValid: nodeValidation.isValid && edgeValidation.isValid,
    errors: [...nodeValidation.errors, ...edgeValidation.errors],
    warnings: [...(nodeValidation.warnings || []), ...(edgeValidation.warnings || [])],
  };

  res.json({
    success: true,
    data: validation,
  });
};

// POST /api/workflows/:id/duplicate
export const duplicateWorkflow = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name } = req.body;

  // Get original workflow
  const result = await query(
    'SELECT * FROM workflows WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw createNotFoundError('Workflow');
  }

  const originalWorkflow = result.rows[0];
  const newWorkflowId = uuidv4();
  const newName = name || `${originalWorkflow.name} (Copy)`;

  // Create duplicate
  const duplicateResult = await query(
    `INSERT INTO workflows (id, name, description, config, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [newWorkflowId, newName, originalWorkflow.description, originalWorkflow.config, 'draft']
  );

  const duplicateWorkflow = duplicateResult.rows[0];
  duplicateWorkflow.config = JSON.parse(duplicateWorkflow.config);

  res.status(201).json({
    success: true,
    data: duplicateWorkflow,
    message: 'Workflow duplicated successfully',
  });
};
