/**
 * File-based logging utility for Project Unmessy
 */

import fs from 'fs';
import path from 'path';
import { createDirectory } from './file-utils';

class Logger {
  /**
   * Create a new Logger instance
   * @param {Object} options - Logger configuration
   * @param {string} options.logDir - Directory to store log files
   * @param {string} options.logLevel - Minimum log level to record
   * @param {boolean} options.console - Whether to also log to console
   */
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(process.cwd(), 'data', 'logs');
    this.logLevel = options.logLevel || 'info';
    this.console = options.console !== false; // Default to true
    
    // Log levels and their priority (higher number = higher priority)
    this.levels = {
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
      fatal: 5
    };
    
    // Create log directory if it doesn't exist
    createDirectory(this.logDir);
    
    // Current log file path (rotated daily)
    this.currentLogFile = this.getLogFilePath();
  }
  
  /**
   * Get the path for today's log file
   * @returns {string} - Path to the log file
   */
  getLogFilePath() {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `unmessy-${dateString}.log`);
  }
  
  /**
   * Format a log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   * @returns {string} - Formatted log entry
   */
  formatLogEntry(level, message, data) {
    const timestamp = new Date().toISOString();
    const dataString = data ? JSON.stringify(data) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${dataString}\n`;
  }
  
  /**
   * Write a log entry to the file
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  log(level, message, data = null) {
    // Check if we should log this level
    if (this.levels[level] < this.levels[this.logLevel]) {
      return;
    }
    
    // Update log file path if needed (for daily rotation)
    this.currentLogFile = this.getLogFilePath();
    
    // Format the log entry
    const logEntry = this.formatLogEntry(level, message, data);
    
    // Write to file
    try {
      fs.appendFileSync(this.currentLogFile, logEntry);
    } catch (error) {
      // If we can't write to file, at least try console
      console.error('Error writing to log file:', error);
    }
    
    // Write to console if enabled
    if (this.console) {
      const consoleMethod = level === 'error' || level === 'fatal' 
        ? console.error 
        : level === 'warn' 
          ? console.warn 
          : console.log;
      
      consoleMethod(`[${level.toUpperCase()}] ${message}`, data || '');
    }
  }
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  debug(message, data = null) {
    this.log('debug', message, data);
  }
  
  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  info(message, data = null) {
    this.log('info', message, data);
  }
  
  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  warn(message, data = null) {
    this.log('warn', message, data);
  }
  
  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  error(message, data = null) {
    this.log('error', message, data);
  }
  
  /**
   * Log a fatal error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  fatal(message, data = null) {
    this.log('fatal', message, data);
  }
  
  /**
   * Get all log files
   * @returns {Array} - Array of log file names
   */
  getLogFiles() {
    try {
      return fs.readdirSync(this.logDir)
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
   * @returns {string} - Log file content
   */
  readLogFile(fileName) {
    try {
      const filePath = path.join(this.logDir, fileName);
      if (!fs.existsSync(filePath)) {
        return `Log file ${fileName} not found`;
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading log file ${fileName}:`, error);
      return `Error reading log file: ${error.message}`;
    }
  }
}

// Create and export a default logger instance
const defaultLogger = new Logger();
export default defaultLogger;

// Export the Logger class for custom instances
export { Logger };