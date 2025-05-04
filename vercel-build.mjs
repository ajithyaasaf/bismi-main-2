// Special build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build the client
console.log('Building client...');
execSync('npm run build', { stdio: 'inherit' });

// Create special vercel directories
if (!fs.existsSync('.vercel/output')) {
  fs.mkdirSync('.vercel/output', { recursive: true });
}

if (!fs.existsSync('.vercel/output/static')) {
  fs.mkdirSync('.vercel/output/static', { recursive: true });
}

if (!fs.existsSync('.vercel/output/functions')) {
  fs.mkdirSync('.vercel/output/functions', { recursive: true });
}

if (!fs.existsSync('.vercel/output/functions/api')) {
  fs.mkdirSync('.vercel/output/functions/api', { recursive: true });
}

// Copy client files to vercel static output
console.log('Copying client files to Vercel output directory...');
fs.cpSync('dist/client', '.vercel/output/static', { recursive: true });

// Generate special config file for Vercel
const config = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/api/(.*)', dest: '/api' },
    { src: '/(.*)', dest: '/index.html' }
  ]
};

fs.writeFileSync('.vercel/output/config.json', JSON.stringify(config, null, 2));

// Generate API function
const apiFunction = {
  runtime: 'nodejs18.x',
  handler: 'server/vercel.ts',
  memory: 1024
};

fs.writeFileSync('.vercel/output/functions/api.func/index.js', `
// Serverless function entry point
import app from '../../server/vercel.ts';
export default app;
`);

fs.writeFileSync('.vercel/output/functions/api.func/.vc-config.json', JSON.stringify(apiFunction, null, 2));

console.log('Vercel build complete!');