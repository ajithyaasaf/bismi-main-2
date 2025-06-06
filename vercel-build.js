// Simple Vercel build script
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Building for Vercel deployment...');

try {
  // Run the Vite build
  console.log('Running Vite build...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Check if build output exists
  if (fs.existsSync('dist/public')) {
    console.log('✓ Build output found in dist/public');
    
    // List the contents to verify
    const files = fs.readdirSync('dist/public');
    console.log('Build output contents:', files);
    
    // Check for index.html
    if (files.includes('index.html')) {
      console.log('✓ index.html found');
    } else {
      console.log('✗ index.html missing');
    }
    
    // Check for assets directory
    if (files.includes('assets')) {
      console.log('✓ assets directory found');
      const assets = fs.readdirSync('dist/public/assets');
      console.log('Assets:', assets.slice(0, 5)); // Show first 5 files
    } else {
      console.log('✗ assets directory missing');
    }
    
  } else {
    console.log('✗ Build output not found');
    process.exit(1);
  }
  
  console.log('✓ Vercel build completed successfully');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}