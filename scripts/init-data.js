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
const logsDir = path.join(dataDir, 'logs');

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
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log(`Created directory: ${logsDir}`);
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

// Create initial log file
function createInitialLogFile() {
  console.log('Creating initial log file...');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const logFilePath = path.join(logsDir, `unmessy-${today}.log`);
  
  if (!fs.existsSync(logFilePath)) {
    const initialLogEntry = `[${new Date().toISOString()}] [INFO] Project Unmessy initialized\n`;
    fs.writeFileSync(logFilePath, initialLogEntry);
    console.log(`Created initial log file: ${logFilePath}`);
  }
}

// Run initialization
function initialize() {
  console.log('Initializing Project Unmessy data files...');
  
  try {
    createDirectories();
    createCsvFiles();
    createInitialLogFile();
    
    console.log('\nInitialization completed successfully!');
    console.log('Project Unmessy is ready to use.');
    console.log('To view logs, run: npm run view-logs');
    
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

// Execute initialization
initialize();