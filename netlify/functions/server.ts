import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'netlify-lambda';
import { registerRoutes } from '../../server/routes';

// Create Express app
const app = express();

// Register all routes
registerRoutes(app).then(() => {
  console.log('Server routes registered successfully');
}).catch(error => {
  console.error('Error registering routes:', error);
});

// Export serverless handler
export const handler: Handler = serverless(app);