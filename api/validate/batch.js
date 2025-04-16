export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Emails array is required' });
    }
    
    // Limit batch size to prevent abuse
    if (emails.length > 100) {
      return res.status(400).json({ 
        error: 'Batch size exceeded',
        message: 'Maximum batch size is 100 emails'
      });
    }
    
    // Process each email with basic validation
    const results = emails.map(email => ({
      originalEmail: email,
      currentEmail: email.toLowerCase().trim(),
      formatValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      status: 'unknown',
      message: 'Basic validation only - debug mode'
    }));
    
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error validating email batch:', error);
    return res.status(500).json({
      error: 'Error validating email batch',
      details: error.message
    });
  }
}