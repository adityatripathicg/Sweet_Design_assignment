import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_utils/cors';

export default (req: VercelRequest, res: VercelResponse) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      service: 'Sweet Design Hub API',
      version: '1.0.0'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
