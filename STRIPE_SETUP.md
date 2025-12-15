# Stripe Payment Integration Setup

This guide will help you set up Stripe payments for the credits system.

## Overview

The application uses Stripe for processing credit purchases. Users can purchase credits using credit cards, debit cards, and other payment methods supported by Stripe.

## Features

- ✅ Stripe Payment Intents for secure payments
- ✅ Webhook handling for payment confirmation
- ✅ Automatic credit allocation on successful payment
- ✅ Stripe MCP server integration for AI-powered payment operations
- ✅ Support for all credit packages (Starter, Popular, Pro, Enterprise)

## Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete account verification

## Step 2: Get API Keys

1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. You'll see two keys:
   - **Publishable key** (starts with `pk_`) - Used on the frontend
   - **Secret key** (starts with `sk_`) - Used on the backend (keep this secret!)

3. Copy your **Secret key** and add it to Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `STRIPE_SECRET_KEY` with your secret key value
   - Set for Production, Preview, and Development

## Step 3: Create Stripe Products

Run the setup script to create products and prices for all credit packages:

```bash
npx tsx scripts/setup-stripe-products.ts
```

This will:
- Create Stripe products for each credit package
- Create prices for each product
- Display the Product IDs and Price IDs

**Note**: If products already exist, the script will use existing ones instead of creating duplicates.

## Step 4: Set Up Webhooks

Webhooks are required to automatically add credits when payments succeed.

### For Production (Vercel):

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-app.vercel.app/api/stripe/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

### For Local Development:

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (Mac) or see [Stripe CLI docs](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret shown (starts with `whsec_`)
5. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test Payments

### Test Cards

Stripe provides test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

See [Stripe Testing](https://stripe.com/docs/testing) for more test cards.

### Test Mode

1. Make sure you're using **Test mode** API keys (they start with `sk_test_`)
2. Use test cards above
3. Check [Stripe Dashboard → Payments](https://dashboard.stripe.com/test/payments) to see test payments

## Step 6: Stripe MCP Server

The application also integrates with Stripe's MCP server for AI-powered operations.

### Configuration

The Stripe MCP server is automatically initialized when:
- `STRIPE_SECRET_KEY` is set in environment variables
- The server connects using the local MCP server with your API key

### Available Tools

The Stripe MCP server provides tools for:
- Creating customers
- Creating payment intents
- Listing payments
- Managing subscriptions
- And more...

See [Stripe MCP Documentation](https://docs.stripe.com/mcp.md) for full list of tools.

## API Endpoints

### Create Payment Intent

```
POST /api/credits/purchase
Body: {
  "walletAddress": "0x...",
  "packageId": "popular"
}
Response: {
  "success": true,
  "clientSecret": "pi_...",
  "paymentIntentId": "pi_...",
  "package": { ... }
}
```

### Webhook Endpoint

```
POST /api/stripe/webhook
Headers: {
  "stripe-signature": "..."
}
```

This endpoint is called by Stripe automatically when payment events occur.

## Environment Variables

Required in Vercel:

```env
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
```

Optional (for frontend):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # if using Stripe.js on frontend
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook endpoint URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check Stripe Dashboard → Webhooks → Your endpoint → Recent events
4. For local development, make sure Stripe CLI is forwarding webhooks

### Payment Succeeds But Credits Not Added

1. Check webhook logs in Stripe Dashboard
2. Check server logs for webhook processing errors
3. Verify database connection is working
4. Check that `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint

### Products Not Found

1. Run `npx tsx scripts/setup-stripe-products.ts` to create products
2. Check Stripe Dashboard → Products to verify products exist
3. Verify API key has permission to create products

## Security Notes

- ⚠️ **Never commit API keys to Git**
- ⚠️ **Use test keys for development**
- ⚠️ **Rotate keys if exposed**
- ⚠️ **Use restricted API keys in production** (see [Stripe Restricted Keys](https://docs.stripe.com/keys.md#create-restricted-api-secret-key))

## Next Steps

After setting up Stripe:
1. ✅ API keys are configured
2. ✅ Products are created
3. ✅ Webhooks are set up
4. ⏭️ Build frontend payment UI component
5. ⏭️ Test payment flow end-to-end
6. ⏭️ Switch to live mode for production

