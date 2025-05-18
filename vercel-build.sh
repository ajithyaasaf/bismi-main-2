#!/bin/bash

# Install dependencies
npm install

# Build the client
cd client
npm run build

# Build the server
cd ..
npm run build:server

echo "Build completed successfully"