import { NextRequest, NextResponse } from 'next/server';
import { getUserByWalletAddress, deductCredits } from '@/lib/db';
import type { DeductCreditsRequest } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, amount, reason } = body as {
      walletAddress: string;
    } & DeductCreditsRequest;

    if (!walletAddress || !amount || !reason) {
      return NextResponse.json(
        { error: 'Wallet address, amount, and reason are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    const user = await getUserByWalletAddress(walletAddress);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const transaction = await deductCredits(user.id, amount, reason);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        credits: -transaction.credits,
        reason: transaction.reason,
        createdAt: transaction.created_at,
      },
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    return NextResponse.json(
      { error: 'Failed to deduct credits' },
      { status: 500 }
    );
  }
}

