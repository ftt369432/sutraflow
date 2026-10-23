import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAPIClient } from '../../services/google/GoogleAPIClient';
// import { getEnv } from '../../config/env'; // No longer needed for this logic

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = GoogleAPIClient.getInstance();
    
    // Force client into mock data mode for this dedicated mock API endpoint
    console.warn('[google-service-api] Forcing mock data mode for /api/google-service');
    client.setUseMockData(true); 
    
    // Initialize if not already (initialize is idempotent)
    // Pass a minimal onAuthChange; initialize should handle if it needs one or if it can be null/undefined
    await client.initialize(() => {}); 

    const { path, method, body } = req.body;

    // Construct options for GoogleAPIClient.request
    const requestOptions: RequestInit = {};
    if (method) {
      requestOptions.method = method.toUpperCase(); // Ensure method is uppercase
    }
    if (body) {
      // If body is already a string (e.g., JSON stringified), use it directly
      // Otherwise, stringify it (assuming it's an object for JSON APIs)
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    // Note: GoogleAPIClient.request expects query params to be part of the `path` string.
    // If req.body.params existed and were query parameters, they would need to be appended to `path`.

    const result = await client.request(path, requestOptions);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Google API Mock Service Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
} 