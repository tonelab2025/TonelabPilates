import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { bookingId, timestamp } = event.queryStringParameters || {};
    
    if (event.httpMethod === 'PUT') {
      // Process the uploaded file
      const body = event.body;
      const isBase64 = event.isBase64Encoded;
      
      // For now, store the file info and return success
      // In production, this would save to actual storage
      const fileUrl = `https://tonelabs.netlify.app/uploads/receipt-${bookingId}-${timestamp}.jpg`;
      
      // Log upload for debugging
      console.log(`File uploaded: ${fileUrl}, Size: ${body?.length || 0} bytes`);
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          fileUrl: fileUrl,
          uploadURL: fileUrl,
          message: 'File uploaded successfully'
        })
      };
    }

    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Upload handler error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Upload failed',
        details: error.message 
      })
    };
  }
};