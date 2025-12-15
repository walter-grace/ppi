# Wallet & Credits System with x402

## Overview
Simple, user-friendly wallet connection and credits system using x402 protocol for payments.

## Architecture

### 1. **User Wallet System**
- **Wallet Connection**: Connect crypto wallet (MetaMask, Coinbase Wallet, WalletConnect)
- **Wallet Storage**: Store wallet address in user profile (no private keys!)
- **Multi-wallet Support**: Support multiple wallet providers

### 2. **Credits System**
- **Credit Value**: 1 credit = $0.10 USD (or configurable)
- **Credit Packages**:
  - Starter: 10 credits = $1.00
  - Popular: 100 credits = $9.00 (10% discount)
  - Pro: 500 credits = $40.00 (20% discount)
  - Enterprise: 1000 credits = $75.00 (25% discount)

### 3. **Credit Usage**
- **Search/Analysis**: 1 credit per search
- **Premium Analysis**: 5 credits per detailed analysis
- **Image Analysis**: 3 credits per image
- **Video Analysis**: 10 credits per video
- **Bulk Analysis**: 1 credit per item (min 10 items)

## Implementation Plan

### Phase 1: Database Schema

```typescript
// User Model
interface User {
  id: string;
  email?: string;
  walletAddress: string; // Primary wallet
  createdAt: Date;
}

// Wallet Model
interface Wallet {
  id: string;
  userId: string;
  address: string;
  network: string; // 'ethereum', 'base', 'polygon', etc.
  isPrimary: boolean;
  connectedAt: Date;
}

// Credit Transaction Model
interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'usage' | 'refund';
  amount: number; // positive for purchase, negative for usage
  credits: number;
  paymentHash?: string; // x402 payment hash
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// User Credits Balance
interface UserCredits {
  userId: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  lastUpdated: Date;
}
```

### Phase 2: x402 Integration

#### 2.1 Install x402 SDK
```bash
npm install @x402/payment-middleware
```

#### 2.2 Payment Middleware Setup
```typescript
// app/api/payments/route.ts
import { paymentMiddleware } from '@x402/payment-middleware';

export const config = {
  payment: {
    "POST /api/payments/purchase-credits": {
      accepts: [
        {
          scheme: "exact",
          network: "base",
          token: "USDC",
        },
        {
          scheme: "exact",
          network: "ethereum",
          token: "USDC",
        },
      ],
      description: "Purchase credits for premium features",
    },
  },
};
```

#### 2.3 Credit Purchase Flow
1. User selects credit package
2. System calculates price in USDC
3. x402 payment middleware handles payment
4. On successful payment, credits are added to user account
5. Transaction recorded in database

### Phase 3: UI Components

#### 3.1 Wallet Connection Component
```typescript
// components/wallet/wallet-connect.tsx
- "Connect Wallet" button
- Wallet provider selection (MetaMask, Coinbase, WalletConnect)
- Display connected wallet address
- "Disconnect" option
```

#### 3.2 Credits Display Component
```typescript
// components/wallet/credits-balance.tsx
- Current credit balance (prominent display)
- "Add Credits" button
- Transaction history link
```

#### 3.3 Credit Purchase Modal
```typescript
// components/wallet/purchase-credits.tsx
- Credit package selection
- Price display (USD + crypto equivalent)
- "Purchase with Wallet" button
- Payment status indicator
- Success/error messages
```

### Phase 4: API Endpoints

#### 4.1 Wallet Management
- `POST /api/wallet/connect` - Connect wallet
- `GET /api/wallet/balance` - Get credit balance
- `POST /api/wallet/disconnect` - Disconnect wallet

#### 4.2 Credit Management
- `GET /api/credits/balance` - Get current balance
- `POST /api/credits/purchase` - Initiate credit purchase (x402)
- `GET /api/credits/transactions` - Get transaction history
- `POST /api/credits/deduct` - Deduct credits (internal)

#### 4.3 Payment Verification
- `POST /api/payments/verify` - Verify x402 payment
- `POST /api/payments/webhook` - Handle payment webhooks

### Phase 5: Credit Deduction Logic

```typescript
// lib/credits/deduct.ts
async function deductCredits(userId: string, amount: number, reason: string) {
  // Check balance
  // Deduct credits
  // Log transaction
  // Return success/failure
}
```

## User Flow

### Connecting Wallet (First Time)
1. User clicks "Connect Wallet" in header
2. Modal shows wallet provider options
3. User selects provider (e.g., MetaMask)
4. Wallet extension opens, user approves connection
5. Wallet address stored in database
6. User sees "0 credits" balance

### Purchasing Credits
1. User clicks "Add Credits" button
2. Modal shows credit packages
3. User selects package (e.g., "100 credits - $9.00")
4. User clicks "Purchase with Wallet"
5. x402 payment flow initiates
6. User approves payment in wallet
7. Payment processed via x402
8. Credits added to account
9. Success message shown

### Using Credits
1. User performs action (e.g., premium analysis)
2. System checks credit balance
3. If sufficient: deduct credits, proceed
4. If insufficient: show "Insufficient Credits" message with "Add Credits" button

## Database Choice

**Option 1: PostgreSQL (Recommended)**
- Reliable, ACID compliant
- Good for financial transactions
- Can use Vercel Postgres or Supabase

**Option 2: MongoDB**
- Easier to set up
- Good for rapid prototyping
- Can use MongoDB Atlas

**Option 3: SQLite (Development)**
- Simple for local development
- Not recommended for production

## Security Considerations

1. **Never store private keys** - Only wallet addresses
2. **Verify all payments** - Use x402 verification endpoint
3. **Rate limiting** - Prevent credit abuse
4. **Transaction logging** - Audit trail for all credit transactions
5. **Balance checks** - Atomic operations for credit deduction

## UI/UX Design

### Header Integration
- Wallet address (truncated): `0x1234...5678`
- Credit balance: `💎 150 credits`
- "Add Credits" button (luxury gold styling)

### Credit Purchase Modal
- Luxury card design
- Package cards with hover effects
- Clear pricing (USD + crypto)
- Payment status indicator
- Success animation

### Low Balance Warning
- Show warning when balance < 10 credits
- "Add Credits" CTA prominently displayed

## Implementation Steps

1. **Set up database** (PostgreSQL/Supabase)
2. **Install x402 SDK** and dependencies
3. **Create database schema** (users, wallets, transactions)
4. **Build wallet connection component**
5. **Build credits display component**
6. **Build purchase credits modal**
7. **Implement x402 payment middleware**
8. **Create API endpoints**
9. **Add credit deduction logic**
10. **Add UI to header**
11. **Test payment flow**
12. **Add transaction history page**

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# x402
X402_FACILITATOR_URL=https://facilitator.x402.org
X402_NETWORK=base
X402_TOKEN=USDC

# Wallet
WALLET_NETWORK=base
WALLET_CHAIN_ID=8453
```

## Next Steps

1. Choose database (recommend Supabase for easy setup)
2. Set up x402 facilitator account
3. Create database schema
4. Build wallet connection UI
5. Implement credit purchase flow
6. Add credit deduction to premium features

