#!/bin/bash
# Vercel build script

echo "Starting Vercel build process..."

# Build the frontend with Vite
echo "Building frontend..."
npm run build

# Ensure the output directory exists and has correct structure
echo "Verifying build output..."
if [ -d "dist/public" ]; then
    echo "✓ Frontend build output found in dist/public"
    ls -la dist/public/
else
    echo "✗ Frontend build output not found"
    exit 1
fi

echo "Vercel build complete!"