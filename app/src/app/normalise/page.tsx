'use client';

import { useState } from 'react';
import Link from 'next/link';

const industries = [
  { value: 'cafe_restaurant', label: 'Cafe / Restaurant', anzsic: 'Cafes and Restaurants' },
  { value: 'takeaway', label: 'Takeaway / Fast Food', anzsic: 'Takeaway Food Services' },
  { value: 'pub_bar', label: 'Pub / Bar / Tavern', anzsic: 'Pubs, Taverns and Bars' },
  { value: 'retail', label: 'Retail Store', anzsic: 'Retail Trade - Supermarkets' },
  { value: 'bakery', label: 'Bakery', anzsic: 'Bakery Products Retailing' },
  { value: 'construction', label: 'Construction / Building', anzsic: 'Building Construction' },
  { value: 'plumbing', label: 'Plumbing Services', anzsic: 'Plumbing Services' },
  { value: 'electrical', label: 'Electrical Services', anzsic: 'Electrical Services' },
  { value: 'accounting', label: 'Accounting Services', anzsic: 'Accounting Services' },
  { value: 'legal', label: 'Legal Services', anzsic: 'Legal Services' },
  { value: 'beauty', label: 'Hairdressing / Beauty', anzsic: 'Hairdressing and Beauty Services' },
  { value: 'auto_repair', label: 'Auto Repair / Mechanical', anzsic: 'Motor Vehicle Repair and Maintenance' },
  { value: 'real_estate', label: 'Real Estate Services', anzsic: 'Real Estate Services' },
  { value: 'gym', label: 'Gym / Fitness Centre', anzsic: 'Gym and Fitness Centres' },
  { value: 'technology', label: 'Technology / IT Services', anzsic: 'Computer System Design Services' },
  { value: 'consulting', label: 'Consulting / Professional Services', anzsic: 'Management Advice and Consulting' },
  { value: 'veterinary', label: 'Veterinary Services', anzsic: 'Veterinary Services' },
  { value: 'cleaning', label: 'Cleaning Services', anzsic: 'Cleaning Services' },
  { value: 'landscaping', label: 'Landscaping', anzsic: 'Landscaping Services' },
  { value: 'courier', label: 'Courier / Delivery', anzsic: 'Courier and Delivery Services' },
  { value: 'graphic_design', label: 'Graphic Design', anzsic: 'Graphic Design Services' },
  { value: 'photography', label: 'Photography', anzsic: 'Photography Services' },
  { value: 'medical', label: 'Medical / Dental Practice', anzsic: 'Medical and Dental Practices' },
  { value: 'childcare', label: 'Child Care', anzsic: 'Child Care Services' },
  { value: 'hardware', label: 'Hardware / Building Supplies', anzsic: 'Hardware and Building Supplies Retailing' },
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
}

interface BusinessDetails {
  industry: string;
  annualRevenue: string;
  state: string;
  yearsOperating: string;
}

interface PLData {
  revenue: string;
  cogs: string;
  ownerSalary: string;
  staffWages: string;
  rent: string;
  motorVehicle: string;
  interest: string;
  depreciation: string;
  otherExpenses: { description: string; amount: string }[];
}

interface NormalisationAnswers {
  ownerHours: string;
  nonWorkingPayroll: string;
  ownPremises: string;
  marketRent: string;
  personalExpenses: { description: string; amount: string }[];
  oneOffCosts: { description: string; amount: string }[];
  relatedPartyAdjustments: string;
}

