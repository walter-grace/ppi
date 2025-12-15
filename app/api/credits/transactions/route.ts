import { NextRequest, NextResponse } from 'next/server';
import { getUserByWalletAddress, getTransactionHistory } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const user = await getUserByWalletAddress(walletAddress);
    if (!user) {
      return NextResponse.json({ transactions: [] });
    }

    const transactions = await getTransactionHistory(user.id, limit, offset);

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        credits: t.credits,
        paymentHash: t.payment_hash,
        status: t.status,
        reason: t.reason,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

