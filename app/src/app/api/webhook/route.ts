import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const { userId, businessId, tier } = session.metadata || {};
      
      if (userId && businessId && tier) {
        // Update the business with the paid tier
        await prisma.business.update({
          where: { id: businessId },
          data: {
            tier: tier as 'STARTER' | 'GROWTH' | 'PREMIUM',
            status: 'ACTIVE', // Auto-activate on payment
            publishedAt: new Date(),
            expiresAt: getExpirationDate(tier),
          },
        });

        console.log(`Payment successful for business ${businessId}, tier: ${tier}`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', paymentIntent.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

function getExpirationDate(tier: string): Date {
  const now = new Date();
  switch (tier) {
    case 'STARTER':
      return new Date(now.setDate(now.getDate() + 90));
    case 'GROWTH':
      return new Date(now.setDate(now.getDate() + 180));
    case 'PREMIUM':
      return new Date(now.setDate(now.getDate() + 365));
    default:
      return new Date(now.setDate(now.getDate() + 90));
  }
}

