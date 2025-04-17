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
      correctionsFile: path.join(config.dataDir, 'known-emails', 'corrections.csv')
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
    }
  };
  
  // Add derived configuration
  return addDerivedConfig(mergedConfig);
}

// Export default configuration
export default loadConfig();