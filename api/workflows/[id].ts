import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_utils/cors';
import { asyncHandler, handleError, createNotFoundError, createValidationError } from '../_utils/errorHandler';

// Mock database query function
const query = async (sql: string, params: any[] = []): Promise<any> => {
  console.log('Mock query:', sql, params);
  return { rows: [] };
};

// GET /api/workflows/[id]
const getWorkflowById = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  const { id } = req.query;

  try {
    const result = await query('SELECT * FROM workflows WHERE id = $1', [id]);
    
    if (!result.rows?.length) {
      throw createNotFoundError('Workflow not found');
    }

    const workflow = result.rows[0];
    
    res.json({
      success: true,
      data: {
        ...workflow,
        nodes: typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes,
        edges: typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges
      }
    });
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/workflows/[id]
const updateWorkflow = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  const { id } = req.query;
  const { name, description, nodes, edges, status } = req.body;

  try {
    // Check if workflow exists
    const existingResult = await query('SELECT id FROM workflows WHERE id = $1', [id]);
    if (!existingResult.rows?.length) {
      throw createNotFoundError('Workflow not found');
    }

    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCounter++}`);
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCounter++}`);
      updateValues.push(description);
    }
    if (nodes !== undefined) {
      updateFields.push(`nodes = $${paramCounter++}`);
      updateValues.push(JSON.stringify(nodes));
    }
    if (edges !== undefined) {
      updateFields.push(`edges = $${paramCounter++}`);
      updateValues.push(JSON.stringify(edges));
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCounter++}`);
      updateValues.push(status);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await query(
      `UPDATE workflows SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      data: result.rows?.[0],
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    handleError(error, res);
  }
};

// DELETE /api/workflows/[id]
const deleteWorkflow = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  const { id } = req.query;

  try {
    const result = await query('DELETE FROM workflows WHERE id = $1 RETURNING id', [id]);
    
    if (!result.rows?.length) {
      throw createNotFoundError('Workflow not found');
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    handleError(error, res);
  }
};

export default asyncHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (handleCors(req, res)) return;

  switch (req.method) {
    case 'GET':
      await getWorkflowById(req, res);
      break;
    case 'PUT':
      await updateWorkflow(req, res);
      break;
    case 'DELETE':
      await deleteWorkflow(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
      break;
  }
});
