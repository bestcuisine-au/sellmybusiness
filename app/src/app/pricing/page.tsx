'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const tiers = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 499,
    duration: '90 days',
    features: ['AI Price Guide', 'Basic listing page', 'Email inquiries', '90-day listing'],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    price: 999,
    duration: '180 days',
    features: ['Everything in Starter', 'AI Description Writer', 'Featured placement', '180-day listing', 'Priority support'],
    cta: 'Go Growth',
    popular: true,
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 1999,
    duration: '365 days',
    features: ['Everything in Growth', 'Info Memo Generator', 'NDA management', 'Buyer access tracking', 'Syndication', '365-day listing'],
    cta: 'Go Premium',
    popular: false,
  },
];

function PricingContent() {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');
  const businessId = searchParams.get('businessId');

  const handleCheckout = async (tierId: string) => {
    setLoading(tierId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId, businessId }),
      });
      if (res.status === 401) { window.location.href = '/login?redirect=/pricing'; return; }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) { console.error(e); }
    finally { setLoading(null); }
  };

  return (
    <>
      {cancelled && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg mb-8 text-center">
          Payment cancelled. Choose a plan when ready.
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple Pricing</h1>
        <p className="text-xl text-slate-400">No broker fees. No hidden costs. Just results.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {tiers.map((tier) => (
          <div key={tier.id} className={`rounded-2xl p-8 ${tier.popular ? 'bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border-2 border-cyan-500/50 relative' : 'bg-slate-800/50 border border-slate-700'}`}>
            {tier.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm px-4 py-1 rounded-full">Most Popular</div>}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
              <div className="text-4xl font-bold text-white mb-1">${tier.price}</div>
              <div className="text-slate-400 text-sm">{tier.duration} listing</div>
            </div>
            <ul className="space-y-3 mb-8">
              {tier.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleCheckout(tier.id)} disabled={loading === tier.id}
              className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 ${tier.popular ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
              {loading === tier.id ? 'Loading...' : tier.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-slate-400 mb-4">Not sure? Try our free tools first:</p>
        <Link href="/price-guide" className="text-cyan-400 hover:underline">Free Price Guide →</Link>
      </div>

      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">FAQ</h2>
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">How much do brokers charge?</h3>
            <p className="text-slate-400">5-10% commission. On a $500K sale = $25K-$50K. Our max is $1,999.</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">What happens after payment?</h3>
            <p className="text-slate-400">Listing goes live immediately. Edit anytime. Inquiries come to your email.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700/50 py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">OwnerExit</Link>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300">Log In</Link>
            <Link href="/signup" className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg">Sign Up</Link>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
          <PricingContent />
        </Suspense>
      </div>
    </main>
  );
}
