-- Vercel Postgres Schema for Wallet & Credits System
-- Run this SQL in your Vercel Postgres database dashboard

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  wallet_address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table (support multiple wallets per user)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address VARCHAR(255) NOT NULL,
  network VARCHAR(50) NOT NULL DEFAULT 'base',
  is_primary BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, address, network)
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
  amount DECIMAL(10, 2) NOT NULL, -- USD amount (positive for purchase, negative for usage)
  credits INTEGER NOT NULL, -- Credit amount (positive for purchase, negative for usage)
  payment_hash VARCHAR(255), -- x402 payment hash
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reason TEXT, -- Reason for usage/refund
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credits balance table (denormalized for performance)
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);

-- Function to update user credits balance
CREATE OR REPLACE FUNCTION update_user_credits_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance, total_purchased, total_used, last_updated)
  VALUES (
    NEW.user_id,
    COALESCE((SELECT SUM(credits) FROM credit_transactions WHERE user_id = NEW.user_id AND status = 'completed'), 0),
    COALESCE((SELECT SUM(credits) FROM credit_transactions WHERE user_id = NEW.user_id AND type = 'purchase' AND status = 'completed'), 0),
    COALESCE((SELECT ABS(SUM(credits)) FROM credit_transactions WHERE user_id = NEW.user_id AND type = 'usage' AND status = 'completed'), 0),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = COALESCE((SELECT SUM(credits) FROM credit_transactions WHERE user_id = NEW.user_id AND status = 'completed'), 0),
    total_purchased = COALESCE((SELECT SUM(credits) FROM credit_transactions WHERE user_id = NEW.user_id AND type = 'purchase' AND status = 'completed'), 0),
    total_used = COALESCE((SELECT ABS(SUM(credits)) FROM credit_transactions WHERE user_id = NEW.user_id AND type = 'usage' AND status = 'completed'), 0),
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update credits balance
CREATE TRIGGER trigger_update_user_credits_balance
AFTER INSERT OR UPDATE ON credit_transactions
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_user_credits_balance();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

