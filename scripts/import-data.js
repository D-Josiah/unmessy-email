/**
 * Import data from external sources into Project Unmessy
 * Run with: node scripts/import-data.js [source] [filepath]
 * 
 * Examples:
 *   node scripts/import-data.js hubspot-domains ./hubspot-export.csv
 *   node scripts/import-data.js validated-emails ./zerobounce-results.csv
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Base directories
const baseDir = process.cwd();
const dataDir = path.join(baseDir, 'data');
const knownEmailsDir = path.join(dataDir, 'known-emails');

// File paths
const validDomainsFile = path.join(dataDir, 'valid-domains.csv');
const validatedEmailsFile = path.join(knownEmailsDir, 'validated.csv');
const correctionsFile = path.join(knownEmailsDir, 'corrections.csv');

// Import sources
const IMPORT_SOURCES = {
  'hubspot-domains': importHubspotDomains,
  'validated-emails': importValidatedEmails,
  'company-domains': importCompanyDomains
};

/**
 * Parse command line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Error: Not enough arguments');
    console.log('Usage: node scripts/import-data.js [source] [filepath]');
    console.log('Available sources:', Object.keys(IMPORT_SOURCES).join(', '));
    process.exit(1);
  }
  
  const source = args[0];
  const filepath = args[1];
  
  if (!IMPORT_SOURCES[source]) {
    console.error(`Error: Unknown source '${source}'`);
    console.log('Available sources:', Object.keys(IMPORT_SOURCES).join(', '));
    process.exit(1);
  }
  
  if (!fs.existsSync(filepath)) {
    console.error(`Error: File not found '${filepath}'`);
    process.exit(1);
  }
  
  return { source, filepath };
}

/**
 * Read CSV file
 * @param {string} filepath - Path to CSV file
 * @returns {Array} - Parsed CSV data
 */
function readCsvFile(filepath) {
  try {
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const results = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase()
    });
    
    if (results.errors && results.errors.length > 0) {
      console.warn('Warnings during CSV parsing:', results.errors);
    }
    
    return results.data;
  } catch (error) {
    console.error(`Error reading CSV file:`, error);
    process.exit(1);
  }
}

/**
 * Append to CSV file
 * @param {string} filepath - Target CSV file
 * @param {Array} data - Data to append
 * @param {boolean} deduplicate - Whether to deduplicate against existing data
 * @param {string} keyField - Field to use for deduplication
 */
function appendToCsv(filepath, data, deduplicate = true, keyField = 'email') {
  try {
    // Read existing data if needed for deduplication
    let existingData = [];
    let existingKeys = new Set();
    
    if (deduplicate && fs.existsSync(filepath)) {
      existingData = readCsvFile(filepath);
      existingKeys = new Set(existingData.map(row => row[keyField]?.toLowerCase()));
    }
    
    // Filter out duplicates
    const newData = deduplicate 
      ? data.filter(row => !existingKeys.has(row[keyField]?.toLowerCase()))
      : data;
    
    if (newData.length === 0) {
      console.log('No new data to append.');
      return 0;
    }
    
    // Create CSV content
    const csvContent = Papa.unparse(newData);
    
    // Append to file
    if (fs.existsSync(filepath)) {
      // Append without headers
      const lines = csvContent.split('\n');
      const dataLines = lines.slice(1).join('\n');
      fs.appendFileSync(filepath, '\n' + dataLines);
    } else {
      // Create new file with headers
      fs.writeFileSync(filepath, csvContent);
    }
    
    return newData.length;
  } catch (error) {
    console.error(`Error appending to CSV:`, error);
    return 0;
  }
}

/**
 * Import domains from HubSpot export
 * @param {string} filepath - Path to CSV file
 */
