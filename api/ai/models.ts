import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_utils/cors';
import { asyncHandler, handleError } from '../_utils/errorHandler';

// GET /api/ai/models
const getModels = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  try {
    // Mock available models - replace with actual Groq API call
    const models = [
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'High-performance multilingual model',
        maxTokens: 32768,
        pricing: 0.27
      },
      {
        id: 'llama2-70b-4096',
        name: 'Llama 2 70B',
        description: 'Large language model by Meta',
        maxTokens: 4096,
        pricing: 0.70
      },
      {
        id: 'gemma-7b-it',
        name: 'Gemma 7B IT',
        description: 'Instruction-tuned model',
        maxTokens: 8192,
        pricing: 0.10
      }
    ];

    res.json({
      success: true,
      data: models,
      message: 'Available AI models retrieved successfully'
    });
  } catch (error) {
    handleError(error, res);
  }
};

export default asyncHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    await getModels(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});
