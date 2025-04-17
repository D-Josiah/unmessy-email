/**
 * Batch email validation endpoint
 */

import { EmailValidationService } from '../../src/services/email-validator';
import { loadConfig } from '../../src/config/config';

// Load configuration
const config = loadConfig();

// Initialize the email validation service
let emailValidator = null;

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Initialize validator if needed
    if (!emailValidator) {
      emailValidator = new EmailValidationService(config);
    }
    
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