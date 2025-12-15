# Vercel Environment Variables

Copy and paste these into Vercel Dashboard → Settings → Environment Variables

## Required Variables

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
EBAY_CLIENT_ID=your_ebay_client_id_here
EBAY_CLIENT_SECRET=your_ebay_client_secret_here
POSTGRES_URL=your_vercel_postgres_connection_string
POSTGRES_PRISMA_URL=your_vercel_postgres_connection_string
POSTGRES_URL_NON_POOLING=your_vercel_postgres_non_pooling_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

## Optional (but Recommended)

```
# Stripe Publishable Key (for frontend - safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

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
- **POSTGRES_URL**: Required for Vercel Postgres (wallet & credits system) - Auto-generated when you create a Postgres database in Vercel
- **POSTGRES_PRISMA_URL**: Required for Vercel Postgres - Same as POSTGRES_URL
- **POSTGRES_URL_NON_POOLING**: Required for Vercel Postgres - Non-pooling connection string
- **STRIPE_SECRET_KEY**: Required for Stripe payments - Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (use Secret key, starts with `sk_`)
- **STRIPE_WEBHOOK_SECRET**: Required for Stripe webhooks - Get from [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) after creating a webhook endpoint
- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Optional but recommended for frontend - Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (Publishable key, starts with `pk_` - safe to expose in frontend)
- **WATCH_DATABASE_API_KEY** or **RAPIDAPI_KEY**: For watch database MCP integration
- **EBAY_OAUTH**: Optional - will be auto-generated from client ID/secret if not provided
- **NEXT_PUBLIC_APP_URL**: Optional - your production URL (auto-detected by Vercel)

## Setting Up Vercel Postgres

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Choose a name for your database
4. Vercel will automatically add the `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, and `POSTGRES_URL_NON_POOLING` environment variables
5. After creating the database, run the SQL schema from `lib/db/schema.sql` in the Vercel Postgres dashboard:
   - Go to **Storage** → Your database → **Data** tab
   - Click **SQL Editor**
   - Paste the contents of `lib/db/schema.sql`
   - Click **Run**

## Setting Up Stripe

1. **Create a Stripe Account** (if you don't have one):
   - Go to [stripe.com](https://stripe.com) and sign up
   - Complete account setup

2. **Get Your API Keys**:
   - Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
   - Copy your **Secret key** (starts with `sk_`)
   - Add it as `STRIPE_SECRET_KEY` in Vercel environment variables

3. **Create Stripe Products** (one-time setup):
   - Run the setup script: `npx tsx scripts/setup-stripe-products.ts`
   - This creates products and prices for all credit packages

4. **Set Up Webhooks**:
   - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
   - Click **Add endpoint**
   - Set endpoint URL to: `https://your-app.vercel.app/api/stripe/webhook`
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
   - Copy the **Signing secret** (starts with `whsec_`)
   - Add it as `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

5. **Test Mode**:
   - Use test API keys for development
   - Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (declined)
   - See [Stripe Testing](https://stripe.com/docs/testing) for more test cards

