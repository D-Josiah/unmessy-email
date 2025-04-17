/**
 * CSV Manager
 * Utilities for reading and writing CSV files for the email validation system
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { createDirectory } from './file-utils';

class CSVManager {
  /**
   * Create a new CSV Manager
   * @param {Object} options - Configuration options
   * @param {string} options.dataDir - Base directory for data files
   */
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.validDomainsPath = path.join(this.dataDir, 'valid-domains.csv');
    this.knownEmailsDir = path.join(this.dataDir, 'known-emails');
    this.validatedEmailsPath = path.join(this.knownEmailsDir, 'validated.csv');
    this.correctedEmailsPath = path.join(this.knownEmailsDir, 'corrections.csv');
    
    // Ensure directories exist
    this.initializeDirectories();
  }

  /**
   * Create necessary directories if they don't exist
   */
  initializeDirectories() {
    createDirectory(this.dataDir);
    createDirectory(this.knownEmailsDir);
    
    // Create files with headers if they don't exist
    this.initializeFile(
      this.validDomainsPath, 
      'domain,source,date_added,notes\n'
    );
    
    this.initializeFile(
      this.validatedEmailsPath, 
      'email,validation_date,validation_source,domain\n'
    );
    
    this.initializeFile(
      this.correctedEmailsPath, 
      'original_email,corrected_email,correction_date,correction_type\n'
    );
  }
  
  /**
   * Initialize a CSV file with headers if it doesn't exist
   * @param {string} filePath - Path to the file
   * @param {string} headers - CSV headers as a string
   */
  initializeFile(filePath, headers) {
    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, headers);
        console.log(`Created file: ${filePath}`);
      } catch (error) {
        console.error(`Error creating file ${filePath}:`, error);
      }
    }
  }
  
  /**
   * Read a CSV file and parse it
   * @param {string} filePath - Path to the CSV file
   * @returns {Array} - Array of objects representing the CSV data
   */
  readCSV(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true
      });
      
      if (results.errors && results.errors.length > 0) {
        console.warn(`Errors parsing ${filePath}:`, results.errors);
      }
      
      return results.data || [];
    } catch (error) {
      console.error(`Error reading CSV ${filePath}:`, error);
      return [];
    }
  }
  
  /**
   * Append a row to a CSV file
   * @param {string} filePath - Path to the CSV file
   * @param {Object} data - Data object to append
   * @returns {boolean} - Success status
   */
  appendToCSV(filePath, data) {
    try {
      // Check if file exists
      const fileExists = fs.existsSync(filePath);
      
      // Get headers from the first object key
      const headers = Object.keys(data);
      
      // Create CSV line
      const csvLine = Papa.unparse([data], { header: false });
      
      // If file doesn't exist, create it with headers
      if (!fileExists) {
        const headerLine = headers.join(',');
        fs.writeFileSync(filePath, headerLine + '\n' + csvLine + '\n');
      } else {
        // Append to existing file
        fs.appendFileSync(filePath, csvLine + '\n');
      }
      
      return true;
    } catch (error) {
      console.error(`Error appending to CSV ${filePath}:`, error);
      return false;
    }
  }
  
  /**
   * Load valid domains from CSV
   * @returns {Set} Set of valid domains
   */
  loadValidDomains() {
    const data = this.readCSV(this.validDomainsPath);
    const domains = new Set();
    
    // Add default domains
    ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com'].forEach(d => domains.add(d));
    
    // Add domains from CSV
    data.forEach(row => {
      if (row.domain) {
        domains.add(row.domain.trim().toLowerCase());
      }
    });
    
    console.log(`Loaded ${domains.size} valid domains`);
    return domains;
  }
  
  /**
   * Load known valid emails from CSV
   * @returns {Set} Set of known valid emails
   */
  loadValidatedEmails() {
    const data = this.readCSV(this.validatedEmailsPath);
    const emails = new Set();
    
    data.forEach(row => {
      if (row.email) {
        emails.add(row.email.trim().toLowerCase());
      }
    });
    
    console.log(`Loaded ${emails.size} validated emails`);
    return emails;
  }
  
  /**
   * Add a valid domain to the CSV
   * @param {string} domain - Domain to add
   * @param {string} source - Source of the domain (e.g., 'user', 'system')
   * @param {string} notes - Optional notes about the domain
   * @returns {boolean} - Success status
   */
  addValidDomain(domain, source = 'system', notes = '') {
    const data = {
      domain: domain.toLowerCase(),
      source,
      date_added: new Date().toISOString(),
      notes
    };
    
    return this.appendToCSV(this.validDomainsPath, data);
  }
  
  /**
   * Add a validated email to the CSV
   * @param {string} email - Validated email address
   * @param {string} source - Validation source (e.g., 'zerobounce', 'manual')
   * @returns {boolean} - Success status
   */
  addValidatedEmail(email, source = 'system') {
    const domain = email.split('@')[1]?.toLowerCase();
    
    const data = {
      email: email.toLowerCase(),
      validation_date: new Date().toISOString(),
      validation_source: source,
      domain: domain || ''
    };
    
    return this.appendToCSV(this.validatedEmailsPath, data);
  }
  
  /**
   * Add a corrected email to the CSV
   * @param {string} originalEmail - Original incorrect email
   * @param {string} correctedEmail - Corrected email address
   * @param {string} correctionType - Type of correction (e.g., 'typo', 'case', 'tld')
   * @returns {boolean} - Success status
   */
  addCorrectedEmail(originalEmail, correctedEmail, correctionType = 'typo') {
    const data = {
      original_email: originalEmail,
      corrected_email: correctedEmail,
      correction_date: new Date().toISOString(),
      correction_type: correctionType
    };
    
    return this.appendToCSV(this.correctedEmailsPath, data);
  }
}

export default CSVManager;