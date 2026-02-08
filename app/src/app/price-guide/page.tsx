'use client';

import { useState } from 'react';
import Link from 'next/link';

const industries = [
  { value: 'hospitality', label: 'Hospitality / Accommodation' },
  { value: 'restaurant', label: 'Restaurant / Cafe' },
  { value: 'retail', label: 'Retail' },
  { value: 'trades', label: 'Trades & Services' },
  { value: 'professional', label: 'Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'transport', label: 'Transport & Logistics' },
  { value: 'beauty', label: 'Beauty & Wellness' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'construction', label: 'Construction' },
  { value: 'technology', label: 'Technology / IT' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education / Training' },
  { value: 'franchise', label: 'Franchise' },
  { value: 'other', label: 'Other' },
];

const states = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'Australian Capital Territory' },
];

interface ContactData {
  name: string;
  email: string;
  phone: string;
  businessName: string;
}

interface BusinessData {
  industry: string;
  annualRevenue: string;
  annualProfit: string;
  yearsOperating: string;
  state: string;
  ownerOperated: boolean;
}

interface PriceGuideResult {
  priceRange: {
    low: number;
    mid: number;
    high: number;
  };
  confidence: string;
  factors: string[];
  methodology: string;
  disclaimer: string;
  multiples: {
    applied: { low: number; high: number };
  };
}

export default function PriceGuidePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [result, setResult] = useState<PriceGuideResult | null>(null);

  const [contactData, setContactData] = useState<ContactData>({
    name: '',
    email: '',
    phone: '',
    businessName: '',
  });

  const [businessData, setBusinessData] = useState<BusinessData>({
    industry: '',
    annualRevenue: '',
    annualProfit: '',
    yearsOperating: '',
    state: 'QLD',
    ownerOperated: true,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactData,
          source: 'price_guide',
        }),
      });

      if (!res.ok) throw new Error('Failed to save contact');

      const data = await res.json();
      setLeadId(data.leadId);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const priceRes = await fetch('/api/price-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: businessData.industry,
          annualRevenue: parseFloat(businessData.annualRevenue),
          annualProfit: parseFloat(businessData.annualProfit),
          yearsOperating: parseInt(businessData.yearsOperating),
          state: businessData.state,
          ownerOperated: businessData.ownerOperated,
        }),
      });

      if (!priceRes.ok) {
        const errData = await priceRes.json();
        throw new Error(errData.error || 'Failed to generate price guide');
      }

      const priceGuideResult = await priceRes.json();
      setResult(priceGuideResult);

      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactData,
          ...businessData,
          annualRevenue: businessData.annualRevenue,
          annualProfit: businessData.annualProfit,
          yearsOperating: businessData.yearsOperating,
          priceGuideResult,
        }),
      });

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            OwnerExit
          </Link>
          <div className="space-x-4">
            <Link href="/login" className="text-slate-300 hover:text-white transition">Log In</Link>
            <Link href="/signup" className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>1</div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>2</div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>3</div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {step === 1 && 'Get Your Free AI Price Guide'}
            {step === 2 && 'Tell Us About Your Business'}
            {step === 3 && 'Your Price Guide'}
          </h1>
          <p className="text-lg text-slate-400">
            {step === 1 && 'Enter your details to receive your personalised estimate.'}
            {step === 2 && "A few more details and we'll calculate your price guide."}
            {step === 3 && `Here's your estimated selling price range, ${contactData.name.split(' ')[0]}.`}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">{error}</div>
        )}

        {step === 1 && (
          <form onSubmit={handleContactSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
                <input type="text" required value={contactData.name} onChange={(e) => setContactData({ ...contactData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                <input type="email" required value={contactData.email} onChange={(e) => setContactData({ ...contactData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone (optional)</label>
                <input type="tel" value={contactData.phone} onChange={(e) => setContactData({ ...contactData, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="0412 345 678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Business Name (optional)</label>
                <input type="text" value={contactData.businessName} onChange={(e) => setContactData({ ...contactData, businessName: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="Acme Pty Ltd" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50">
                {loading ? 'Saving...' : 'Continue →'}
              </button>
              <p className="text-xs text-slate-500 text-center">Your information is kept confidential and will never be shared.</p>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleBusinessSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Industry *</label>
                <select required value={businessData.industry} onChange={(e) => setBusinessData({ ...businessData, industry: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                  <option value="">Select your industry</option>
                  {industries.map((ind) => (<option key={ind.value} value={ind.value}>{ind.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">State *</label>
                <select required value={businessData.state} onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                  {states.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Annual Revenue *</label>
                <input type="number" required min="0" value={businessData.annualRevenue} onChange={(e) => setBusinessData({ ...businessData, annualRevenue: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="e.g. 500000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Annual Net Profit (after owner salary) *</label>
                <input type="number" required value={businessData.annualProfit} onChange={(e) => setBusinessData({ ...businessData, annualProfit: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="e.g. 100000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Years in Operation *</label>
                <input type="number" required min="0" value={businessData.yearsOperating} onChange={(e) => setBusinessData({ ...businessData, yearsOperating: e.target.value })} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="e.g. 5" />
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="ownerOperated" checked={businessData.ownerOperated} onChange={(e) => setBusinessData({ ...businessData, ownerOperated: e.target.checked })} className="w-5 h-5 text-cyan-500 bg-slate-900 border-slate-600 rounded focus:ring-cyan-500" />
                <label htmlFor="ownerOperated" className="text-slate-300">Business is owner-operated (no manager in place)</label>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-700 text-white py-4 rounded-lg font-semibold hover:bg-slate-600 transition">← Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50">
                  {loading ? 'Calculating...' : 'Get My Price Guide →'}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && result && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 text-center">
              <p className="text-slate-400 mb-2">Your estimated selling price range:</p>
              <div className="text-4xl md:text-5xl font-bold text-white mb-4">
                {formatCurrency(result.priceRange.low)} - {formatCurrency(result.priceRange.high)}
              </div>
              <div className="text-lg text-cyan-400 mb-4">Most likely: {formatCurrency(result.priceRange.mid)}</div>
              <div className={`inline-block px-4 py-1 rounded-full text-sm ${result.confidence === 'HIGH' ? 'bg-green-500/20 text-green-400' : result.confidence === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {result.confidence} confidence
              </div>
            </div>
            {result.factors && result.factors.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Key Factors Considered</h3>
                <ul className="space-y-2">
                  {result.factors.map((factor, i) => (<li key={i} className="flex items-start space-x-2 text-slate-300"><span className="text-cyan-400">•</span><span>{factor}</span></li>))}
                </ul>
              </div>
            )}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">Methodology</h3>
              <p className="text-slate-400 text-sm">{result.methodology} approach using multiples of {result.multiples?.applied?.low?.toFixed(1)}x - {result.multiples?.applied?.high?.toFixed(1)}x</p>
            </div>
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-6 border border-cyan-500/30">
              <h3 className="text-xl font-bold text-white mb-2">Ready to sell?</h3>
              <p className="text-slate-300 mb-4">List your business on OwnerExit and save on broker commissions. Our AI tools help you sell faster.</p>
              <Link href="/signup" className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition">Get Started — From $499</Link>
            </div>
            <p className="text-xs text-slate-500 text-center">{result.disclaimer}</p>
          </div>
        )}
      </div>
    </main>
  );
}
