'use client';

import { useState } from 'react';
import Link from 'next/link';

const industries = [
  // Hospitality
  'Coffee Shop',
  'Cafe',
  'Restaurant',
  'Fine Dining Restaurant',
  'Pub / Bar / Tavern',
  'Fast Food / Takeaway',
  'Fish & Chips / Chicken Shop',
  'Bakery',
  'Catering',
  'Hotel / Motel',
  // Healthcare
  'Healthcare & Medical',
  'Dental Practice',
  'Medical Practice',
  'Pharmacy',
  'Childcare Centre',
  // Professional
  'Professional Services',
  'Accounting Practice',
  'Legal Practice',
  // Retail
  'Retail Shop',
  'E-commerce',
  // Trades
  'Trades & Construction',
  'Manufacturing',
  'Transport & Logistics',
  'Wholesale / Distribution',
  // Services
  'Beauty Salon / Hair',
  'Gym / Fitness',
  'Automotive',
  'Other'
];

const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];

interface PriceGuideResult {
  priceRange: {
    low: number;
    mid: number;
    high: number;
  };
  multiples: {
    baseLow: number;
    baseHigh: number;
    adjustedLow: number;
    adjustedHigh: number;
  };
  confidence: string;
  methodology: string;
  factors: string[];
  industryInsights: string;
  inputs: {
    industry: string;
    annualRevenue: number;
    annualProfit: number;
    yearsOperating: number;
    state: string;
    profitMargin: number;
  };
  disclaimer: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
}

export default function PriceGuidePage() {
  const [formData, setFormData] = useState({
    industry: '',
    annualRevenue: '',
    annualProfit: '',
    yearsOperating: '',
    state: 'QLD',
    employees: ''
  });
  const [result, setResult] = useState<PriceGuideResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/price-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate price guide');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
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

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Price Guide
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Get an instant estimate of what your business might be worth. 
            Free, private, and takes 60 seconds.
          </p>
        </div>

        {!result ? (
          /* Form */
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 mb-2">Industry *</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    required
                  >
                    <option value="">Select industry...</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-2">State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    required
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 mb-2">Annual Revenue *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400">$</span>
                    <input
                      type="number"
                      name="annualRevenue"
                      value={formData.annualRevenue}
                      onChange={handleChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-4 py-3 text-white"
                      placeholder="e.g. 500000"
                      required
                    />
                  </div>
                  <p className="text-slate-500 text-sm mt-1">Total sales/turnover last 12 months</p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-2">Owner&apos;s Earnings (SDE) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400">$</span>
                    <input
                      type="number"
                      name="annualProfit"
                      value={formData.annualProfit}
                      onChange={handleChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-4 py-3 text-white"
                      placeholder="e.g. 120000"
                      required
                    />
                  </div>
                  <p className="text-slate-500 text-sm mt-1">Net profit + your salary + add-backs</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 mb-2">Years Operating</label>
                  <input
                    type="number"
                    name="yearsOperating"
                    value={formData.yearsOperating}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. 5"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2">Number of Employees</label>
                  <input
                    type="number"
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-cyan-400 text-sm">
                  <strong>🔒 Your data is private.</strong> We don&apos;t store this information unless you create a listing.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-4 rounded-lg font-semibold text-lg transition disabled:opacity-50"
              >
                {loading ? 'Calculating...' : 'Get My Price Guide'}
              </button>
            </form>
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-2xl p-8 border border-cyan-500/30">
              <div className="text-center mb-8">
                <p className="text-slate-400 mb-2">Your business could be worth</p>
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                  {formatCurrency(result.priceRange.low)} - {formatCurrency(result.priceRange.high)}
                </div>
                <p className="text-slate-400">
                  Most likely around <span className="text-cyan-400 font-semibold">{formatCurrency(result.priceRange.mid)}</span>
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  result.confidence === 'High' ? 'bg-green-500/20 text-green-400' :
                  result.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {result.confidence} Confidence
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Methodology</p>
                  <p className="text-white font-semibold">{result.methodology}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Multiple Range</p>
                  <p className="text-white font-semibold">{result.multiples.adjustedLow}x - {result.multiples.adjustedHigh}x</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Profit Margin</p>
                  <p className="text-white font-semibold">{result.inputs.profitMargin}%</p>
                </div>
              </div>
            </div>

            {/* Factors */}
            {result.factors.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Valuation Factors</h3>
                <ul className="space-y-2">
                  {result.factors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-cyan-400 mt-1">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Industry Insights */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">Industry Insights</h3>
              <p className="text-slate-400">{result.industryInsights}</p>
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600">
              <p className="text-slate-400 text-sm">{result.disclaimer}</p>
            </div>

            {/* CTA */}

            {/* Upsell to Detailed Guide */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Want a more accurate estimate?</h3>
              <p className="text-slate-400 mb-4">Add assets, lease details, licenses and more.</p>
              <Link href="/price-guide/detailed" className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold">Get Detailed Estimate</Link>
            </div>

            {/* Ready to Sell CTA */}
            <div className="bg-gradient-to-r from-purple-600/20 to-cyan-500/20 rounded-xl p-8 border border-purple-500/30 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Ready to sell?</h3>
              <p className="text-slate-400 mb-6">List your business and save thousands in broker fees.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold">Create Free Listing</Link>
                <button onClick={() => setResult(null)} className="border border-slate-600 text-slate-300 px-8 py-3 rounded-lg hover:bg-slate-800">Calculate Again</button>
              </div>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Based on thousands of Australian business sales and industry benchmark data
          </p>
        </div>
      </div>
    </main>
  );
}
