/**
 * Command-line utility to view Project Unmessy logs
 * Usage: node scripts/view-logs.js [date] [level]
 * 
 * Examples:
 *   node scripts/view-logs.js                  - Show today's logs
 *   node scripts/view-logs.js 2025-04-17       - Show logs from specific date
 *   node scripts/view-logs.js 2025-04-17 error - Show only error logs from specific date
 *   node scripts/view-logs.js latest           - Show latest log file
 *   node scripts/view-logs.js list             - List available log files
 */

const fs = require('fs');
const path = require('path');

// Log directory
const logDir = path.join(process.cwd(), 'data', 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Get available log files
 * @returns {Array} - List of log files
 */
function getLogFiles() {
  try {
    return fs.readdirSync(logDir)
      .filter(file => file.endsWith('.log'))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error reading log directory:', error);
    return [];
  }
}

/**
 * Read a specific log file
 * @param {string} fileName - Log file name
 * @param {string} level - Optional log level filter
 * @returns {string} - Log file content
 */
function readLogFile(fileName, level) {
  try {
    const filePath = path.join(logDir, fileName);
    if (!fs.existsSync(filePath)) {
      return `Log file ${fileName} not found`;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Filter by level if specified
    if (level) {
      const upperLevel = `[${level.toUpperCase()}]`;
      return content
        .split('\n')
        .filter(line => line.includes(upperLevel))
        .join('\n');
    }
    
    return content;
  } catch (error) {
    return `Error reading log file: ${error.message}`;
  }
}

/**
 * Display log file
 * @param {string} date - Date string or 'latest'
 * @param {string} level - Optional log level filter
 */
function displayLogs(date, level) {
  const files = getLogFiles();
  
  if (files.length === 0) {
    console.log('No log files found');
    return;
  }
  
  let fileName;
  
  if (date === 'latest') {
    // Get the most recent log file
    fileName = files[0];
  } else if (date) {
    // Find log file for specific date
    fileName = `unmessy-${date}.log`;
  } else {
    // Default to today's log
    const today = new Date().toISOString().split('T')[0];
    fileName = `unmessy-${today}.log`;
  }
  
  const logs = readLogFile(fileName, level);
  console.log(`=== ${fileName} ${level ? `(${level} only)` : ''} ===`);
  console.log(logs);
}

/**
 * List available log files
 */
function listLogFiles() {
  const files = getLogFiles();
  
  if (files.length === 0) {
    console.log('No log files found');
    return;
  }
  
  console.log('Available log files:');
  files.forEach(file => {
    const stats = fs.statSync(path.join(logDir, file));
    const size = (stats.size / 1024).toFixed(2) + ' KB';
    console.log(`${file} (${size})`);
  });
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'today';
  const level = args[1];
  
  if (command === 'list') {
    listLogFiles();
  } else if (command === 'today') {
    const today = new Date().toISOString().split('T')[0];
    displayLogs(today, level);
  } else {
    displayLogs(command, level);
  }
}

// Run the script
main();