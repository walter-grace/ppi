# eBay OAuth Automatic Token Generation Setup

## Quick Setup

You've provided your **Client ID**: `NicoZahn-YugiohPr-PRD-23cd82f4c-632193b1`

### Step 1: Get Your Client Secret

1. Go to [eBay Developer Keys](https://developer.ebay.com/my/keys)
2. Find your application (the one with Client ID: `NicoZahn-YugiohPr-PRD-23cd82f4c-632193b1`)
3. Look for **"Cert ID (Client Secret)"** - it's usually a long string
4. Copy it

### Step 2: Add to .env.local

Open your `.env.local` file and add:

```env
EBAY_CLIENT_ID=NicoZahn-YugiohPr-PRD-23cd82f4c-632193b1
EBAY_CLIENT_SECRET=your_cert_id_here
```

Replace `your_cert_id_here` with your actual Cert ID (Client Secret).

### Step 3: Generate Token Automatically

**Option A: Using the Web App**
1. Refresh your browser on `http://localhost:5002`
2. Scroll down to "🔑 Automatic eBay Token Generation"
3. Click "🔑 Get eBay OAuth Token Automatically"
4. Copy the generated token
5. Add it to `.env.local` as `EBAY_OAUTH=your_token_here`

**Option B: Using the Setup Script**
```bash
python setup_ebay_oauth.py
```

This will:
- Read your Client ID and Client Secret from `.env.local`
- Automatically request a token from eBay
- Display the token for you to copy

## How It Works

The app uses **OAuth 2.0 Client Credentials Grant Flow**:
- No user interaction required
- Perfect for public data access (Browse API)
- Tokens expire after ~2 hours, but can be regenerated anytime
- No rate limit on token generation

## Benefits

✅ **Automatic** - No manual token generation needed  
✅ **No Expiration Issues** - Generate new tokens on demand  
✅ **Easy Setup** - Just add Client ID and Secret once  
✅ **Web Interface** - Generate tokens directly from the app  

## Important Notes

- **Client Secret is sensitive** - Don't share it or commit it to public repos
- **Tokens expire** - But you can regenerate them anytime
- **Production vs Sandbox** - Make sure your app is set to Production if using production endpoints
- **OAuth Scopes** - Your app needs the `buy.browse` scope for the Browse API

## Troubleshooting

### "EBAY_CLIENT_ID not found"
- Make sure you added `EBAY_CLIENT_ID` to `.env.local`
- Check for typos

### "EBAY_CLIENT_SECRET not found"
- Make sure you added `EBAY_CLIENT_SECRET` to `.env.local`
- Get it from https://developer.ebay.com/my/keys

### "Failed to get token"
- Verify your Client ID and Secret are correct
- Check that your app has the correct OAuth scopes
- Make sure your app is approved for Production (if using production)

