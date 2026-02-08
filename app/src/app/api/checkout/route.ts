import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Pricing tiers
const TIERS = {
  STARTER: {
    name: 'Starter',
    price: 19900, // $199 in cents
    features: ['AI Price Guide', 'Basic listing page', 'Email inquiries', '90-day listing']
  },
  GROWTH: {
    name: 'Growth', 
    price: 49900, // $499 in cents
    features: ['Everything in Starter', 'AI Description Writer', 'Featured placement', '180-day listing']
  },
  PREMIUM: {
    name: 'Premium',
    price: 89900, // $899 in cents
    features: ['Everything in Growth', 'Info Memo Generator', 'NDA management', 'Syndication', '365-day listing']
  }
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, businessId } = await req.json();

    if (!tier || !TIERS[tier as keyof typeof TIERS]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const tierConfig = TIERS[tier as keyof typeof TIERS];

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `OwnerExit ${tierConfig.name} Listing`,
              description: tierConfig.features.join(' • '),
            },
            unit_amount: tierConfig.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success&tier=${tier}&businessId=${businessId}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?cancelled=true`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.email,
        businessId: businessId || '',
        tier: tier,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
