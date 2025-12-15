// Stripe products and prices setup
import { stripe } from './client';
import { CREDIT_PACKAGES } from '@/lib/db/types';

export interface StripeProduct {
  id: string;
  priceId: string;
  packageId: string;
  credits: number;
  amount: number; // in cents
}

// Create or get Stripe products and prices
export async function setupStripeProducts(): Promise<StripeProduct[]> {
  const products: StripeProduct[] = [];

  for (const pkg of CREDIT_PACKAGES) {
    try {
      // Check if product already exists
      const existingProducts = await stripe.products.search({
        query: `name:'${pkg.name} Credits' AND metadata['package_id']:'${pkg.id}'`,
      });

      let product;
      let price;

      if (existingProducts.data.length > 0) {
        // Product exists, get it
        product = existingProducts.data[0];
        
        // Get the price
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });
        price = prices.data[0];
      } else {
        // Create new product
        product = await stripe.products.create({
          name: `${pkg.name} Credits`,
          description: `${pkg.credits} credits for ${pkg.name} package${pkg.discount ? ` (${pkg.discount}% discount)` : ''}`,
          metadata: {
            package_id: pkg.id,
            credits: pkg.credits.toString(),
            discount: pkg.discount?.toString() || '0',
          },
        });

        // Create price
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(pkg.price * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            package_id: pkg.id,
            credits: pkg.credits.toString(),
          },
        });
      }

      products.push({
        id: product.id,
        priceId: price.id,
        packageId: pkg.id,
        credits: pkg.credits,
        amount: price.unit_amount || 0,
      });
    } catch (error) {
      console.error(`Error setting up product ${pkg.id}:`, error);
      throw error;
    }
  }

  return products;
}

// Get Stripe product by package ID
export async function getStripeProductByPackageId(
  packageId: string
): Promise<StripeProduct | null> {
  try {
    const products = await stripe.products.search({
      query: `metadata['package_id']:'${packageId}'`,
    });

    if (products.data.length === 0) {
      return null;
    }

    const product = products.data[0];
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    if (prices.data.length === 0) {
      return null;
    }

    const price = prices.data[0];

    return {
      id: product.id,
      priceId: price.id,
      packageId: packageId,
      credits: parseInt(product.metadata.credits || '0'),
      amount: price.unit_amount || 0,
    };
  } catch (error) {
    console.error(`Error getting product for package ${packageId}:`, error);
    return null;
  }
}

