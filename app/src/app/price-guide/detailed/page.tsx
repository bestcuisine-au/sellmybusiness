'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const industries = [
  'Coffee Shop', 'Cafe', 'Restaurant', 'Fine Dining Restaurant',
  'Pub / Bar / Tavern', 'Fast Food / Takeaway', 'Fish & Chips / Chicken Shop',
  'Bakery', 'Catering', 'Hotel / Motel',
  'Healthcare & Medical', 'Dental Practice', 'Medical Practice', 'Pharmacy', 'Childcare Centre',
  'Professional Services', 'Accounting Practice', 'Legal Practice',
  'Retail Shop', 'E-commerce',
  'Trades & Construction', 'Manufacturing', 'Transport & Logistics', 'Wholesale / Distribution',
  'Beauty Salon / Hair', 'Gym / Fitness', 'Automotive',
  'Other'
];

const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];

interface DetailedResult {
  priceRange: { low: number; mid: number; high: number };
  assetBreakdown: { goodwill: { low: number; high: number }; plantEquipment: number; stock: number };
  multiples: { applied: { low: number; high: number } };
  confidence: string;
  confidenceNotes: string[];
  factors: string[];
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function DetailedPriceGuidePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    industry: '', state: 'QLD', annualRevenue: '', annualProfit: '', yearsOperating: '',
    plantEquipment: '', stockInventory: '',
    isFranchise: false, franchiseBrand: '', ownerOperated: true,
    employeesFT: '', employeesPT: '',
    hasLease: true, leaseYearsRemaining: '', monthlyRent: '',
    hasLiquorLicense: false, hasGamingLicense: false, reasonForSale: ''
  });
  const [result, setResult] = useState<DetailedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(data => {
      setIsAuthenticated(!!data?.user);
    }).catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return <main className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Detailed Price Guide</h1>
          <p className="text-slate-400 mb-8">Sign up or log in for a more accurate valuation with advanced inputs.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold">Sign Up Free</Link>
            <Link href="/login" className="border border-slate-600 text-slate-300 px-6 py-3 rounded-lg">Log In</Link>
          </div>
          <p className="text-slate-500 mt-8 text-sm">Want a quick estimate? <Link href="/price-guide" className="text-cyan-400">Try our free Price Guide</Link></p>
        </div>
      </main>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/price-guide/detailed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error('Failed');
      setResult(await res.json());
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700/50 py-4"><div className="max-w-7xl mx-auto px-4 flex justify-between">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">OwnerExit</Link>
        <Link href="/dashboard" className="text-slate-300">Dashboard</Link>
      </div></nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Detailed Price Guide</h1>

        {!result ? (
          <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            {error && <div className="bg-red-500/10 text-red-400 p-4 rounded mb-6">{error}</div>}

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl text-white mb-4">Step 1: Business Basics</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><label className="text-slate-300 block mb-2">Industry *</label>
                    <select name="industry" value={formData.industry} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
                      <option value="">Select...</option>{industries.map(i => <option key={i} value={i}>{i}</option>)}
                    </select></div>
                  <div><label className="text-slate-300 block mb-2">State *</label>
                    <select name="state" value={formData.state} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select></div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><label className="text-slate-300 block mb-2">Annual Revenue *</label>
                    <input type="number" name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" placeholder="e.g. 800000" /></div>
                  <div><label className="text-slate-300 block mb-2">Annual Profit (EBITDA) *</label>
                    <input type="number" name="annualProfit" value={formData.annualProfit} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" placeholder="e.g. 150000" /></div>
                </div>
                <div><label className="text-slate-300 block mb-2">Years Operating</label>
                  <input type="number" name="yearsOperating" value={formData.yearsOperating} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" placeholder="e.g. 5" /></div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl text-white mb-4">Step 2: Assets & Structure</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><label className="text-slate-300 block mb-2">Plant & Equipment Value</label>
                    <input type="number" name="plantEquipment" value={formData.plantEquipment} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" placeholder="e.g. 100000" /></div>
                  <div><label className="text-slate-300 block mb-2">Stock / Inventory Value</label>
                    <input type="number" name="stockInventory" value={formData.stockInventory} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" placeholder="e.g. 25000" /></div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-slate-300 flex items-center gap-2"><input type="checkbox" name="isFranchise" checked={formData.isFranchise} onChange={handleChange} className="w-5 h-5" /> Franchise Business</label>
                </div>
                <div className="flex gap-4">
                  <label className="text-slate-300 flex items-center gap-2"><input type="radio" name="mgmt" checked={formData.ownerOperated} onChange={() => setFormData({...formData, ownerOperated: true})} /> Owner Operated</label>
                  <label className="text-slate-300 flex items-center gap-2"><input type="radio" name="mgmt" checked={!formData.ownerOperated} onChange={() => setFormData({...formData, ownerOperated: false})} /> Manager in Place</label>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><label className="text-slate-300 block mb-2">Full-time Employees</label>
                    <input type="number" name="employeesFT" value={formData.employeesFT} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                  <div><label className="text-slate-300 block mb-2">Part-time / Casual</label>
                    <input type="number" name="employeesPT" value={formData.employeesPT} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl text-white mb-4">Step 3: Lease & Licenses</h2>
                <div className="flex items-center gap-4"><label className="text-slate-300 flex items-center gap-2"><input type="checkbox" name="hasLease" checked={formData.hasLease} onChange={handleChange} className="w-5 h-5" /> Business has a lease</label></div>
                {formData.hasLease && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div><label className="text-slate-300 block mb-2">Years Remaining</label>
                      <input type="number" name="leaseYearsRemaining" value={formData.leaseYearsRemaining} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                    <div><label className="text-slate-300 block mb-2">Monthly Rent</label>
                      <input type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  <label className="text-slate-300 flex items-center gap-2"><input type="checkbox" name="hasLiquorLicense" checked={formData.hasLiquorLicense} onChange={handleChange} className="w-5 h-5" /> Liquor License</label>
                  <label className="text-slate-300 flex items-center gap-2"><input type="checkbox" name="hasGamingLicense" checked={formData.hasGamingLicense} onChange={handleChange} className="w-5 h-5" /> Gaming License</label>
                </div>
                <div><label className="text-slate-300 block mb-2">Reason for Sale</label>
                  <select name="reasonForSale" value={formData.reasonForSale} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
                    <option value="">Select...</option><option value="retirement">Retirement</option><option value="relocation">Relocation</option><option value="health">Health</option><option value="new_opportunity">New Opportunity</option><option value="other">Other</option>
                  </select></div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 ? <button type="button" onClick={() => setStep(step - 1)} className="border border-slate-600 text-slate-300 px-6 py-3 rounded-lg">Back</button> : <div />}
              {step < 3 ? <button type="button" onClick={() => setStep(step + 1)} className="bg-purple-600 text-white px-6 py-3 rounded-lg">Continue</button>
                : <button type="submit" disabled={loading} className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50">{loading ? 'Calculating...' : 'Get Detailed Estimate'}</button>}
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-2xl p-8 border border-cyan-500/30 text-center">
              <p className="text-slate-400 mb-2">Detailed Valuation Estimate</p>
              <div className="text-5xl font-bold text-white mb-2">{formatCurrency(result.priceRange.low)} - {formatCurrency(result.priceRange.high)}</div>
              <p className="text-slate-400">Most likely: <span className="text-cyan-400 font-semibold">{formatCurrency(result.priceRange.mid)}</span></p>
              <div className="mt-4"><span className={`px-4 py-2 rounded-full text-sm ${result.confidence === 'High' ? 'bg-green-500/20 text-green-400' : result.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{result.confidence} Confidence</span></div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Asset Breakdown</h3>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between"><span>Goodwill</span><span>{formatCurrency(result.assetBreakdown.goodwill.low)} - {formatCurrency(result.assetBreakdown.goodwill.high)}</span></div>
                {result.assetBreakdown.plantEquipment > 0 && <div className="flex justify-between"><span>Plant & Equipment</span><span>{formatCurrency(result.assetBreakdown.plantEquipment)}</span></div>}
                {result.assetBreakdown.stock > 0 && <div className="flex justify-between"><span>Stock</span><span>{formatCurrency(result.assetBreakdown.stock)}</span></div>}
              </div>
            </div>
            {result.factors.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Valuation Factors</h3>
                <ul className="space-y-2">{result.factors.map((f, i) => <li key={i} className="text-slate-300">• {f}</li>)}</ul>
              </div>
            )}
            <div className="flex gap-4">
              <Link href="/list-business" className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold text-center">Start My Listing</Link>
              <button onClick={() => { setResult(null); setStep(1); }} className="flex-1 border border-slate-600 text-slate-300 px-6 py-3 rounded-lg">Calculate Again</button>
            </div>
          </div>
        )}
        <p className="text-slate-500 text-sm text-center mt-8">🔒 Your data is private until you publish a listing.</p>
      </div>
    </main>
  );
}
