# Vercel Postgres Setup Guide

This guide will help you set up Vercel Postgres for the wallet and credits system.

## Step 1: Create Vercel Postgres Database

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project
3. Navigate to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name for your database (e.g., `psa-db`)
7. Select a region (choose closest to your users)
8. Click **Create**

Vercel will automatically:
- Create the database
- Add environment variables to your project:
  - `POSTGRES_URL`
  - `POSTGRES_PRISMA_URL`
  - `POSTGRES_URL_NON_POOLING`

## Step 2: Run Database Schema

1. In your Vercel project dashboard, go to **Storage** → Your database
2. Click on the **Data** tab
3. Click **SQL Editor** (or **Query**)
4. Open the file `lib/db/schema.sql` from this repository
5. Copy the entire contents
6. Paste into the SQL editor
7. Click **Run** (or **Execute**)

This will create:
- `users` table
- `wallets` table
- `credit_transactions` table
- `user_credits` table
- Indexes for performance
- Triggers for automatic balance updates

## Step 3: Verify Setup

You can verify the setup by checking:

1. **Tables Created**: In the **Data** tab, you should see:
   - `users`
   - `wallets`
   - `credit_transactions`
   - `user_credits`

2. **Environment Variables**: In **Settings** → **Environment Variables**, verify:
   - `POSTGRES_URL` is set
   - `POSTGRES_PRISMA_URL` is set
   - `POSTGRES_URL_NON_POOLING` is set

## Step 4: Test Locally (Optional)

To test locally, you'll need to add the Postgres connection strings to your `.env.local` file:

```env
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_postgres_url_here
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url_here
```

You can find these values in:
- Vercel Dashboard → Your Project → **Storage** → Your Database → **.env.local** tab

**Note**: Never commit `.env.local` to Git!

## Troubleshooting

### Connection Errors

If you see connection errors:
1. Verify environment variables are set in Vercel
2. Make sure you've redeployed after adding the variables
3. Check that the database region matches your deployment region

### Schema Errors

If schema creation fails:
1. Check the SQL syntax in `lib/db/schema.sql`
2. Make sure you're running the entire schema (not just parts)
3. Check for existing tables that might conflict

### Type Errors

If you see TypeScript errors:
1. Make sure `@vercel/postgres` is installed: `npm install @vercel/postgres`
2. Restart your TypeScript server in your IDE
3. Run `npm run build` to check for type errors

## Next Steps

After setting up the database:
1. ✅ Database schema is created
2. ✅ API routes are ready (`/api/wallet/*`, `/api/credits/*`)
3. ⏭️ Build wallet connection UI component
4. ⏭️ Build credits display component
5. ⏭️ Integrate x402 payment middleware
6. ⏭️ Add credit deduction to premium features

## Database Limits (Free Tier)

- **Storage**: 256 MB
- **Compute**: 60 hours/month
- **Databases**: 1

This should be sufficient for development and small-scale production use.

## Upgrading

If you need more resources:
1. Go to **Storage** → Your database
2. Click **Upgrade**
3. Choose a plan that fits your needs

