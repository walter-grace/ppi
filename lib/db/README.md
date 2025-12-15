# Database Setup - Vercel Postgres

This directory contains the database schema and utilities for the wallet and credits system.

## Files

- **`schema.sql`**: SQL schema to create all tables, indexes, and triggers
- **`types.ts`**: TypeScript type definitions for database models
- **`index.ts`**: Database utility functions for CRUD operations

## Quick Start

1. **Create Vercel Postgres Database**
   - See `VERCEL_POSTGRES_SETUP.md` for detailed instructions
   - Vercel will auto-add environment variables

2. **Run Schema**
   - Copy contents of `schema.sql`
   - Paste into Vercel Postgres SQL Editor
   - Execute

3. **Use Database Functions**
   ```typescript
   import { getUserByWalletAddress, addCredits, deductCredits } from '@/lib/db';
   
   // Get user
   const user = await getUserByWalletAddress('0x1234...');
   
   // Add credits
   await addCredits(user.id, 100, 9.0, 'payment_hash');
   
   // Deduct credits
   await deductCredits(user.id, 5, 'premium_analysis');
   ```

## API Routes

All API routes are in `app/api/`:

- **Wallet**:
  - `POST /api/wallet/connect` - Connect wallet
  - `GET /api/wallet/user?walletAddress=...` - Get user info

- **Credits**:
  - `GET /api/credits/balance?walletAddress=...` - Get balance
  - `POST /api/credits/purchase` - Purchase credits
  - `POST /api/credits/deduct` - Deduct credits (internal)
  - `GET /api/credits/transactions?walletAddress=...` - Transaction history

## Database Schema

### Tables

1. **users**: User accounts linked to wallet addresses
2. **wallets**: Multiple wallets per user (multi-chain support)
3. **credit_transactions**: All credit purchases and usage
4. **user_credits**: Denormalized balance for fast queries

### Key Features

- Automatic balance updates via triggers
- Multi-wallet support per user
- Transaction history tracking
- Atomic credit operations

## Environment Variables

Required in Vercel (auto-added when creating Postgres database):

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

## Credit Packages

Defined in `types.ts`:

- **Starter**: 10 credits = $1.00
- **Popular**: 100 credits = $9.00 (10% discount)
- **Pro**: 500 credits = $40.00 (20% discount)
- **Enterprise**: 1000 credits = $75.00 (25% discount)

## Credit Costs

- Search: 1 credit
- Premium Analysis: 5 credits
- Image Analysis: 3 credits
- Video Analysis: 10 credits
- Bulk Analysis: 1 credit per item (min 10 items)

