/**
 * HubSpot webhook handler for email validation
 */

import { EmailValidationService } from '../../src/services/email-validator';
import { loadConfig } from '../../src/config/config';
import crypto from 'crypto';
import axios from 'axios';

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
    // Verify HubSpot signature
    if (!verifyHubspotSignature(req, config)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Respond immediately to prevent timeouts
    res.status(200).send('Processing');
    
    // Process the webhook asynchronously
    processWebhook(req.body, config)
      .then(result => console.log('Webhook processed:', result))
      .catch(error => console.error('Error processing webhook:', error));
      
  } catch (error) {
    console.error('Error in webhook handler:', error);
    // Already sent 200 response or failed verification, so no need to respond again
  }
}

/**
 * Verify the HubSpot signature
 * @param {Object} req - Request object
 * @param {Object} config - Configuration
 * @returns {boolean} - Whether the signature is valid
 */
function verifyHubspotSignature(req, config) {
  // Skip verification in development if configured
  if (config.environment === 'development' && config.hubspot?.skipSignatureVerification) {
    return true;
  }
  
  try {
    const signature = req.headers['x-hubspot-signature'];
    const requestBody = JSON.stringify(req.body);
    
    if (!signature) {
      console.error('Missing HubSpot signature');
      return false;
    }
    
    if (!config.hubspot?.clientSecret) {
      console.error('HubSpot client secret not configured');
      return false;
    }
    
    const hash = crypto
      .createHmac('sha256', config.hubspot.clientSecret)
      .update(requestBody)
      .digest('hex');
      
    return hash === signature;
    
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Process the webhook data
 * @param {Object} webhookData - Webhook data from HubSpot
 * @param {Object} config - Configuration
 * @returns {Object} - Processing result
 */
async function processWebhook(webhookData, config) {
  try {
    // Initialize validator if needed
    if (!emailValidator) {
      emailValidator = new EmailValidationService(config);
    }
    
    // Extract the contact details
    const subscriptionType = webhookData.subscriptionType;
    const contactId = webhookData.objectId;
    
    // Get the email from the webhook or fetch from HubSpot if needed
    let email;
    
    if (webhookData.properties && webhookData.properties.email) {
      email = webhookData.properties.email.value;
    } else {
      // Fetch the contact from HubSpot API
      const contact = await fetchContactFromHubSpot(contactId, config);
      email = contact.properties.email;
    }
    
    // Only proceed if we have an email
    if (!email) {
      console.log(`No email found for contact ${contactId}, skipping validation`);
      return { 
        success: false,
        reason: 'no_email',
        contactId 
      };
    }
    
    // Check if we should validate based on subscription type
    const shouldValidate = shouldValidateForSubscriptionType(subscriptionType);
    
    if (!shouldValidate) {
      console.log(`Skipping validation for subscription type: ${subscriptionType}`);
      return { 
        success: false,
        reason: 'subscription_type_skipped',
        contactId,
        subscriptionType
      };
    }
    
    // Validate the email
    const validationResult = await emailValidator.validateEmail(email);
    
    // Update the contact in HubSpot with the validation results
    const updateResult = await emailValidator.updateHubSpotContact(contactId, validationResult);
    
    return {
      success: true,
      contactId,
      validationResult,
      updateResult
    };
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Determine if we should validate based on the subscription type
 * @param {string} subscriptionType - HubSpot subscription type
 * @returns {boolean} - Whether to validate
 */
function shouldValidateForSubscriptionType(subscriptionType) {
  // List of subscription types that should trigger validation
  const validSubscriptionTypes = [
    'contact.creation',            // Contact created
    'contact.propertyChange',      // Contact property changed
    'contact.merge'                // Contacts merged
  ];
  
  return validSubscriptionTypes.includes(subscriptionType);
}

/**
 * Fetch contact details from HubSpot
 * @param {string} contactId - HubSpot contact ID
 * @param {Object} config - Configuration
 * @returns {Object} - Contact data
 */
async function fetchContactFromHubSpot(contactId, config) {
  try {
    if (!config.hubspot?.apiKey) {
      throw new Error('HubSpot API key not configured');
    }
    
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email`,
      {
        headers: {
          'Authorization': `Bearer ${config.hubspot.apiKey}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching contact ${contactId} from HubSpot:`, error);
    throw error;
  }
}