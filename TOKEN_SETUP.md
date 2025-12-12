# Token Setup Guide

This guide explains how to obtain the required API tokens for the YGO PSA10 Arbitrage Scanner.

## Required Tokens

1. **eBay OAuth Token** (`EBAY_OAUTH`)
2. **PSA API Token** (`PSA_TOKEN`)

---

## eBay OAuth Token Setup

### Step 1: Register as eBay Developer

1. Go to [eBay Developer Program](https://developer.ebay.com/)
2. Click "Sign In" or "Register"
3. Sign in with your eBay account (or create one)

### Step 2: Create Application Keys

1. After logging in, navigate to **"My Account"** → **"Application Keys"**
2. Click **"Create a Keyset"**
3. Select **"Production"** environment (or "Sandbox" for testing)
4. Fill in the required information:
   - Application Name: e.g., "YGO PSA10 Scanner"
   - Application Type: Select appropriate type
5. Click **"Create"**
6. You'll see:
   - **App ID (Client ID)**
   - **Cert ID (Client Secret)**
   - **Dev ID**

### Step 3: Generate User Access Token

1. In the **"Application Keys"** section, find your App ID
2. Click **"User Tokens"** next to your App ID
3. Select:
   - **Environment**: Production (or Sandbox)
   - **OAuth Scopes**: Select at minimum:
     - `https://api.ebay.com/oauth/api_scope/buy.browse` (required for Browse API)
4. Click **"Get a Token from eBay via Your Application"**
5. You'll be redirected to eBay to authorize the application
6. After authorization, you'll receive a **User Access Token**
7. **Copy this token** - this is what you need for `EBAY_OAUTH`

### Step 4: Add to .env.local

Open `.env.local` and replace `your_ebay_user_access_token_here` with your actual token:

```env
EBAY_OAUTH=v^1.1#i^1#r^0#I^3#f^0#p^1#t^Ul4...
```

### Important Notes

- User Access Tokens typically expire after 18 months
- You can refresh tokens using the refresh token (if provided)
- For production use, you may need to complete eBay's application review process
- The Browse API is free to use but has rate limits

**Helpful Links:**
- [eBay Developer Portal](https://developer.ebay.com/)
- [eBay OAuth Guide](https://developer.ebay.com/api-docs/static/oauth-tokens.html)
- [Browse API Documentation](https://developer.ebay.com/api-docs/buy/browse/overview.html)

---

## PSA API Token Setup

### Step 1: Register/Login to PSA

1. Go to [PSA Card](https://www.psacard.com/)
2. Create an account or log in to your existing account

### Step 2: Generate Access Token

1. Navigate to the [PSA Public API Documentation](https://www.psacard.com/publicapi/documentation)
2. You'll see a section titled **"Authentication"**
3. Click the button to **"Generate"** a new access token
4. The token will appear in the **"Access Token:"** field
5. **Copy the entire token** - it's a long string

**Important:** 
- You must be logged into your PSA account to generate tokens
- Tokens are generated using your PSA login credentials
- The token is used for authentication, not your password

### Step 3: API Details

**Base URL:** `https://api.psacard.com/publicapi/`

**Endpoint Used:**
```
GET https://api.psacard.com/publicapi/cert/GetByCertNumber/{cert_number}
Authorization: bearer {your_access_token}
```

**Rate Limits:**
- **Free accounts:** 100 API calls per day
- **Paid plans:** Higher daily limits available
- Contact `collectors-apis@collectors.com` for paid plan information

### Step 4: Add to .env.local

Open `.env.local` and replace `your_psa_api_token_here` with your actual access token:

```env
PSA_TOKEN=m9ThJ89ANFpvNvXumeHMfS0Yfx3Y1TmthzR1V2imMAB8VH8xHgjbdXS3S1-JwAt6M45MpI39JX8eG0ZohYO_UXUvPJPWxdbeeQegjH3EqNgdQqNTaCpd1XHLTsNHnYswvFHYVPa1pUpYXkELWqNdMcQd_Z3k1Xkw4yER0c3H40ESt72zBhcyu9HXgDT__hX_tBCG1ISIxGxBo__QmfexcIDxBrA03LIB6Pg2QaJHSLZDyDePGsKNZ52uKafGndjJJlHlBxwpSGRf9HmUAFtzHGlGrBVGBPHx-mdQEJi2uP0URhDg
```

**Note:** The example token above is just a placeholder - use your own generated token!

### Important Notes

- **Free accounts have a 100 call/day limit** - be mindful of this when testing
- Tokens are generated from your PSA account login
- API responses use standard HTTP codes:
  - `200`: Success (but may not have data)
  - `204`: Empty request data
  - `4xx`: Invalid request path
  - `500`: Invalid credentials or server error
- Response format includes `IsValidRequest` and `ServerMessage` fields
- If you need higher rate limits, contact `collectors-apis@collectors.com`

**Swagger Documentation:**
- [PSA Public API Swagger UI](https://api.psacard.com/publicapi/swagger) - Interactive API documentation and testing
- You can test API calls directly in Swagger by:
  1. Clicking the **"Authorize"** button at the top
  2. Entering `Bearer yourToken` (replace `yourToken` with your actual access token)
  3. Testing any endpoint directly in the browser
- The Swagger UI shows all available endpoints, request/response models, and allows live API testing

**Helpful Links:**
- [PSA Public API Documentation](https://www.psacard.com/publicapi/documentation)
- [PSA Public API Overview](https://www.psacard.com/publicapi)
- [PSA Card Website](https://www.psacard.com/)

---

## OpenRouter API Key Setup (Optional - for Deep Research Agent)

The deep research agent uses OpenRouter's AI models to find pricing information when PSA estimates aren't available. This is optional but recommended for better pricing discovery.

### Step 1: Create OpenRouter Account

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Click **"Sign Up"** or **"Log In"**
3. Create an account (you can use Google/GitHub OAuth)

### Step 2: Generate API Key

1. After logging in, navigate to **"Keys"** in the dashboard
2. Click **"Create Key"**
3. Give it a name (e.g., "PSA Arbitrage Scanner")
4. Copy the API key (starts with `sk-or-v1-...`)

### Step 3: Add Credits (if needed)

1. OpenRouter uses a pay-per-use model
2. Go to **"Credits"** in the dashboard
3. Add credits to your account (minimum usually $5-10)
4. The `o4-mini-deep-research` model costs vary by usage

### Step 4: Add to .env.local

Open `.env.local` and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=sk-or-v1-your_key_here
```

### Important Notes

- **OpenRouter is optional** - The tool will work without it, but will only use web scraping for PSA estimates
- **Costs money** - Each deep research query costs credits (typically $0.01-$0.10 per query)
- **Rate limits** - Free tier has limits; paid plans have higher limits
- **Privacy** - OpenRouter may log your requests; review their privacy policy

**Helpful Links:**
- [OpenRouter Dashboard](https://openrouter.ai/keys)
- [OpenRouter Pricing](https://openrouter.ai/docs/pricing)
- [OpenRouter Models](https://openrouter.ai/models)

---

## Testing Your Tokens

Once you've added your tokens to `.env.local`, test the setup:

### Test with Dry-Run (No API Calls)
```bash
python ygo_psa10_arbitrage.py --dry-run-sample
```

### Test with Real API (Small Limit)
```bash
python ygo_psa10_arbitrage.py --limit 5
```

If you see errors about authentication, double-check:
1. Your tokens are correctly pasted (no extra spaces)
2. Tokens haven't expired
3. You have the correct API permissions/scopes

---

## Troubleshooting

### "EBAY_OAUTH not found in environment"
- Make sure `.env.local` exists in the project root
- Check that `EBAY_OAUTH=` line is present and has a value
- Ensure there are no quotes around the token value

### "PSA_TOKEN not found in environment"
- Same as above for `PSA_TOKEN`

### eBay API Returns 401 Unauthorized
- Your token may have expired
- Regenerate a new User Access Token
- Ensure you selected the correct OAuth scopes

### PSA API Returns 401/403
- Verify your PSA token is correct
- Check if your account has API access enabled
- Contact PSA support if issues persist

### Rate Limiting Errors
- Both APIs have rate limits
- The tool includes automatic retries with backoff
- Try reducing `--limit` if you hit rate limits frequently

---

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - It's already in `.gitignore`
   - Double-check before pushing to Git

2. **Use different tokens for development and production**
   - Consider using eBay Sandbox tokens for testing

3. **Rotate tokens periodically**
   - Especially if you suspect they've been compromised

4. **Keep tokens secure**
   - Don't share them in screenshots or messages
   - Use environment variables in production deployments

