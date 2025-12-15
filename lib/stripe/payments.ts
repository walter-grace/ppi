// Stripe payment utilities
import { stripe } from './client';
import { getUserByWalletAddress, addCredits, completeTransaction, failTransaction } from '@/lib/db';
import { CREDIT_PACKAGES } from '@/lib/db/types';

// Create a Payment Intent for credit purchase
export async function createPaymentIntent(
  walletAddress: string,
  packageId: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const packageInfo = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!packageInfo) {
    throw new Error('Invalid package ID');
  }

  const user = await getUserByWalletAddress(walletAddress);
  if (!user) {
    throw new Error('User not found. Please connect your wallet first.');
  }

  // Get or create Stripe product
  const { getStripeProductByPackageId } = await import('./products');
  let stripeProduct = await getStripeProductByPackageId(packageId);

  if (!stripeProduct) {
    // Setup products if they don't exist
    const { setupStripeProducts } = await import('./products');
    await setupStripeProducts();
    stripeProduct = await getStripeProductByPackageId(packageId);
    
    if (!stripeProduct) {
      throw new Error('Failed to create Stripe product');
    }
  }

  // Create Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeProduct.amount,
    currency: 'usd',
    metadata: {
      walletAddress,
      userId: user.id,
      packageId,
      credits: packageInfo.credits.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret || '',
    paymentIntentId: paymentIntent.id,
  };
}

// Handle successful payment
export async function handlePaymentSuccess(paymentIntentId: string): Promise<void> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new Error(`Payment not succeeded. Status: ${paymentIntent.status}`);
  }

  const { walletAddress, userId, packageId, credits } = paymentIntent.metadata;

  if (!walletAddress || !userId || !packageId || !credits) {
    throw new Error('Missing payment metadata');
  }

  // Check if transaction already exists (avoid duplicates)
  const { getTransactionByPaymentHash } = await import('@/lib/db');
  let transaction = await getTransactionByPaymentHash(paymentIntentId);

  if (!transaction) {
    // Create new transaction
    transaction = await addCredits(
      userId,
      parseInt(credits),
      paymentIntent.amount / 100, // Convert cents to dollars
      paymentIntentId
    );
  }

  // Complete the transaction if not already completed
  if (transaction.status !== 'completed') {
    await completeTransaction(transaction.id);
  }
}

// Handle failed payment
export async function handlePaymentFailure(paymentIntentId: string): Promise<void> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const { userId } = paymentIntent.metadata;

  if (!userId) {
    return; // Can't find transaction without userId
  }

  // Find and fail the transaction
  // Note: This is a simplified version - in production, you'd want to query by payment_intent_id
  // For now, we'll rely on webhooks to handle this properly
}

