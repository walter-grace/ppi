# Vercel Deployment Guide

## Quick Deploy

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **No** (for first deployment)
   - Project name: **psa** (or your preferred name)
   - Directory: **./** (current directory)
   - Override settings? **No**

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and:
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

## Environment Variables

**⚠️ IMPORTANT:** You must add these environment variables in Vercel Dashboard:

1. Go to your project on Vercel → **Settings** → **Environment Variables**

2. Add the following variables:

### Required Variables

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
EBAY_CLIENT_ID=your_ebay_client_id_here
EBAY_CLIENT_SECRET=your_ebay_client_secret_here
```

### Optional Variables (but recommended)

```
WATCH_DATABASE_API_KEY=your_watch_database_api_key_here
# OR use RAPIDAPI_KEY as fallback:
RAPIDAPI_KEY=your_rapidapi_key_here

WATCHCHARTS_API_KEY=your_watchcharts_api_key_here
PSA_TOKEN=your_psa_token_here
EBAY_OAUTH=your_ebay_oauth_token_here
```

### Setting Environment Variables

- **For all environments**: Add to Production, Preview, and Development
- **After adding**: Redeploy your project for changes to take effect

## Build Settings

Vercel will auto-detect Next.js, but verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Node Version**: 18.x or higher (auto-detected)

## Post-Deployment

1. **Test your deployment**:
   - Visit your Vercel URL
   - Test the chat functionality
   - Test eBay search
   - Test image upload features

2. **Monitor logs**:
   - Go to **Deployments** → Click on a deployment → **Functions** tab
   - Check for any runtime errors

3. **Custom Domain** (optional):
   - Go to **Settings** → **Domains**
   - Add your custom domain

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify Node.js version (18+)
- Check build logs in Vercel dashboard

### API Routes Not Working

- Verify all environment variables are set
- Check function logs in Vercel dashboard
- Ensure API routes are in `app/api/` directory

### Environment Variables Not Loading

- Make sure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Next Steps

- Set up **Analytics** in Vercel dashboard
- Configure **Webhooks** for CI/CD
- Set up **Preview Deployments** for pull requests
- Enable **Edge Functions** if needed for better performance

