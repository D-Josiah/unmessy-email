/**
 * Initialize data files and directories for Project Unmessy
 * Run with: node scripts/init-data.js
 */

const fs = require('fs');
const path = require('path');

// Base directories
const baseDir = process.cwd();
const dataDir = path.join(baseDir, 'data');
const knownEmailsDir = path.join(dataDir, 'known-emails');

// File paths
const validDomainsFile = path.join(dataDir, 'valid-domains.csv');
const validatedEmailsFile = path.join(knownEmailsDir, 'validated.csv');
const correctionsFile = path.join(knownEmailsDir, 'corrections.csv');

// Create directories
function createDirectories() {
  console.log('Creating directories...');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created directory: ${dataDir}`);
  }
  
  if (!fs.existsSync(knownEmailsDir)) {
    fs.mkdirSync(knownEmailsDir, { recursive: true });
    console.log(`Created directory: ${knownEmailsDir}`);
  }
}

// Create CSV files with headers
function createCsvFiles() {
  console.log('Creating CSV files...');
  
  // valid-domains.csv
  if (!fs.existsSync(validDomainsFile)) {
    const domainsHeader = 'domain,source,date_added,notes\n';
    const initialDomains = [
      'gmail.com,initial,2025-04-17,Common email provider',
      'outlook.com,initial,2025-04-17,Microsoft email',
      'yahoo.com,initial,2025-04-17,Yahoo email',
      'hotmail.com,initial,2025-04-17,Microsoft legacy email',
      'aol.com,initial,2025-04-17,AOL email',
      'icloud.com,initial,2025-04-17,Apple email'
    ].join('\n');
    
    fs.writeFileSync(validDomainsFile, domainsHeader + initialDomains + '\n');
    console.log(`Created file: ${validDomainsFile}`);
  }
  
  // validated.csv
  if (!fs.existsSync(validatedEmailsFile)) {
    const validatedHeader = 'email,validation_date,validation_source,domain\n';
    fs.writeFileSync(validatedEmailsFile, validatedHeader);
    console.log(`Created file: ${validatedEmailsFile}`);
  }
  
  // corrections.csv
  if (!fs.existsSync(correctionsFile)) {
    const correctionsHeader = 'original_email,corrected_email,correction_date,correction_type\n';
    fs.writeFileSync(correctionsFile, correctionsHeader);
    console.log(`Created file: ${correctionsFile}`);
  }
}

// Run initialization
function initialize() {
  console.log('Initializing Project Unmessy data files...');
  
  try {
    createDirectories();
    createCsvFiles();
    
    console.log('\nInitialization completed successfully!');
    console.log('Project Unmessy is ready to use.');
    
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

// Execute initialization
initialize();