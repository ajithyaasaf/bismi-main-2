# Deploying Bismi Chicken Shop to Vercel

This guide outlines the steps to deploy the Bismi Chicken Shop application to Vercel.

## Prerequisites

1. A Vercel account
2. Firebase project with Realtime Database
3. Access to the project's GitHub repository

## Environment Variables

The following environment variables need to be set in your Vercel project:

- `FIREBASE_API_KEY`: Your Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `FIREBASE_APP_ID`: Your Firebase app ID
- `FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID (optional)
- `NODE_ENV`: Set to 'production'

## Deployment Steps

### Option 1: Deploy from GitHub

1. Connect your GitHub repository to Vercel
2. Configure the project with the following settings:
   - Build Command: `bash ./vercel-build.sh`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Add the Environment Variables listed above
4. Deploy

### Option 2: Deploy using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Navigate to your project directory
4. Run: `vercel`
5. Follow the prompts to configure your deployment
6. Set the environment variables when prompted

## Troubleshooting

If you encounter issues during deployment:

1. Check the build logs for any errors
2. Verify that all environment variables are correctly set
3. Ensure Firebase Realtime Database rules allow read/write operations
4. Check if your Firebase project has the appropriate authentication methods enabled

## Support

If you need further assistance with deployment:

1. Refer to the Vercel documentation: https://vercel.com/docs
2. Refer to the Firebase documentation: https://firebase.google.com/docs
3. Contact the development team for project-specific issues

## Post-Deployment

After successful deployment:

1. Test all functionality on the live site
2. Set up a custom domain (optional)
3. Configure additional security settings in Vercel dashboard
4. Set up monitoring and analytics