import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/mockConnection';
import { DatabaseService } from '../services/DatabaseService';
import { 
  AppError, 
  createNotFoundError, 
  createValidationError 
} from '../middleware/errorHandler';
import { 
  DatabaseConfig, 
  TestConnectionRequest,
  Connection
} from '../types';

const databaseService = new DatabaseService();

// POST /api/connections/test
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  const { type, config }: TestConnectionRequest = req.body;

  if (!type || !config) {
    throw createValidationError('Database type and config are required');
  }

  // Validate required config fields
  const requiredFields = ['host', 'port', 'database', 'username', 'password'];
  for (const field of requiredFields) {
    if (!(field in config)) {
      throw createValidationError(`${field} is required in database config`);
    }
  }

  const dbConfig: DatabaseConfig = {
    type,
    ...config,
  };

  const result = await databaseService.testConnection(dbConfig);

  res.json({
    success: result.success,
    data: result,
    message: result.message,
  });
};

// GET /api/connections
export const getAllConnections = async (req: Request, res: Response): Promise<void> => {
  const { workflowId } = req.query;

  let whereClause = 'WHERE 1=1';
  const queryParams: any[] = [];

  if (workflowId) {
    whereClause += ' AND workflow_id = $1';
    queryParams.push(workflowId);
  }

  const result = await query(
    `SELECT id, workflow_id, name, type, is_active, created_at, updated_at
     FROM connections 
     ${whereClause}
     ORDER BY created_at DESC`,
    queryParams
  );

  res.json({
    success: true,
    data: result.rows,
  });
};

// POST /api/connections
export const createConnection = async (req: Request, res: Response): Promise<void> => {
  const { workflowId, name, type, config } = req.body;

  if (!name || name.trim().length === 0) {
    throw createValidationError('Connection name is required');
  }

  if (!type) {
    throw createValidationError('Database type is required');
  }

  if (!config) {
    throw createValidationError('Database configuration is required');
  }

  // Validate the connection configuration
  const dbConfig: DatabaseConfig = {
    type,
    ...config,
  };

  const testResult = await databaseService.testConnection(dbConfig);
  if (!testResult.success) {
    throw createValidationError(`Connection test failed: ${testResult.message}`);
  }

  // Encrypt the configuration before storing
  const encryptedConfig = databaseService.encryptConnectionConfig(dbConfig);
  const connectionId = uuidv4();

  const result = await query(
    `INSERT INTO connections (id, workflow_id, name, type, config, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, workflow_id, name, type, is_active, created_at, updated_at`,
    [connectionId, workflowId || null, name.trim(), type, encryptedConfig, true]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0],
    message: 'Database connection created successfully',
  });
};

// GET /api/connections/:id
export const getConnectionById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await query(
    'SELECT id, workflow_id, name, type, is_active, created_at, updated_at FROM connections WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw createNotFoundError('Connection');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
};

// PUT /api/connections/:id
export const updateConnection = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, type, config, isActive } = req.body;

  // Check if connection exists
  const existingResult = await query(
    'SELECT * FROM connections WHERE id = $1',
    [id]
  );

  if (existingResult.rows.length === 0) {
    throw createNotFoundError('Connection');
  }

  // Prepare update fields
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramCounter = 1;

  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      throw createValidationError('Connection name cannot be empty');
    }
    updateFields.push(`name = $${paramCounter}`);
    updateValues.push(name.trim());
    paramCounter++;
  }

  if (type !== undefined) {
    updateFields.push(`type = $${paramCounter}`);
    updateValues.push(type);
    paramCounter++;
  }

  if (config !== undefined) {
    // Test the new configuration
    const dbConfig: DatabaseConfig = {
      type: type || existingResult.rows[0].type,
      ...config,
    };

    const testResult = await databaseService.testConnection(dbConfig);
    if (!testResult.success) {
      throw createValidationError(`Connection test failed: ${testResult.message}`);
    }

    // Encrypt the new configuration
    const encryptedConfig = databaseService.encryptConnectionConfig(dbConfig);
    updateFields.push(`config = $${paramCounter}`);
    updateValues.push(encryptedConfig);
    paramCounter++;
  }

  if (isActive !== undefined) {
    updateFields.push(`is_active = $${paramCounter}`);
    updateValues.push(isActive);
    paramCounter++;
  }

  if (updateFields.length === 0) {
    throw createValidationError('No fields to update');
  }

  // Add updated_at
  updateFields.push(`updated_at = NOW()`);

  // Add connection ID for WHERE clause
  updateValues.push(id);

  const result = await query(
    `UPDATE connections 
     SET ${updateFields.join(', ')} 
     WHERE id = $${paramCounter} 
     RETURNING id, workflow_id, name, type, is_active, created_at, updated_at`,
    updateValues
  );

  res.json({
    success: true,
    data: result.rows[0],
    message: 'Connection updated successfully',
  });
};

// DELETE /api/connections/:id
export const deleteConnection = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM connections WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw createNotFoundError('Connection');
  }

  res.json({
    success: true,
    message: 'Connection deleted successfully',
  });
};

// POST /api/connections/:id/test
export const testSavedConnection = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Get the connection
  const result = await query(
    'SELECT * FROM connections WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw createNotFoundError('Connection');
  }

  const connection = result.rows[0];

  // Decrypt the configuration
  const dbConfig = databaseService.decryptConnectionConfig(connection.config);

  // Test the connection
  const testResult = await databaseService.testConnection(dbConfig);

  res.json({
    success: testResult.success,
    data: testResult,
    message: testResult.message,
  });
};
