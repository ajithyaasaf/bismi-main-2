#!/bin/bash

# Build the client
npm run build

# Compile TypeScript files
npx tsc -p tsconfig.json 

# Bundle the server
npx esbuild server/index.ts --platform=node --packages=external --bundle --outdir=dist --minify