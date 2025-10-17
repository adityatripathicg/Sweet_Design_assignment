import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as executionController from '../controllers/executionController';

const router = express.Router();

// GET /api/execution/:id - Get execution details
router.get('/:id', asyncHandler(executionController.getExecution));

// GET /api/execution/:id/status - Get execution status
router.get('/:id/status', asyncHandler(executionController.getExecutionStatus));

// GET /api/execution/:id/nodes - Get node executions for an execution
router.get('/:id/nodes', asyncHandler(executionController.getNodeExecutions));

// POST /api/execution/:id/cancel - Cancel a running execution
router.post('/:id/cancel', asyncHandler(executionController.cancelExecution));

// GET /api/execution - Get all executions (with optional workflow filter)
router.get('/', asyncHandler(executionController.getAllExecutions));

export default router;
