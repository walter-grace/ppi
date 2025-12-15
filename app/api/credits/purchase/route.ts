import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe/payments';
import { CREDIT_PACKAGES, type PurchaseCreditsRequest } from '@/lib/db/types';

// Create a Payment Intent for Stripe checkout
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, packageId } = body as {
      walletAddress: string;
      packageId: string;
    };

    if (!walletAddress || !packageId) {
      return NextResponse.json(
        { error: 'Wallet address and package ID are required' },
        { status: 400 }
      );
    }

    const packageInfo = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!packageInfo) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      walletAddress,
      packageId
    );

    return NextResponse.json({
      success: true,
      clientSecret,
      paymentIntentId,
      package: {
        id: packageInfo.id,
        name: packageInfo.name,
        credits: packageInfo.credits,
        price: packageInfo.price,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

