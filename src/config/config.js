/**
 * Configuration manager for the email validation system
 */

import path from 'path';

/**
 * Default configuration values
 */
const defaultConfig = {
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Data directories
  dataDir: path.join(process.cwd(), 'data'),
  
  // Email validation options
  validation: {
    useZeroBounce: process.env.USE_ZERO_BOUNCE === 'true',
    zeroBounceApiKey: process.env.ZERO_BOUNCE_API_KEY || '',
    removeGmailAliases: true,
    checkAustralianTlds: true
  },
  
  // HubSpot integration
  hubspot: {
    apiKey: process.env.HUBSPOT_API_KEY || '',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
    skipSignatureVerification: process.env.SKIP_SIGNATURE_VERIFICATION === 'true'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',  // debug, info, warn, error, fatal
    console: process.env.LOG_CONSOLE !== 'false', // Log to console by default
    fileLogging: process.env.FILE_LOGGING !== 'false' // Enable file logging by default
  }
};

/**
 * Create derived configuration properties
 * @param {Object} config - Base configuration
 * @returns {Object} - Enhanced configuration with derived paths
 */
function addDerivedConfig(config) {
  return {
    ...config,
    // Calculate derived file paths
    paths: {
      dataDir: config.dataDir,
      validDomainsFile: path.join(config.dataDir, 'valid-domains.csv'),
      knownEmailsDir: path.join(config.dataDir, 'known-emails'),
      validatedEmailsFile: path.join(config.dataDir, 'known-emails', 'validated.csv'),
      correctionsFile: path.join(config.dataDir, 'known-emails', 'corrections.csv'),
      logsDir: path.join(config.dataDir, 'logs')
    }
  };
}

/**
 * Load configuration with optional overrides
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} - Final configuration
 */
export function loadConfig(overrides = {}) {
  // Merge default config with overrides
  const mergedConfig = {
    ...defaultConfig,
    ...overrides,
    // Deep merge nested objects
    validation: {
      ...defaultConfig.validation,
      ...(overrides.validation || {})
    },
    hubspot: {
      ...defaultConfig.hubspot,
      ...(overrides.hubspot || {})
    },
    logging: {
      ...defaultConfig.logging,
      ...(overrides.logging || {})
    }
  };
  
  // Add derived configuration
  return addDerivedConfig(mergedConfig);
}

// Export default configuration
export default loadConfig();