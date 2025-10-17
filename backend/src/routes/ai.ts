import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as aiController from '../controllers/aiController';

const router = express.Router();

// POST /api/ai/process - Process data with AI
router.post('/process', asyncHandler(aiController.processData));

// POST /api/ai/test - Test AI connectivity
router.post('/test', asyncHandler(aiController.testConnection));

// GET /api/ai/models - Get available AI models
router.get('/models', asyncHandler(aiController.getModels));

// POST /api/ai/validate - Validate AI configuration
router.post('/validate', asyncHandler(aiController.validateConfig));

// POST /api/ai/preview - Preview AI processing with sample data
router.post('/preview', asyncHandler(aiController.previewProcessing));

export default router;
