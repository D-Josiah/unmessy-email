/**
 * Single email validation endpoint
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
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await emailValidator.validateEmail(email);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error validating email:', error);
    return res.status(500).json({
      error: 'Error validating email',
      details: error.message
    });
  }
}