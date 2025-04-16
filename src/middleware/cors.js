// Create a middleware function to handle CORS
export function enableCors(req, res) {
    // Allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Allow specific methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    // Allow specific headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return true; // Request handled
    }
    
    return false; // Continue with request handling
  }