/**
 * Email Validation Service
 * Core service for validating and correcting email addresses
 */

import axios from 'axios';
import CSVManager from '../utils/csv-manager';
import { 
  DOMAIN_TYPOS, 
  AUSTRALIAN_TLDS,
  correctDomainTypos,
  correctAustralianTLD,
  extractDomainFromEmail,
  isValidDomainFormat
} from '../utils/domain-utils';

export class EmailValidationService {
  /**
   * Create a new EmailValidationService
   * @param {Object} config - Configuration options
   */
  constructor(config) {
    this.config = config;
    
    // Initialize CSV manager
    this.csvManager = new CSVManager({
      dataDir: config.paths?.dataDir || config.dataDir
    });
    
    // Load data
    this.validDomains = this.csvManager.loadValidDomains();
    this.knownValidEmails = this.csvManager.loadValidatedEmails();
  }
  
  /**
   * Basic email format check with regex
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether the email has valid format
   */
  isValidEmailFormat(email) {
    if (!email) return false;
    
    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }
  
  /**
   * Clean and correct common email typos
   * @param {string} email - Email to correct
   * @returns {Object} - {corrected: boolean, email: string, correctionType: string}
   */
  correctEmailTypos(email) {
    if (!email) return { corrected: false, email, correctionType: null };
    
    let corrected = false;
    let correctionType = null;
    let cleanedEmail = email.trim().toLowerCase();
    
    // Remove any spaces
    const noSpaceEmail = cleanedEmail.replace(/\s/g, '');
    if (noSpaceEmail !== cleanedEmail) {
      cleanedEmail = noSpaceEmail;
      corrected = true;
      correctionType = 'whitespace';
    }
    
    // Split into local part and domain
    const parts = cleanedEmail.split('@');
    if (parts.length !== 2) {
      return { corrected, email: cleanedEmail, correctionType };
    }
    
    const [localPart, domain] = parts;
    
    // Check for common domain typos
    const { corrected: domainCorrected, domain: correctedDomain } = correctDomainTypos(domain);
    
    if (domainCorrected) {
      cleanedEmail = `${localPart}@${correctedDomain}`;
      corrected = true;
      correctionType = 'domain_typo';
    }
    
    // Check for + alias in Gmail if configured to remove
    if (this.config.validation?.removeGmailAliases && 
        (correctedDomain || domain) === 'gmail.com' && 
        localPart.includes('+')) {
      const baseLocal = localPart.split('+')[0];
      cleanedEmail = `${baseLocal}@gmail.com`;
      corrected = true;
      correctionType = 'gmail_alias';
    }
    
    // Check Australian TLDs if configured
    if (this.config.validation?.checkAustralianTlds) {
      const { corrected: tldCorrected, domain: tldCorrectedDomain } = correctAustralianTLD(
        correctedDomain || domain
      );
      
      if (tldCorrected) {
        cleanedEmail = `${localPart}@${tldCorrectedDomain}`;
        corrected = true;
        correctionType = 'tld';
      }
    }
    
    // If a correction was made, log it
    if (corrected) {
      this.csvManager.addCorrectedEmail(email, cleanedEmail, correctionType);
    }
    
    return { corrected, email: cleanedEmail, correctionType };
  }
  
  /**
   * Check if email is in known valid emails list
   * @param {string} email - Email to check
   * @returns {boolean} - Whether email is known valid
   */
  isKnownValidEmail(email) {
    return this.knownValidEmails.has(email.toLowerCase());
  }
  
  /**
   * Check if domain is considered valid
   * @param {string} email - Email to check domain for
   * @returns {boolean} - Whether domain is valid
   */
  isValidDomain(email) {
    const domain = extractDomainFromEmail(email);
    if (!domain) return false;
    
    return this.validDomains.has(domain.toLowerCase());
  }
  
  /**
   * Check email with ZeroBounce API
   * @param {string} email - Email to validate
   * @returns {Object} - Validation result
   */
  async checkWithZeroBounce(email) {
    try {
      // Ensure we have a ZeroBounce API key
      if (!this.config.validation?.zeroBounceApiKey) {
        throw new Error('ZeroBounce API key not configured');
      }
      
      const response = await axios.get('https://api.zerobounce.net/v2/validate', {
        params: {
          api_key: this.config.validation.zeroBounceApiKey,
          email: email,
          ip_address: ''
        }
      });
      
      const result = response.data;
      
      // Map ZeroBounce status to our simplified status
      let status, subStatus, recheckNeeded;
      
      switch (result.status) {
        case 'valid':
          status = 'valid';
          recheckNeeded = false;
          break;
        case 'invalid':
          status = 'invalid';
          subStatus = result.sub_status;
          recheckNeeded = false;
          break;
        case 'catch-all':
          status = 'unknown';
          recheckNeeded = true;
          break;
        case 'unknown':
          status = 'unknown';
          recheckNeeded = true;
          break;
        case 'spamtrap':
          status = 'invalid';
          subStatus = 'spamtrap';
          recheckNeeded = false;
          break;
        case 'abuse':
          status = 'invalid';
          subStatus = 'abuse';
          recheckNeeded = false;
          break;
        default:
          status = 'check_failed';
          recheckNeeded = true;
      }
      
      // If valid, add to known valid emails
      if (status === 'valid') {
        this.csvManager.addValidatedEmail(email, 'zerobounce');
        this.knownValidEmails.add(email.toLowerCase());
      }
      
      return {
        email,
        status,
        subStatus,
        recheckNeeded,
        source: 'zerobounce',
        details: result
      };
      
    } catch (error) {
      console.error('ZeroBounce API error:', error);
      return {
        email,
        status: 'check_failed',
        recheckNeeded: true,
        source: 'zerobounce',
        error: error.message
      };
    }
  }
  
