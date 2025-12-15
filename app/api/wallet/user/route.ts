import { NextRequest, NextResponse } from 'next/server';
import { getUserByWalletAddress, getUserWallets, getUserCredits } from '@/lib/db';

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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const wallets = await getUserWallets(user.id);
    const credits = await getUserCredits(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        email: user.email,
        createdAt: user.created_at,
      },
      wallets,
      credits: credits || {
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

