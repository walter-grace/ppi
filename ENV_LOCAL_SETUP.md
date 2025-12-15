# .env.local Setup Guide

This guide shows you what to add to your `.env.local` file for local development.

## Required Stripe Keys

Add these to your `.env.local` file:

```env
# Stripe Secret Key (backend only - keep secret!)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Publishable Key (safe for frontend - starts with pk_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret (for local development with Stripe CLI)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## How to Get Your Stripe Keys

1. **Go to Stripe Dashboard**: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

2. **You'll see two keys**:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
     - This is safe to use in frontend code
     - Add as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
     - ⚠️ **KEEP THIS SECRET!** Never commit to Git
     - Only use in backend/server code
     - Add as `STRIPE_SECRET_KEY`

3. **For Test Mode** (development):
   - Use keys that start with `pk_test_` and `sk_test_`
   - Test cards: `4242 4242 4242 4242` (success)

4. **For Live Mode** (production):
   - Use keys that start with `pk_live_` and `sk_live_`
   - Only switch to live after testing thoroughly

## Getting Webhook Secret for Local Development

1. **Install Stripe CLI**: 
   ```bash
   # Mac
   brew install stripe/stripe-cli/stripe
   
   # Windows (using Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`)
   - It will be displayed in the terminal
   - Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Example .env.local File

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# eBay
EBAY_CLIENT_ID=YourApp-ProdAPI-SBX-your-client-id
EBAY_CLIENT_SECRET=SBX-your-client-secret
EBAY_OAUTH=your-oauth-token-here

# Database (get from Vercel Dashboard → Storage → Your Database → .env.local tab)
POSTGRES_URL=postgres://user:password@host:port/database
POSTGRES_PRISMA_URL=postgres://user:password@host:port/database
POSTGRES_URL_NON_POOLING=postgres://user:password@host:port/database

# Optional
WATCH_DATABASE_API_KEY=your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Important Notes

- ⚠️ **Never commit `.env.local` to Git** - it's already in `.gitignore`
- ⚠️ **Use test keys for development** (`sk_test_` and `pk_test_`)
- ⚠️ **Rotate keys if exposed** - go to Stripe Dashboard → API Keys → Revoke
- ✅ **The `NEXT_PUBLIC_` prefix** makes the variable available in browser code
- ✅ **Variables without `NEXT_PUBLIC_`** are server-side only (more secure)

## Verifying Your Setup

After adding the keys, restart your dev server:

```bash
npm run dev
```

Check the console for any errors. If you see:
- ✅ "Connected to Stripe MCP" - Stripe is working!
- ❌ "STRIPE_SECRET_KEY is not set" - Check your `.env.local` file

