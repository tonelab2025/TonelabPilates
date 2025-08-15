#!/bin/bash

# Build script for Netlify deployment

echo "Building Tonelab Pilates application..."

# Install dependencies
npm install

# Build the application for production
npm run build

echo "Build completed successfully!"