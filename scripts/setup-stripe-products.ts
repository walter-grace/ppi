#!/usr/bin/env node
/**
 * Setup script to create Stripe products and prices for credit packages
 * Run with: npx ts-node scripts/setup-stripe-products.ts
 * Or: node --loader ts-node/esm scripts/setup-stripe-products.ts
 */

import { setupStripeProducts } from '../lib/stripe/products';

async function main() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  try {
    const products = await setupStripeProducts();

    console.log('✅ Successfully created/verified Stripe products:\n');
    
    for (const product of products) {
      console.log(`📦 ${product.packageId.toUpperCase()}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID: ${product.priceId}`);
      console.log(`   Credits: ${product.credits}`);
      console.log(`   Amount: $${(product.amount / 100).toFixed(2)}`);
      console.log('');
    }

    console.log('✨ Setup complete!');
    console.log('\n💡 Add these Price IDs to your environment variables or database:');
    products.forEach((p) => {
      console.log(`   ${p.packageId.toUpperCase()}_PRICE_ID=${p.priceId}`);
    });
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error);
    process.exit(1);
  }
}

main();

