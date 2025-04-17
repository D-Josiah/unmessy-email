# Project Unmessy - Email Validation

Project Unmessy is a system designed to validate and clean email addresses for B2B companies. This implementation focuses on the email validation component.

## Features

- Email format validation
- Email typo correction
- Domain validation against known company domains
- Australian TLD correction
- Integration with ZeroBounce for deliverability checking
- HubSpot webhook integration for automatic contact validation
- CSV-based storage of known valid domains and emails

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/project-unmessy.git
cd project-unmessy
```

2. Install dependencies
```bash
npm install
```

3. Initialize data directories and CSV files
```bash
npm run init-data
```

4. Set up environment variables
```
# Create a .env file with:
NODE_ENV=development
USE_ZERO_BOUNCE=true
ZERO_BOUNCE_API_KEY=your_zerobounce_api_key
HUBSPOT_API_KEY=your_hubspot_api_key
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
SKIP_SIGNATURE_VERIFICATION=false
```

5. Start the development server
```bash
npm run dev
```

## CSV Data Files

The system uses CSV files instead of a database to store validated data:

### data/valid-domains.csv
Contains known valid company domains. Format:
```
domain,source,date_added,notes
example.com.au,initial,2025-04-17,Example domain
```

### data/known-emails/validated.csv
Contains validated email addresses. Format:
```
email,validation_date,validation_source,domain
test@example.com.au,2025-04-17T12:30:45Z,zerobounce,example.com.au
```

### data/known-emails/corrections.csv
Records email corrections made by the system. Format:
```
original_email,corrected_email,correction_date,correction_type
john@gmial.com,john@gmail.com,2025-04-17T12:30:45Z,domain_typo
```

## API Endpoints

### POST /api/validate/email
Validates a single email address

**Request:**
```json
{
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "originalEmail": "test@example.com",
  "currentEmail": "test@example.com",
  "formatValid": true,
  "wasCorrected": false,
  "isKnownValid": false,
  "domainValid": true,
  "status": "valid",
  "subStatus": null,
  "recheckNeeded": false,
  "validationSteps": [...]
}
```

### POST /api/validate/batch
Validates multiple email addresses (max 100)

**Request:**
```json
{
  "emails": ["test1@example.com", "test2@gmail.com"]
}
```

**Response:**
```json
[
  {
    "originalEmail": "test1@example.com",
    "currentEmail": "test1@example.com",
    // ...validation results
  },
  {
    "originalEmail": "test2@gmail.com",
    "currentEmail": "test2@gmail.com",
    // ...validation results
  }
]
```

### POST /api/webhooks/hubspot
Webhook endpoint for HubSpot integration

## Importing Data

You can import company domains or validated emails from external sources:

```bash
# Import company domains
node scripts/import-data.js company-domains ./your-domains.csv

# Import validated emails
node scripts/import-data.js validated-emails ./your-emails.csv

# Import domains from HubSpot export
node scripts/import-data.js hubspot-domains ./hubspot-export.csv
```

## Email Validation Process

1. **Format Check**: Validates email format with regex
2. **Typo Correction**: Fixes common typos like "gmial.com" → "gmail.com"
3. **Known Email Check**: Checks if email is already in validated list
4. **Domain Check**: Validates domain against known company domains
5. **ZeroBounce Check** (optional): Verifies email deliverability via API

## License

This project is licensed under the MIT License - see the LICENSE file for details.