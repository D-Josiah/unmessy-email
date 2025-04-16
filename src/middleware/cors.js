export function enableCors(req, res) {
  // Always set these headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // For preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Request handled
  }
  
  return false; // Continue with request handling
}