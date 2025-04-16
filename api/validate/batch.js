import { EmailValidationService } from '../../src/services/email-validator';
import { enableCors } from '../../src/middleware/cors';

// Load configuration
const config = {
  useZeroBounce: process.env.USE_ZERO_BOUNCE === 'true',
  zeroBounceApiKey: process.env.ZERO_BOUNCE_API_KEY || '',
  removeGmailAliases: true,
  checkAustralianTlds: true,
};

// Initialize the email validation service
const emailValidator = new EmailValidationService(config);

export default async function handler(req, res) {
  // Handle CORS first
  if (enableCors(req, res)) {
    return; // If it was an OPTIONS request, we're done
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Emails array is required' });
    }
    
    // Limit batch size to prevent abuse
    if (emails.length > 100) {
      return res.status(400).json({ 
        error: 'Batch size exceeded',
        message: 'Maximum batch size is 100 emails'
      });
    }
    
    const results = await emailValidator.validateBatch(emails);
    
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error validating email batch:', error);
    return res.status(500).json({
      error: 'Error validating email batch',
      details: error.message
    });
  }
}