export default function NormalizePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const [contactData, setContactData] = useState<ContactData>({
    name: '',
    email: '',
  });

  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    industry: '',
    annualRevenue: '',
    state: 'QLD',
    yearsOperating: '',
  });

  const [plData, setPLData] = useState<PLData>({
    revenue: '',
    cogs: '',
    ownerSalary: '',
    staffWages: '',
    rent: '',
    motorVehicle: '',
    interest: '',
    depreciation: '',
    otherExpenses: [],
  });

  const [normalisationAnswers, setNormalisationAnswers] = useState<NormalisationAnswers>({
    ownerHours: '',
    nonWorkingPayroll: '',
    ownPremises: 'no',
    marketRent: '',
    personalExpenses: [],
    oneOffCosts: [],
    relatedPartyAdjustments: '',
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
          source: 'pnl_normaliser',
        }),
      });

      if (!res.ok) throw new Error('Failed to save contact');

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPLData({ ...plData, revenue: businessDetails.annualRevenue });
    setStep(3);
  };

  const handlePLSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4);
  };

  const addOtherExpense = () => {
    if (plData.otherExpenses.length < 10) {
      setPLData({
        ...plData,
        otherExpenses: [...plData.otherExpenses, { description: '', amount: '' }],
      });
    }
  };

  const updateOtherExpense = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...plData.otherExpenses];
    updated[index][field] = value;
    setPLData({ ...plData, otherExpenses: updated });
  };

  const removeOtherExpense = (index: number) => {
    const updated = plData.otherExpenses.filter((_, i) => i !== index);
    setPLData({ ...plData, otherExpenses: updated });
  };

  const addPersonalExpense = () => {
    setNormalisationAnswers({
      ...normalisationAnswers,
      personalExpenses: [...normalisationAnswers.personalExpenses, { description: '', amount: '' }],
    });
  };

  const updatePersonalExpense = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...normalisationAnswers.personalExpenses];
    updated[index][field] = value;
    setNormalisationAnswers({ ...normalisationAnswers, personalExpenses: updated });
  };

  const removePersonalExpense = (index: number) => {
    const updated = normalisationAnswers.personalExpenses.filter((_, i) => i !== index);
    setNormalisationAnswers({ ...normalisationAnswers, personalExpenses: updated });
  };

  const addOneOffCost = () => {
    setNormalisationAnswers({
      ...normalisationAnswers,
      oneOffCosts: [...normalisationAnswers.oneOffCosts, { description: '', amount: '' }],
    });
  };

  const updateOneOffCost = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...normalisationAnswers.oneOffCosts];
    updated[index][field] = value;
    setNormalisationAnswers({ ...normalisationAnswers, oneOffCosts: updated });
  };

  const removeOneOffCost = (index: number) => {
    const updated = normalisationAnswers.oneOffCosts.filter((_, i) => i !== index);
    setNormalisationAnswers({ ...normalisationAnswers, oneOffCosts: updated });
  };

  const handleNormalisationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactData,
          businessDetails,
          plData,
          normalisationAnswers,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to normalise P&L');
      }

      const resultData = await res.json();
      setResult(resultData);
      setStep(5);
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
            <Link href="/login" className="text-slate-300 hover:text-white transition">
              Log In
            </Link>
            <Link href="/signup" className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          <div className="flex items-center space-x-2">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm ${step >= 1 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>1</div>
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm ${step >= 2 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>2</div>
            <div className={`w-12 h-1 ${step >= 3 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm ${step >= 3 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>3</div>
            <div className={`w-12 h-1 ${step >= 4 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm ${step >= 4 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>4</div>
            <div className={`w-12 h-1 ${step >= 5 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm ${step >= 5 ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>✓</div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {step === 1 && 'P&L Normaliser'}
            {step === 2 && 'Business Details'}
            {step === 3 && 'Enter Your P&L'}
            {step === 4 && 'Normalisation Questions'}
            {step === 5 && 'Your Normalised EBITDA'}
          </h1>
          <p className="text-lg text-slate-400">
            {step === 1 && 'Get a normalised EBITDA with industry benchmark comparison'}
            {step === 2 && 'Tell us about your business'}
            {step === 3 && 'Enter your profit & loss line items'}
            {step === 4 && 'Help us identify addbacks and adjustments'}
            {step === 5 && 'See your true earnings potential'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Contact Info */}
        {step === 1 && (
          <form onSubmit={handleContactSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
                <input
                  type="text"
                  required
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue →'}
              </button>
              <p className="text-xs text-slate-500 text-center">
                Your information is kept confidential and will never be shared.
              </p>
            </div>
          </form>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <form onSubmit={handleBusinessDetailsSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Industry *</label>
                <select
                  required
                  value={businessDetails.industry}
                  onChange={(e) => setBusinessDetails({ ...businessDetails, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Select your industry</option>
                  {industries.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Annual Revenue *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={businessDetails.annualRevenue}
                  onChange={(e) => setBusinessDetails({ ...businessDetails, annualRevenue: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">State *</label>
                <select
                  required
                  value={businessDetails.state}
                  onChange={(e) => setBusinessDetails({ ...businessDetails, state: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {states.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Years Operating *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={businessDetails.yearsOperating}
                  onChange={(e) => setBusinessDetails({ ...businessDetails, yearsOperating: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-700 text-white py-4 rounded-lg font-semibold hover:bg-slate-600 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Continue →
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: P&L Entry */}
        {step === 3 && (
          <form onSubmit={handlePLSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Revenue *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={plData.revenue}
                  onChange={(e) => setPLData({ ...plData, revenue: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Annual revenue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cost of Goods Sold *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={plData.cogs}
                  onChange={(e) => setPLData({ ...plData, cogs: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 150000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Owner's Salary/Drawings *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={plData.ownerSalary}
                  onChange={(e) => setPLData({ ...plData, ownerSalary: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 80000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Staff Wages *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={plData.staffWages}
                  onChange={(e) => setPLData({ ...plData, staffWages: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 120000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rent *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={plData.rent}
                  onChange={(e) => setPLData({ ...plData, rent: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 40000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Motor Vehicle Expenses *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={plData.motorVehicle}
                  onChange={(e) => setPLData({ ...plData, motorVehicle: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Interest Expense *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={plData.interest}
                  onChange={(e) => setPLData({ ...plData, interest: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Depreciation *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={plData.depreciation}
                  onChange={(e) => setPLData({ ...plData, depreciation: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Other Expenses</label>
                {plData.otherExpenses.map((expense, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={expense.description}
                      onChange={(e) => updateOtherExpense(index, 'description', e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      min="0"
                      value={expense.amount}
                      onChange={(e) => updateOtherExpense(index, 'amount', e.target.value)}
                      className="w-32 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Amount"
                    />
                    <button
                      type="button"
                      onClick={() => removeOtherExpense(index)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {plData.otherExpenses.length < 10 && (
                  <button
                    type="button"
                    onClick={addOtherExpense}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    + Add other expense
                  </button>
                )}
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-slate-700 text-white py-4 rounded-lg font-semibold hover:bg-slate-600 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Continue →
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 4: Normalisation Questions */}
        {step === 4 && (
          <form onSubmit={handleNormalisationSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  How many hours per week does the owner work? *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="168"
                  value={normalisationAnswers.ownerHours}
                  onChange={(e) =>
                    setNormalisationAnswers({ ...normalisationAnswers, ownerHours: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. 50"
                />
                <p className="text-xs text-slate-400 mt-1">
                  We'll calculate a market-rate replacement salary
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Is anyone on payroll who doesn't work in the business?
                </label>
                <input
                  type="text"
                  value={normalisationAnswers.nonWorkingPayroll}
                  onChange={(e) =>
                    setNormalisationAnswers({ ...normalisationAnswers, nonWorkingPayroll: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g. Spouse paid $30k but doesn't work in business"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Do you own the premises?
                </label>
                <select
                  value={normalisationAnswers.ownPremises}
                  onChange={(e) =>
                    setNormalisationAnswers({ ...normalisationAnswers, ownPremises: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="no">No, I rent</option>
                  <option value="yes">Yes, I own the premises</option>
                </select>
              </div>

              {normalisationAnswers.ownPremises === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    What's the comparable market rent (annual)?
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={normalisationAnswers.marketRent}
                    onChange={(e) =>
                      setNormalisationAnswers({ ...normalisationAnswers, marketRent: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="e.g. 40000"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Any personal expenses running through the business?
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  e.g. personal car, phone, meals, travel, insurance
                </p>
                {normalisationAnswers.personalExpenses.map((expense, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={expense.description}
                      onChange={(e) => updatePersonalExpense(index, 'description', e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      min="0"
                      value={expense.amount}
                      onChange={(e) => updatePersonalExpense(index, 'amount', e.target.value)}
                      className="w-32 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Amount"
                    />
                    <button
                      type="button"
                      onClick={() => removePersonalExpense(index)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPersonalExpense}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  + Add personal expense
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Any one-off or non-recurring costs?
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  e.g. legal fees, fitout, unusual repairs
                </p>
                {normalisationAnswers.oneOffCosts.map((cost, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={cost.description}
                      onChange={(e) => updateOneOffCost(index, 'description', e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      min="0"
                      value={cost.amount}
                      onChange={(e) => updateOneOffCost(index, 'amount', e.target.value)}
                      className="w-32 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Amount"
                    />
                    <button
                      type="button"
                      onClick={() => removeOneOffCost(index)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOneOffCost}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  + Add one-off cost
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Any related-party transactions above/below market rate?
                </label>
                <textarea
                  value={normalisationAnswers.relatedPartyAdjustments}
                  onChange={(e) =>
                    setNormalisationAnswers({
                      ...normalisationAnswers,
                      relatedPartyAdjustments: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Describe any related-party arrangements..."
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-slate-700 text-white py-4 rounded-lg font-semibold hover:bg-slate-600 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Get Results →'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 5: Results */}
        {step === 5 && result && (
          <div className="space-y-6">
            {/* Normalised EBITDA Highlight */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 text-center">
              <p className="text-slate-400 mb-2">Your Normalised EBITDA:</p>
              <div className="text-5xl font-bold text-white mb-6">
                {formatCurrency(result.normalizedEBITDA)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-slate-500 text-sm">Reported EBITDA</p>
                  <p className="text-white text-lg font-semibold">
                    {formatCurrency(result.reportedEBITDA)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Total Addbacks</p>
                  <p className="text-cyan-400 text-lg font-semibold">
                    +{formatCurrency(result.totalAddbacks)}
                  </p>
                </div>
              </div>
            </div>

            {/* Side by Side P&L */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Reported vs Normalised P&L</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-cyan-400 font-semibold mb-3">Reported</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(result.reportedPL).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-400">{key}</span>
                        <span className="text-white">{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-purple-400 font-semibold mb-3">Normalized</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(result.normalizedPL).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-400">{key}</span>
                        <span className="text-white">{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Addbacks Breakdown */}
            {result.addbacks && result.addbacks.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Addbacks Breakdown</h3>
                <div className="space-y-3">
                  {result.addbacks.map((addback: any, i: number) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-medium">{addback.description}</p>
                        {addback.explanation && (
                          <p className="text-slate-400 text-sm mt-1">{addback.explanation}</p>
                        )}
                      </div>
                      <span className="text-cyan-400 font-semibold ml-4">
                        {formatCurrency(addback.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Industry Benchmark Comparison */}
            {result.benchmarkComparison && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Industry Benchmark Comparison</h3>
                <div className="space-y-3">
                  {result.benchmarkComparison.map((benchmark: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-300">{benchmark.metric}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-white">{benchmark.yourValue}%</span>
                        <span className="text-slate-500">vs {benchmark.industryAvg}%</span>
                        <span className="text-2xl">
                          {benchmark.status === 'good' && '🟢'}
                          {benchmark.status === 'average' && '🟡'}
                          {benchmark.status === 'poor' && '🔴'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appraisal Range */}
            {result.appraisalRange && (
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl p-6 border border-purple-500/30">
                <h3 className="text-xl font-semibold text-white mb-2">Indicative Appraisal Range</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Based on {result.appraisalRange.multipleLow}x - {result.appraisalRange.multipleHigh}x EBITDA
                </p>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(result.appraisalRange.low)} - {formatCurrency(result.appraisalRange.high)}
                </div>
              </div>
            )}

            {/* AI Commentary */}
            {result.aiCommentary && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Analysis</h3>
                <div className="text-slate-300 space-y-3 whitespace-pre-wrap">{result.aiCommentary}</div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-6 border border-cyan-500/30">
              <h3 className="text-xl font-bold text-white mb-2">Ready to sell?</h3>
              <p className="text-slate-300 mb-4">
                List your business on OwnerExit and save on broker commissions. Our AI tools help you sell
                faster.
              </p>
              <Link
                href="/signup"
                className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Get Started — From $499
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
