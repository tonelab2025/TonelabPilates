import { createServer } from "./index";
import { Handler } from "@netlify/functions";

let serverInstance: any = null;

export const handler: Handler = async (event, context) => {
  try {
    // Initialize server if not already done
    if (!serverInstance) {
      serverInstance = await createServer();
    }

    // Use serverless-http to handle the request
    const serverlessHttp = (await import("@netlify/functions")).default;
    const netlifyHandler = serverlessHttp(serverInstance);
    
    return await netlifyHandler(event, context);
  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};