  /**
   * Main validation function
   * @param {string} email - Email to validate
   * @returns {Object} - Validation result
   */
  async validateEmail(email) {
    const result = {
      originalEmail: email,
      currentEmail: email,
      formatValid: false,
      wasCorrected: false,
      isKnownValid: false,
      domainValid: false,
      status: 'unknown',
      subStatus: null,
      recheckNeeded: true,
      validationSteps: []
    };
    
    // Step 1: Basic format check with regex
    result.formatValid = this.isValidEmailFormat(email);
    result.validationSteps.push({
      step: 'format_check',
      passed: result.formatValid
    });
    
    if (!result.formatValid) {
      result.status = 'invalid';
      result.subStatus = 'bad_format';
      result.recheckNeeded = false;
      return result;
    }
    
    // Step 2: Correct common typos
    const { corrected, email: correctedEmail, correctionType } = this.correctEmailTypos(email);
    result.wasCorrected = corrected;
    result.currentEmail = correctedEmail;
    result.validationSteps.push({
      step: 'typo_correction',
      applied: corrected,
      correctionType: correctionType,
      original: email,
      corrected: correctedEmail
    });
    
    // Step 3: Check if it's a known valid email
    result.isKnownValid = this.isKnownValidEmail(correctedEmail);
    result.validationSteps.push({
      step: 'known_valid_check',
      passed: result.isKnownValid
    });
    
    if (result.isKnownValid) {
      result.status = 'valid';
      result.recheckNeeded = false;
      return result;
    }
    
    // Step 4: Check if domain appears valid
    result.domainValid = this.isValidDomain(correctedEmail);
    result.validationSteps.push({
      step: 'domain_check',
      passed: result.domainValid
    });
    
    // Step 5: If enabled, check with ZeroBounce
    if (this.config.validation?.useZeroBounce) {
      const bounceCheck = await this.checkWithZeroBounce(correctedEmail);
      result.status = bounceCheck.status;
      result.subStatus = bounceCheck.subStatus;
      result.recheckNeeded = bounceCheck.recheckNeeded;
      result.validationSteps.push({
        step: 'zerobounce_check',
        result: bounceCheck
      });
    } else {
      // Without ZeroBounce, rely on domain check
      result.status = result.domainValid ? 'unknown' : 'invalid';
      result.recheckNeeded = result.domainValid;
    }
    
    return result;
  }
  
  /**
   * Process a batch of emails
   * @param {string[]} emails - Emails to validate
   * @returns {Object[]} - Validation results
   */
  async validateBatch(emails) {
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await this.validateEmail(email);
        results.push(result);
        
        // Add a small delay to avoid rate limits if using ZeroBounce
        if (this.config.validation?.useZeroBounce) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`Error validating email ${email}:`, error);
        results.push({
          originalEmail: email,
          currentEmail: email,
          status: 'check_failed',
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Update HubSpot contact with validation results
   * @param {string} contactId - HubSpot contact ID
   * @param {Object} validationResult - Validation result
   * @returns {Object} - Update result
   */
  async updateHubSpotContact(contactId, validationResult) {
    try {
      if (!this.config.hubspot?.apiKey) {
        throw new Error('HubSpot API key not configured');
      }
      
      const properties = {
        email: validationResult.currentEmail,
        email_status: validationResult.status,
        email_recheck_needed: validationResult.recheckNeeded,
        email_check_date: new Date().toISOString(),
      };
      
      if (validationResult.wasCorrected) {
        properties.original_email = validationResult.originalEmail;
        properties.email_corrected = true;
      }
      
      if (validationResult.subStatus) {
        properties.email_sub_status = validationResult.subStatus;
      }
      
      const response = await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        { properties },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.hubspot.apiKey}`
          }
        }
      );
      
      return {
        success: true,
        contactId,
        hubspotResponse: response.data
      };
      
    } catch (error) {
      console.error(`Error updating HubSpot contact ${contactId}:`, error);
      return {
        success: false,
        contactId,
        error: error.message
      };
    }
  }
}

export default EmailValidationService;