import express from "express";
import { Handler } from "@netlify/functions";
import { registerRoutes } from "./routes";

let app: express.Application | null = null;

async function initApp() {
  if (app) return app;
  
  app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  await registerRoutes(app);
  return app;
}

export const handler: Handler = async (event, context) => {
  try {
    const appInstance = await initApp();
    const serverless = (await import("@netlify/functions")).default;
    return await serverless(appInstance)(event, context);
  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};