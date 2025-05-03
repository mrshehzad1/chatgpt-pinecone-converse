
// API route for OpenAI requests without CORS issues
export default async function handler(req, res) {
  try {
    // Only allow POST methods
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get request body with query and API key
    const { query, apiKey, model } = req.body;
    
    if (!query || !apiKey) {
      return res.status(400).json({ error: 'Missing query or API key' });
    }

    console.log(`Generating embedding for query via proxy`);

    // Send request to OpenAI
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'text-embedding-3-small',
        input: query
      }),
    });

    // Parse response
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error || 'OpenAI API error',
      });
    }

    // Extract embedding from OpenAI response
    const embedding = data.data?.[0]?.embedding;
    
    if (!embedding) {
      return res.status(500).json({
        error: 'Invalid response from OpenAI: embedding is missing'
      });
    }

    // Return the embedding directly
    return res.status(200).json({ 
      success: true,
      embedding 
    });
  } catch (error) {
    console.error('OpenAI proxy error:', error);
    return res.status(500).json({ 
      error: 'Error in OpenAI proxy', 
      message: error.message 
    });
  }
}
