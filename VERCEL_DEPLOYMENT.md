# Vercel Deployment Guide for Bismi Chicken Shop Management System

This guide will help you deploy the Bismi Chicken Shop Management System on Vercel. Follow these steps to ensure a successful deployment.

## Prerequisites

1. A GitHub account
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. Your Firebase project configured (as per the current setup)

## Step 1: Push Your Code to GitHub

1. Create a new GitHub repository
2. Push your code to the repository

## Step 2: Connect to Vercel

1. Log in to your Vercel account
2. Click "Add New..." > "Project"
3. Select the GitHub repository you created
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist

## Step 3: Configure Environment Variables

Add the following environment variables in the Vercel project settings:

```
NODE_ENV=production
```

For added security, consider adding your Firebase configuration as environment variables:

```
FIREBASE_API_KEY=AIzaSyA3f4gJOKZDIjy9gnhSSpMVLs1UblGxo0s
FIREBASE_AUTH_DOMAIN=bismi-broilers-3ca96.firebaseapp.com
FIREBASE_DATABASE_URL=https://bismi-broilers-3ca96-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=bismi-broilers-3ca96
FIREBASE_STORAGE_BUCKET=bismi-broilers-3ca96.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=949430744092
FIREBASE_APP_ID=1:949430744092:web:4ea5638a9d38ba3e76dbd9
```

## Step 4: Deploy

1. Click "Deploy"
2. Wait for the deployment to complete
3. Your application will be available at your-project-name.vercel.app

## Troubleshooting

If you encounter errors during deployment:

### Function Execution Timeout

If your serverless function times out, you may need to adjust the function settings in `vercel.json`. This file is already configured with increased memory and timeout limits.

### CORS Issues

If you're experiencing CORS issues when accessing the API, ensure the CORS headers are properly set in the server code. This has been added to the server code already.

### Database Connection Issues

If you're having trouble connecting to the Firebase Realtime Database:

1. Verify the Firebase configuration settings
2. Ensure the database rules are properly set to allow read/write access
3. Check if your IP is not restricted in Firebase security rules

## Additional Notes

- The application is configured to use Firebase Realtime Database for data persistence
- The server is set up to handle both local development and serverless deployment
- If you need to make further modifications for Vercel compatibility, focus on the server-side code

For more information and advanced configuration options, refer to the [Vercel documentation](https://vercel.com/docs).