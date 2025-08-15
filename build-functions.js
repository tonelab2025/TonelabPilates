const { build } = require('esbuild');
const { copyFileSync, mkdirSync } = require('fs');
const { resolve } = require('path');

async function buildFunctions() {
  try {
    // Ensure output directory exists
    mkdirSync('netlify/functions', { recursive: true });
    
    // Build the TypeScript function
    await build({
      entryPoints: ['netlify/functions/api.ts'],
      outdir: 'netlify/functions',
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      external: ['@netlify/functions'],
      minify: true,
      sourcemap: false,
    });
    
    console.log('✅ Functions built successfully');
  } catch (error) {
    console.error('❌ Function build failed:', error);
    process.exit(1);
  }
}

buildFunctions();