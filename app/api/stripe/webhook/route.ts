import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { handlePaymentSuccess, handlePaymentFailure } from '@/lib/stripe/payments';
import { headers } from 'next/headers';

// Stripe webhook handler for payment events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as any;
        await handlePaymentSuccess(paymentIntent.id);
        console.log('✅ Payment succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as any;
        await handlePaymentFailure(failedPayment.id);
        console.log('❌ Payment failed:', failedPayment.id);
        break;

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object as any;
        await handlePaymentFailure(canceledPayment.id);
        console.log('⚠️ Payment canceled:', canceledPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhook route (Next.js needs this for raw body)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

