import { Request, Response } from 'express';
import { query } from '../database/mockConnection';
import { WorkflowExecutionService } from '../services/WorkflowExecutionService';
import { 
  createNotFoundError 
} from '../middleware/errorHandler';

const executionService = new WorkflowExecutionService();

// GET /api/execution/:id
export const getExecution = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM workflow_executions WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw createNotFoundError('Execution');
  }

  const execution = result.rows[0];

  // Also get the workflow details
  const workflowResult = await query(
    'SELECT id, name, description FROM workflows WHERE id = $1',
    [execution.workflow_id]
  );

  if (workflowResult.rows.length > 0) {
    execution.workflow = workflowResult.rows[0];
  }

  res.json({
    success: true,
    data: execution,
  });
};

// GET /api/execution/:id/status
export const getExecutionStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const execution = await executionService.getExecutionStatus(id);

  if (!execution) {
    throw createNotFoundError('Execution');
  }

  // Get progress information
  const nodeExecutions = await executionService.getNodeExecutions(id);
  
  const progress = {
    totalNodes: nodeExecutions.length,
    completedNodes: nodeExecutions.filter(n => n.status === 'success').length,
    errorNodes: nodeExecutions.filter(n => n.status === 'error').length,
    runningNodes: nodeExecutions.filter(n => n.status === 'running').length,
  };

  res.json({
    success: true,
    data: {
      ...execution,
      progress,
      isComplete: execution.status !== 'running',
    },
  });
};

// GET /api/execution/:id/nodes
export const getNodeExecutions = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Verify execution exists
  const execution = await executionService.getExecutionStatus(id);
  if (!execution) {
    throw createNotFoundError('Execution');
  }

  const nodeExecutions = await executionService.getNodeExecutions(id);

  res.json({
    success: true,
    data: nodeExecutions,
  });
};

// POST /api/execution/:id/cancel
export const cancelExecution = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Verify execution exists and is running
  const execution = await executionService.getExecutionStatus(id);
  if (!execution) {
    throw createNotFoundError('Execution');
  }

  if (execution.status !== 'running') {
    res.json({
      success: false,
      message: `Cannot cancel execution with status: ${execution.status}`,
    });
    return;
  }

  await executionService.cancelExecution(id);

  res.json({
    success: true,
    message: 'Execution cancelled successfully',
  });
};

// GET /api/execution
export const getAllExecutions = async (req: Request, res: Response): Promise<void> => {
  const { 
    workflowId, 
    status, 
    page = 1, 
    limit = 20,
    sortBy = 'started_at',
    sortOrder = 'desc'
  } = req.query;

  let whereClause = 'WHERE 1=1';
  const queryParams: any[] = [];
  let paramCounter = 1;

  // Filter by workflow ID
  if (workflowId) {
    whereClause += ` AND workflow_id = $${paramCounter}`;
    queryParams.push(workflowId);
    paramCounter++;
  }

  // Filter by status
  if (status) {
    whereClause += ` AND status = $${paramCounter}`;
    queryParams.push(status);
    paramCounter++;
  }

  // Validate and set sort parameters
  const validSortFields = ['started_at', 'completed_at', 'execution_time_ms', 'status'];
  const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'started_at';
  const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Calculate offset
  const offset = (Number(page) - 1) * Number(limit);

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM workflow_executions ${whereClause}`,
    queryParams
  );
  
  const total = parseInt(countResult.rows[0].total);

  // Get executions with workflow information
  const result = await query(
    `SELECT 
       we.*,
       w.name as workflow_name,
       w.description as workflow_description
     FROM workflow_executions we
     LEFT JOIN workflows w ON we.workflow_id = w.id
     ${whereClause}
     ORDER BY we.${sortField} ${sortDirection}
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
