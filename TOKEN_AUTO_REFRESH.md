# eBay OAuth Token Auto-Refresh

## The Problem

eBay OAuth tokens expire after **~2 hours (7200 seconds)**. This means you'd have to manually regenerate tokens frequently.

## The Solution

We've implemented **automatic token refresh**! Here's how it works:

### Setup (One Time)

1. Add your eBay credentials to `.env.local`:
   ```env
   EBAY_CLIENT_ID=your_ebay_client_id_here
   EBAY_CLIENT_SECRET=your_ebay_client_secret_here
   ```

2. Optionally add an initial token (or let it generate automatically):
   ```env
   EBAY_OAUTH=your_token_here
   ```

### How It Works

**Automatic Token Generation:**
- When you make an eBay API call, if no token exists, it automatically generates one
- Uses your `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` to get a fresh token
- No manual intervention needed!

**Automatic Token Refresh:**
- If a token expires (401 error), the system automatically:
  1. Detects the expiration
  2. Generates a new token using your credentials
  3. Retries the request with the new token
  4. Continues seamlessly

### Benefits

✅ **No Manual Token Management** - Tokens refresh automatically  
✅ **No Interruptions** - Expired tokens are handled transparently  
✅ **Always Fresh** - New tokens generated on-demand  
✅ **Web App Integration** - "Get eBay OAuth Token" button for manual generation if needed  

### Token Lifecycle

1. **Initial Token**: Generated when first API call is made (if credentials are set)
2. **Token Expires**: After ~2 hours
3. **Auto-Refresh**: On next API call, new token is generated automatically
4. **Seamless**: Your app continues working without interruption

### Manual Token Generation

You can still generate tokens manually:

**Option 1: Web App**
- Go to `http://localhost:5002`
- Click "🔑 Get eBay OAuth Token Automatically"
- Copy the token to `.env.local`

**Option 2: Command Line**
```bash
python setup_ebay_oauth.py
```

### Important Notes

- **Client Credentials Required**: For auto-refresh to work, you need `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` in `.env.local`
- **Token Storage**: The generated token is only used for that API call - it's not saved to `.env.local` automatically (to avoid overwriting)
- **Rate Limits**: Token generation has no rate limit, so you can refresh as often as needed
- **Security**: Keep your `EBAY_CLIENT_SECRET` secure - don't share it or commit it to public repos

### Troubleshooting

**"Token expired and refresh failed"**
- Check that `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` are correct
- Verify your app has the correct OAuth scopes in eBay Developer Portal
- Make sure your app is approved for Production use

**"Unable to generate new token"**
- Verify credentials are in `.env.local`
- Check that your app is active in eBay Developer Portal
- Try generating a token manually first to test credentials

