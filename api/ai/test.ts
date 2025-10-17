import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_utils/cors';
import { asyncHandler, handleError } from '../_utils/errorHandler';

// POST /api/ai/test
const testConnection = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  try {
    // Mock connection test - replace with actual Groq API test
    const isConnected = process.env.GROQ_API_KEY ? true : false;
    
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        connected: false,
        message: 'GROQ_API_KEY not configured'
      });
    }

    res.json({
      success: true,
      connected: true,
      message: 'AI service connection successful',
      apiKeyConfigured: !!process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768'
    });
  } catch (error) {
    handleError(error, res);
  }
};

export default asyncHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (handleCors(req, res)) return;

  if (req.method === 'POST') {
    await testConnection(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});