function importHubspotDomains(filepath) {
  console.log(`Importing HubSpot domains from: ${filepath}`);
  
  const data = readCsvFile(filepath);
  console.log(`Found ${data.length} records in file`);
  
  // Extract domains from email addresses or domain field
  const domains = [];
  const today = new Date().toISOString().split('T')[0];
  
  data.forEach(row => {
    let domain = null;
    
    // Try to get domain from dedicated field
    if (row.domain || row.company_domain || row.website) {
      domain = (row.domain || row.company_domain || row.website).trim().toLowerCase();
      
      // Extract domain from website URL if needed
      if (domain.startsWith('http')) {
        try {
          const url = new URL(domain);
          domain = url.hostname.replace(/^www\./, '');
        } catch (e) {
          // Invalid URL, skip
          return;
        }
      }
    }
    // Try to extract from email
    else if (row.email) {
      const emailParts = row.email.split('@');
      if (emailParts.length === 2) {
        domain = emailParts[1].trim().toLowerCase();
      }
    }
    
    if (domain && !domain.includes(' ')) {
      domains.push({
        domain: domain,
        source: 'hubspot-import',
        date_added: today,
        notes: 'Imported from HubSpot'
      });
    }
  });
  
  // Deduplicate domains
  const uniqueDomains = [];
  const seen = new Set();
  
  domains.forEach(item => {
    if (!seen.has(item.domain)) {
      seen.add(item.domain);
      uniqueDomains.push(item);
    }
  });
  
  console.log(`Found ${uniqueDomains.length} unique domains`);
  
  // Append to valid domains CSV
  const added = appendToCsv(validDomainsFile, uniqueDomains, true, 'domain');
  console.log(`Added ${added} new domains to ${validDomainsFile}`);
}

/**
 * Import validated emails from external validation results
 * @param {string} filepath - Path to CSV file
 */
function importValidatedEmails(filepath) {
  console.log(`Importing validated emails from: ${filepath}`);
  
  const data = readCsvFile(filepath);
  console.log(`Found ${data.length} records in file`);
  
  // Map to our format
  const validatedEmails = [];
  const now = new Date().toISOString();
  
  data.forEach(row => {
    const email = row.email || row.address || row.email_address;
    
    if (!email) return;
    
    const cleanEmail = email.trim().toLowerCase();
    const parts = cleanEmail.split('@');
    
    if (parts.length !== 2) return;
    
    validatedEmails.push({
      email: cleanEmail,
      validation_date: now,
      validation_source: 'import',
      domain: parts[1]
    });
  });
  
  console.log(`Prepared ${validatedEmails.length} valid emails for import`);
  
  // Append to validated emails CSV
  const added = appendToCsv(validatedEmailsFile, validatedEmails, true, 'email');
  console.log(`Added ${added} new validated emails to ${validatedEmailsFile}`);
}

/**
 * Import company domains from a domain list
 * @param {string} filepath - Path to CSV file
 */
function importCompanyDomains(filepath) {
  console.log(`Importing company domains from: ${filepath}`);
  
  const data = readCsvFile(filepath);
  console.log(`Found ${data.length} records in file`);
  
  // Prepare domains data
  const domains = [];
  const today = new Date().toISOString().split('T')[0];
  
  data.forEach(row => {
    const domain = row.domain || row.company_domain || row.website || row.url || Object.values(row)[0];
    
    if (!domain) return;
    
    let cleanDomain = domain.trim().toLowerCase();
    
    // Extract domain from URL if needed
    if (cleanDomain.startsWith('http')) {
      try {
        const url = new URL(cleanDomain);
        cleanDomain = url.hostname.replace(/^www\./, '');
      } catch (e) {
        // Invalid URL, skip
        return;
      }
    }
    
    if (cleanDomain && !cleanDomain.includes(' ')) {
      domains.push({
        domain: cleanDomain,
        source: 'domain-import',
        date_added: today,
        notes: row.notes || row.description || 'Imported domain'
      });
    }
  });
  
  console.log(`Prepared ${domains.length} domains for import`);
  
  // Append to valid domains CSV
  const added = appendToCsv(validDomainsFile, domains, true, 'domain');
  console.log(`Added ${added} new domains to ${validDomainsFile}`);
}

/**
 * Main function to run the import
 */
function main() {
  const { source, filepath } = parseArgs();
  
  // Run the appropriate import function
  IMPORT_SOURCES[source](filepath);
  
  console.log('Import completed successfully');
}

// Run the script
main();