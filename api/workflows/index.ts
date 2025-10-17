import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_utils/cors';
import { asyncHandler, handleError, createValidationError } from '../_utils/errorHandler';

// Mock database query function - replace with actual database connection
const query = async (sql: string, params: any[] = []): Promise<any> => {
  // This is a placeholder for the actual database query
  // In a real deployment, you'd connect to your actual database here
  console.log('Mock query:', sql, params);
  return { rows: [] };
};

// GET /api/workflows
const getAllWorkflows = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
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
  
  try {
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM workflows ${whereClause}`,
      queryParams
    );
    const total = countResult.rows?.[0]?.total || 0;
    
    // Get workflows
    const workflowsResult = await query(
      `SELECT * FROM workflows ${whereClause} ORDER BY created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      [...queryParams, Number(limit), offset]
    );

    res.json({
      success: true,
      data: workflowsResult.rows || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/workflows
const createWorkflow = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  const { name, description, nodes, edges } = req.body;

  if (!name) {
    throw createValidationError('Workflow name is required');
  }

  // Validate nodes and edges here if needed
  
  const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const result = await query(
      `INSERT INTO workflows (id, name, description, nodes, edges, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [workflowId, name, description, JSON.stringify(nodes || []), JSON.stringify(edges || []), 'draft']
    );

    res.status(201).json({
      success: true,
      data: result.rows?.[0],
      message: 'Workflow created successfully'
    });
  } catch (error) {
    handleError(error, res);
  }
};

export default asyncHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (handleCors(req, res)) return;

  switch (req.method) {
    case 'GET':
      await getAllWorkflows(req, res);
      break;
    case 'POST':
      await createWorkflow(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
      break;
  }
});
