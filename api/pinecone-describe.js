
// API route to describe Pinecone index without CORS issues
export default async function handler(req, res) {
  try {
    // Only allow POST methods
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get index name from query and API key from body
    const { index } = req.query;
    const { apiKey } = req.body;

    if (!index || !apiKey) {
      return res.status(400).json({ 
        error: 'Missing index name or API key',
        index: !!index,
        apiKey: !!apiKey
      });
    }

    console.log(`Describing Pinecone index: ${index}`);

    // Make request to Pinecone
    const response = await fetch(`https://api.pinecone.io/indexes/${index}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    // Get response data
    const data = await response.json();

    // Return the Pinecone response
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Pinecone describe error:', error);
    return res.status(500).json({ 
      error: 'Error describing Pinecone index', 
      message: error.message 
    });
  }
}
