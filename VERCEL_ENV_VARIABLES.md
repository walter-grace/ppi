# Vercel Environment Variables

Copy and paste these into Vercel Dashboard → Settings → Environment Variables

## Required Variables

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
EBAY_CLIENT_ID=your_ebay_client_id_here
EBAY_CLIENT_SECRET=your_ebay_client_secret_here
```

## Optional (but Recommended)

```
WATCH_DATABASE_API_KEY=your_watch_database_api_key_here
# OR use RAPIDAPI_KEY as fallback:
RAPIDAPI_KEY=your_rapidapi_key_here

# Optional: Pre-generated eBay OAuth token (auto-generated if not provided)
EBAY_OAUTH=your_ebay_oauth_token_here

# Optional: Your app URL for HTTP-Referer headers (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Instructions

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above
4. Set them for **Production**, **Preview**, and **Development** environments
5. After adding, **redeploy** your project for changes to take effect

## Variable Descriptions

- **OPENROUTER_API_KEY**: Required for AI chat functionality and image/video analysis
- **EBAY_CLIENT_ID**: Required for eBay API authentication
- **EBAY_CLIENT_SECRET**: Required for eBay API authentication
- **WATCH_DATABASE_API_KEY** or **RAPIDAPI_KEY**: For watch database MCP integration
- **EBAY_OAUTH**: Optional - will be auto-generated from client ID/secret if not provided
- **NEXT_PUBLIC_APP_URL**: Optional - your production URL (auto-detected by Vercel)

