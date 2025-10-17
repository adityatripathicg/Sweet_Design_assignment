import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as connectionController from '../controllers/connectionController';

const router = express.Router();

// POST /api/connections/test - Test database connection
router.post('/test', asyncHandler(connectionController.testConnection));

// GET /api/connections - Get all database connections
router.get('/', asyncHandler(connectionController.getAllConnections));

// POST /api/connections - Create a new database connection
router.post('/', asyncHandler(connectionController.createConnection));

// GET /api/connections/:id - Get a specific connection
router.get('/:id', asyncHandler(connectionController.getConnectionById));

// PUT /api/connections/:id - Update a connection
router.put('/:id', asyncHandler(connectionController.updateConnection));

// DELETE /api/connections/:id - Delete a connection
router.delete('/:id', asyncHandler(connectionController.deleteConnection));

// POST /api/connections/:id/test - Test a specific saved connection
router.post('/:id/test', asyncHandler(connectionController.testSavedConnection));

export default router;
