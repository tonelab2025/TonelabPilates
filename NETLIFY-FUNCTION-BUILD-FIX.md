# Netlify Function Build Fix

## Problem Identified
The API endpoints are returning 404 "Page not found" instead of JSON responses. This indicates the Netlify function isn't being built or deployed properly.

## Root Cause
- TypeScript function (`api.ts`) not being compiled for Netlify
- Incorrect function import in `api.js`
- Missing build step for serverless functions

## Solution Applied
1. **Added function build script** - `build-functions.js` compiles TypeScript to JavaScript
2. **Updated build command** - Now includes function compilation step
3. **Enhanced Netlify config** - Added `node_bundler = "esbuild"` for better function handling
4. **Fixed function import** - Proper require statement for compiled function

## Build Process Now
1. `npm install` - Install dependencies
2. `vite build` - Build frontend to `dist/public`
3. `node build-functions.js` - Compile TypeScript function to JavaScript
4. Netlify deploys both frontend and compiled function

## Expected Result
- `/api/*` routes will work properly
- No more 404 errors for API calls
- Receipt upload will function correctly
- Content loading will work

This ensures the serverless function is properly compiled and available at deployment time.