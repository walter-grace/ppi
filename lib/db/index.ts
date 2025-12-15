// Vercel Postgres database utilities
import { sql } from '@vercel/postgres';
import type {
  User,
  Wallet,
  CreditTransaction,
  UserCredits,
  CreateUserRequest,
  ConnectWalletRequest,
} from './types';

// ==================== User Operations ====================

export async function createUser(data: CreateUserRequest): Promise<User> {
  const result = await sql`
    INSERT INTO users (wallet_address, email)
    VALUES (${data.walletAddress}, ${data.email || null})
    RETURNING *
  `;
  return result.rows[0] as User;
}

export async function getUserByWalletAddress(walletAddress: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users
    WHERE wallet_address = ${walletAddress}
    LIMIT 1
  `;
  return result.rows[0] as User | null;
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  return result.rows[0] as User | null;
}

export async function getOrCreateUser(data: CreateUserRequest): Promise<User> {
  const existing = await getUserByWalletAddress(data.walletAddress);
  if (existing) {
    return existing;
  }
  return createUser(data);
}

// ==================== Wallet Operations ====================

export async function connectWallet(
  userId: string,
  data: ConnectWalletRequest
): Promise<Wallet> {
  const network = data.network || 'base';
  
  // Check if wallet already exists
  const existing = await sql`
    SELECT * FROM wallets
    WHERE user_id = ${userId} AND address = ${data.address} AND network = ${network}
    LIMIT 1
  `;
  
  if (existing.rows.length > 0) {
    return existing.rows[0] as Wallet;
  }
  
  // If this is the first wallet or marked as primary, set it as primary
  const isPrimary = await sql`
    SELECT COUNT(*) as count FROM wallets WHERE user_id = ${userId}
  `;
  
  const result = await sql`
    INSERT INTO wallets (user_id, address, network, is_primary)
    VALUES (${userId}, ${data.address}, ${network}, ${isPrimary.rows[0].count === '0'})
    RETURNING *
  `;
  
  return result.rows[0] as Wallet;
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const result = await sql`
    SELECT * FROM wallets
    WHERE user_id = ${userId}
    ORDER BY is_primary DESC, connected_at DESC
  `;
  return result.rows as Wallet[];
}

export async function setPrimaryWallet(userId: string, walletId: string): Promise<void> {
  await sql`
    UPDATE wallets
    SET is_primary = (id = ${walletId})
    WHERE user_id = ${userId}
  `;
}

// ==================== Credits Operations ====================

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const result = await sql`
    SELECT * FROM user_credits
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  
  if (result.rows.length === 0) {
    // Initialize credits balance if it doesn't exist
    await sql`
      INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
      VALUES (${userId}, 0, 0, 0)
      ON CONFLICT (user_id) DO NOTHING
    `;
    
    const newResult = await sql`
      SELECT * FROM user_credits
      WHERE user_id = ${userId}
      LIMIT 1
    `;
    return newResult.rows[0] as UserCredits;
  }
  
  return result.rows[0] as UserCredits;
}

export async function getTransactionByPaymentHash(
  paymentHash: string
): Promise<CreditTransaction | null> {
  const result = await sql`
    SELECT * FROM credit_transactions
    WHERE payment_hash = ${paymentHash}
    LIMIT 1
  `;
  return result.rows[0] as CreditTransaction | null;
}

export async function addCredits(
  userId: string,
  credits: number,
  amount: number,
  paymentHash: string
): Promise<CreditTransaction> {
  // Check if transaction already exists
  const existing = await getTransactionByPaymentHash(paymentHash);
  if (existing) {
    return existing;
  }

  const result = await sql`
    INSERT INTO credit_transactions (user_id, type, amount, credits, payment_hash, status)
    VALUES (${userId}, 'purchase', ${amount}, ${credits}, ${paymentHash}, 'pending')
    RETURNING *
  `;
  
  return result.rows[0] as CreditTransaction;
}

export async function completeTransaction(transactionId: string): Promise<void> {
  await sql`
    UPDATE credit_transactions
    SET status = 'completed'
    WHERE id = ${transactionId}
  `;
}

export async function failTransaction(transactionId: string): Promise<void> {
  await sql`
    UPDATE credit_transactions
    SET status = 'failed'
    WHERE id = ${transactionId}
  `;
}

export async function deductCredits(
  userId: string,
  credits: number,
  reason: string
): Promise<CreditTransaction | null> {
  // Check balance first
  const userCredits = await getUserCredits(userId);
  if (!userCredits || userCredits.balance < credits) {
    return null; // Insufficient credits
  }
  
  const result = await sql`
    INSERT INTO credit_transactions (user_id, type, amount, credits, status, reason)
    VALUES (${userId}, 'usage', 0, ${-credits}, 'completed', ${reason})
    RETURNING *
  `;
  
  return result.rows[0] as CreditTransaction;
}

export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<CreditTransaction[]> {
  const result = await sql`
    SELECT * FROM credit_transactions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  return result.rows as CreditTransaction[];
}

// ==================== Utility Functions ====================

export async function checkCreditsBalance(userId: string, requiredCredits: number): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits ? credits.balance >= requiredCredits : false;
}

