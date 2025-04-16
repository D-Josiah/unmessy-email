import { enableCors } from '../src/middleware/cors';

export default async function handler(req, res) {
  // Handle CORS first
  if (enableCors(req, res)) {
    return; // If it was an OPTIONS request, we're done
  }
  
  // Health check response
  return res.status(200).json({
    status: 'ok',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
}