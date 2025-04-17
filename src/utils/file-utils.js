/**
 * File utilities for the email validation system
 */

import fs from 'fs';
import path from 'path';

/**
 * Create a directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 * @returns {boolean} - Whether the directory was created or already exists
 */
export function createDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    return false;
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {boolean} - Whether the file exists
 */
export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read a file as text
 * @param {string} filePath - Path to the file
 * @returns {string|null} - File content or null if error
 */
export function readTextFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Write text to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @returns {boolean} - Success status
 */
export function writeTextFile(filePath, content) {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    createDirectory(dir);
    
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

/**
 * Append text to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to append
 * @returns {boolean} - Success status
 */
export function appendTextFile(filePath, content) {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    createDirectory(dir);
    
    // Create file if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '');
    }
    
    fs.appendFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error appending to file ${filePath}:`, error);
    return false;
  }
}