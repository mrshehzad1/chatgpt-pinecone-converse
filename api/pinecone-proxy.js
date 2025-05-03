
// Proxy for Pinecone requests to avoid CORS issues
export default async function handler(req, res) {
  try {
    // Only allow POST methods
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse host from query params
    const { host } = req.query;
    if (!host) {
      return res.status(400).json({ error: 'No host provided' });
    }

    // Get request body with Pinecone query and API key
    const { pineconeBody, apiKey } = req.body;
    
    if (!pineconeBody || !apiKey) {
      return res.status(400).json({ error: 'Missing request body or API key' });
    }

    console.log(`Proxying request to Pinecone host: ${host}`);

    // Forward the request to Pinecone
    const pineconeResponse = await fetch(`https://${host}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pineconeBody)
    });

    // Get response data
    const data = await pineconeResponse.json();

    // Return the Pinecone response
    return res.status(pineconeResponse.status).json(data);
  } catch (error) {
    console.error('Pinecone proxy error:', error);
    return res.status(500).json({ 
      error: 'Error in Pinecone proxy', 
      message: error.message 
    });
  }
}
