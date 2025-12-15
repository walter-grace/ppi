import { NextRequest, NextResponse } from 'next/server';
import { getUserByWalletAddress, getUserCredits } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const user = await getUserByWalletAddress(walletAddress);
    if (!user) {
      return NextResponse.json({
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
      });
    }

    const credits = await getUserCredits(user.id);

    return NextResponse.json(
      credits || {
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
      }
    );
  } catch (error) {
    console.error('Error fetching credits balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits balance' },
      { status: 500 }
    );
  }
}

