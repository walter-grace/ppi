// Database types for Wallet & Credits System

export interface User {
  id: string;
  email?: string | null;
  wallet_address: string;
  created_at: Date;
  updated_at: Date;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  network: string;
  is_primary: boolean;
  connected_at: Date;
}

export type CreditTransactionType = 'purchase' | 'usage' | 'refund';
export type CreditTransactionStatus = 'pending' | 'completed' | 'failed';

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: CreditTransactionType;
  amount: number;
  credits: number;
  payment_hash?: string | null;
  status: CreditTransactionStatus;
  reason?: string | null;
  created_at: Date;
}

export interface UserCredits {
  user_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  last_updated: Date;
}

// Request/Response types
export interface CreateUserRequest {
  walletAddress: string;
  email?: string;
}

export interface ConnectWalletRequest {
  address: string;
  network?: string;
}

export interface PurchaseCreditsRequest {
  packageId: 'starter' | 'popular' | 'pro' | 'enterprise';
  paymentHash: string;
}

export interface DeductCreditsRequest {
  amount: number;
  reason: string;
}

export interface CreditPackage {
  id: 'starter' | 'popular' | 'pro' | 'enterprise';
  name: string;
  credits: number;
  price: number; // USD
  discount?: number; // percentage
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', name: 'Starter', credits: 10, price: 1.0 },
  { id: 'popular', name: 'Popular', credits: 100, price: 9.0, discount: 10 },
  { id: 'pro', name: 'Pro', credits: 500, price: 40.0, discount: 20 },
  { id: 'enterprise', name: 'Enterprise', credits: 1000, price: 75.0, discount: 25 },
];

// Credit costs
export const CREDIT_COSTS = {
  search: 1,
  premium_analysis: 5,
  image_analysis: 3,
  video_analysis: 10,
  bulk_analysis: 1, // per item, min 10 items
} as const;

