import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as workflowController from '../controllers/workflowController';

const router = express.Router();

// GET /api/workflows - Get all workflows
router.get('/', asyncHandler(workflowController.getAllWorkflows));

// POST /api/workflows - Create a new workflow
router.post('/', asyncHandler(workflowController.createWorkflow));

// GET /api/workflows/:id - Get a specific workflow
router.get('/:id', asyncHandler(workflowController.getWorkflowById));

// PUT /api/workflows/:id - Update a workflow
router.put('/:id', asyncHandler(workflowController.updateWorkflow));

// DELETE /api/workflows/:id - Delete a workflow
router.delete('/:id', asyncHandler(workflowController.deleteWorkflow));

// POST /api/workflows/:id/run - Execute a workflow
router.post('/:id/run', asyncHandler(workflowController.executeWorkflow));

// GET /api/workflows/:id/executions - Get workflow execution history
router.get('/:id/executions', asyncHandler(workflowController.getWorkflowExecutions));

// POST /api/workflows/:id/validate - Validate workflow configuration
router.post('/:id/validate', asyncHandler(workflowController.validateWorkflow));

// POST /api/workflows/:id/duplicate - Duplicate a workflow
router.post('/:id/duplicate', asyncHandler(workflowController.duplicateWorkflow));

export default router;
