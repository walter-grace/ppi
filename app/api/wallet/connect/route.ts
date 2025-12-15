import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, connectWallet } from '@/lib/db';
import type { ConnectWalletRequest } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, network } = body as ConnectWalletRequest & { walletAddress: string };

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser({ walletAddress });

    // Connect wallet
    const wallet = await connectWallet(user.id, {
      address: walletAddress,
      network: network || 'base',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        email: user.email,
      },
      wallet: {
        id: wallet.id,
        address: wallet.address,
        network: wallet.network,
        isPrimary: wallet.is_primary,
      },
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return NextResponse.json(
      { error: 'Failed to connect wallet' },
      { status: 500 }
    );
  }
}

