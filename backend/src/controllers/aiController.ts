import { Request, Response } from 'express';
import { AIService } from '../services/AIService';
import { 
  createValidationError 
} from '../middleware/errorHandler';
import { 
  ProcessAIRequest,
  AIConfig
} from '../types';

const aiService = new AIService();

// POST /api/ai/process
export const processData = async (req: Request, res: Response): Promise<void> => {
  const { model, prompt, data, temperature, maxTokens }: ProcessAIRequest = req.body;

  if (!model) {
    throw createValidationError('AI model is required');
  }

  if (!prompt) {
    throw createValidationError('Prompt is required');
  }

  const config: AIConfig = {
    model,
    prompt,
    temperature,
    maxTokens,
  };

  // Validate configuration
  const validation = aiService.validateConfig(config);
  if (!validation.isValid) {
    throw createValidationError('Invalid AI configuration', validation.errors);
  }

  const result = await aiService.processData(config, data);

  res.json({
    success: true,
    data: result,
    message: 'AI processing completed successfully',
  });
};

// POST /api/ai/test
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  const result = await aiService.testConnection();

  res.json({
    success: result.success,
    data: result,
    message: result.success ? 'AI connection test successful' : 'AI connection test failed',
  });
};

// GET /api/ai/models
export const getModels = async (req: Request, res: Response): Promise<void> => {
  const models = aiService.getAvailableModels();

  const modelDetails = models.map(model => {
    let description = '';
    let contextLength = 32768;
    
    switch (model) {
      case 'mixtral-8x7b-32768':
        description = 'Fast and efficient Mixtral model, good for most tasks';
        contextLength = 32768;
        break;
      case 'llama2-70b-4096':
        description = 'More powerful Llama 2 model, better reasoning capabilities';
        contextLength = 4096;
        break;
      case 'gemma-7b-it':
        description = 'Google Gemma model, good balance of speed and quality';
        contextLength = 8192;
        break;
    }

    return {
      id: model,
      name: model.split('-')[0].toUpperCase(),
      description,
      contextLength,
      recommended: model === 'mixtral-8x7b-32768',
    };
  });

  res.json({
    success: true,
    data: modelDetails,
  });
};

// POST /api/ai/validate
export const validateConfig = async (req: Request, res: Response): Promise<void> => {
  const { model, prompt, temperature, maxTokens } = req.body;

  const config: AIConfig = {
    model,
    prompt,
    temperature,
    maxTokens,
  };

  const validation = aiService.validateConfig(config);

  res.json({
    success: true,
    data: validation,
  });
};

// POST /api/ai/preview
export const previewProcessing = async (req: Request, res: Response): Promise<void> => {
  const { model, prompt, sampleData, temperature, maxTokens } = req.body;

  if (!model || !prompt) {
    throw createValidationError('Model and prompt are required for preview');
  }

  const config: AIConfig = {
    model,
    prompt,
    temperature,
    maxTokens: Math.min(maxTokens || 500, 500), // Limit tokens for preview
  };

  // Validate configuration
  const validation = aiService.validateConfig(config);
  if (!validation.isValid) {
    throw createValidationError('Invalid AI configuration', validation.errors);
  }

  // Use sample data or generate generic sample
  const previewData = sampleData || {
    sample: true,
    message: 'This is sample data for AI processing preview',
    timestamp: new Date().toISOString(),
    items: [
      { id: 1, name: 'Sample Item 1', value: 100 },
      { id: 2, name: 'Sample Item 2', value: 200 },
    ],
  };

  try {
    const result = await aiService.processData(config, previewData);

    res.json({
      success: true,
      data: {
        ...result,
        preview: true,
        note: 'This is a preview with limited tokens',
      },
      message: 'AI preview completed successfully',
    });

  } catch (error: any) {
    res.json({
      success: false,
      data: {
        error: error.message,
        preview: true,
        config: config,
      },
      message: 'AI preview failed',
    });
  }
};
