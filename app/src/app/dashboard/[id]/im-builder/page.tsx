'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const TABS = [
  { id: 'basics', label: 'Business Basics' },
  { id: 'location', label: 'Location & Premises' },
  { id: 'financials', label: 'Financials' },
  { id: 'operations', label: 'Operations' },
  { id: 'team', label: 'Team' },
  { id: 'assets', label: 'Assets' },
  { id: 'sale', label: 'Sale Details' },
  { id: 'generate', label: 'Generate IM' },
];

const SECTIONS = [
  { key: 'executive_summary', title: 'Executive Summary', tier: 1 },
  { key: 'business_overview', title: 'Business Overview', tier: 1 },
  { key: 'financial_performance', title: 'Financial Performance', tier: 2 },
  { key: 'operations', title: 'Operations & Systems', tier: 1 },
  { key: 'team_structure', title: 'Team & Management', tier: 1 },
  { key: 'assets_included', title: 'Assets Included', tier: 1 },
  { key: 'growth_opportunity', title: 'Growth & Opportunity', tier: 1 },
  { key: 'investment_summary', title: 'Investment Summary', tier: 1 },
];

export default function IMBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('basics');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [memoData, setMemoData] = useState<any>({});
  const [sections, setSections] = useState<any[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      const [bizRes, secRes] = await Promise.all([
        fetch(`/api/businesses?id=${businessId}`),
        fetch(`/api/im-sections?businessId=${businessId}`)
      ]);
      if (bizRes.ok) {
        const data = await bizRes.json();
        setBusiness(data.business);
        setMemoData(data.business?.memoData || {});
      }
      if (secRes.ok) {
        const data = await secRes.json();
        setSections(data.sections || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const saveData = async () => {
    setSaving(true);
    try {
      await fetch('/api/memo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, ...memoData })
      });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const generateSection = async (sectionKey: string) => {
    setGenerating(sectionKey);
    try {
      const res = await fetch('/api/im-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, sectionKey })
      });
      if (res.ok) {
        const data = await res.json();
        setSections(prev => prev.map(s => 
          s.sectionKey === sectionKey ? { ...s, content: data.section.content } : s
        ));
        setExpandedSection(sectionKey);
      }
    } catch (e) { console.error(e); }
    setGenerating(null);
  };

  const generateAll = async () => {
    for (const sec of SECTIONS) {
      await generateSection(sec.key);
    }
  };

  const updateField = (field: string, value: any) => {
    setMemoData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700/50 bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">← Dashboard</Link>
            <span className="text-white font-semibold">{business?.name || 'IM Builder'}</span>
          </div>
          <button onClick={saveData} disabled={saving} className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-500 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Business Basics</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Business Name" value={memoData.businessName || business?.name || ''} onChange={(v: any) => updateField('businessName', v)} />
                <Input label="Trading Name" value={memoData.tradingName || ''} onChange={(v: any) => updateField('tradingName', v)} />
                <Input label="ABN" value={memoData.abn || ''} onChange={(v: any) => updateField('abn', v)} />
                <Select label="Entity Type" value={memoData.entityType || ''} onChange={(v: any) => updateField('entityType', v)} options={['Pty Ltd', 'Sole Trader', 'Partnership', 'Trust', 'Other']} />
                <Input label="Year Established" type="number" value={memoData.established || ''} onChange={(v: any) => updateField('established', v)} />
                <Input label="Industry Category" value={memoData.industryCategory || business?.industry || ''} onChange={(v: any) => updateField('industryCategory', v)} />
                <Input label="Industry Subcategory" value={memoData.industrySubcategory || ''} onChange={(v: any) => updateField('industrySubcategory', v)} />
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Location & Premises</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Street Address" value={memoData.streetAddress || ''} onChange={(v: any) => updateField('streetAddress', v)} />
                <Input label="Suburb" value={memoData.suburb || business?.location || ''} onChange={(v: any) => updateField('suburb', v)} />
                <Input label="State" value={memoData.state || business?.state || ''} onChange={(v: any) => updateField('state', v)} />
                <Input label="Postcode" value={memoData.postcode || ''} onChange={(v: any) => updateField('postcode', v)} />
                <Select label="Location Type" value={memoData.locationType || ''} onChange={(v: any) => updateField('locationType', v)} options={['Strip Retail', 'Shopping Centre', 'Industrial', 'Office', 'Home-based', 'Other']} />
                <Input label="Premises Size (sqm)" type="number" value={memoData.premisesSqm || ''} onChange={(v: any) => updateField('premisesSqm', v)} />
                <Input label="Lease Expiry" type="date" value={memoData.leaseExpiry || ''} onChange={(v: any) => updateField('leaseExpiry', v)} />
                <Input label="Lease Years Remaining" type="number" value={memoData.leaseRemainingYrs || ''} onChange={(v: any) => updateField('leaseRemainingYrs', v)} />
                <Input label="Rent per Annum ($)" type="number" value={memoData.rentPerAnnum || ''} onChange={(v: any) => updateField('rentPerAnnum', v)} />
                <Select label="Rent Review Type" value={memoData.rentReviewType || ''} onChange={(v: any) => updateField('rentReviewType', v)} options={['CPI', 'Fixed %', 'Market', 'Other']} />
                <Checkbox label="Outgoings Included in Rent" checked={memoData.outgoingsIncluded || false} onChange={(v: any) => updateField('outgoingsIncluded', v)} />
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Financial Performance</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400">Current Year</h3>
                  <Input label="Revenue" type="number" value={memoData.revenueCurrent || ''} onChange={(v: any) => updateField('revenueCurrent', v)} />
                  <Input label="Cost of Goods" type="number" value={memoData.costOfGoodsCurrent || ''} onChange={(v: any) => updateField('costOfGoodsCurrent', v)} />
                  <Input label="Gross Profit" type="number" value={memoData.grossProfitCurrent || ''} onChange={(v: any) => updateField('grossProfitCurrent', v)} />
                  <Input label="Wages" type="number" value={memoData.wagesCurrent || ''} onChange={(v: any) => updateField('wagesCurrent', v)} />
                  <Input label="Rent" type="number" value={memoData.rentCurrent || ''} onChange={(v: any) => updateField('rentCurrent', v)} />
                  <Input label="EBITDA" type="number" value={memoData.ebitdaCurrent || ''} onChange={(v: any) => updateField('ebitdaCurrent', v)} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400">Prior Year</h3>
                  <Input label="Revenue" type="number" value={memoData.revenuePrior || ''} onChange={(v: any) => updateField('revenuePrior', v)} />
                  <Input label="EBITDA" type="number" value={memoData.ebitdaPrior || ''} onChange={(v: any) => updateField('ebitdaPrior', v)} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400">Two Years Prior</h3>
                  <Input label="Revenue" type="number" value={memoData.revenueTwoPrior || ''} onChange={(v: any) => updateField('revenueTwoPrior', v)} />
                  <Input label="EBITDA" type="number" value={memoData.ebitdaTwoPrior || ''} onChange={(v: any) => updateField('ebitdaTwoPrior', v)} />
                </div>
              </div>
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Owner Benefit / SDE</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Owner Salary" type="number" value={memoData.ownerSalary || ''} onChange={(v: any) => updateField('ownerSalary', v)} />
                  <Input label="Owner Perks (car, phone, etc)" type="number" value={memoData.ownerPerks || ''} onChange={(v: any) => updateField('ownerPerks', v)} />
                  <Textarea label="Add-backs Description" value={memoData.addBacks || ''} onChange={(v: any) => updateField('addBacks', v)} />
                  <Input label="Adjusted Earnings (SDE)" type="number" value={memoData.adjustedEarnings || ''} onChange={(v: any) => updateField('adjustedEarnings', v)} />
                </div>
              </div>
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Revenue Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Textarea label="Seasonality Notes" value={memoData.seasonalityNotes || ''} onChange={(v: any) => updateField('seasonalityNotes', v)} />
                  <Input label="Top Customer % of Revenue" type="number" value={memoData.topCustomerPct || ''} onChange={(v: any) => updateField('topCustomerPct', v)} />
                  <Textarea label="Customer Concentration Notes" value={memoData.customerConcentration || ''} onChange={(v: any) => updateField('customerConcentration', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Operations</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Operating Hours" value={memoData.operatingHours || ''} onChange={(v: any) => updateField('operatingHours', v)} placeholder="e.g. 7am - 3pm" />
                <Input label="Days per Week" type="number" value={memoData.daysPerWeek || ''} onChange={(v: any) => updateField('daysPerWeek', v)} />
                <Input label="Peak Times" value={memoData.peakTimes || ''} onChange={(v: any) => updateField('peakTimes', v)} />
                <Input label="POS System" value={memoData.posSystem || ''} onChange={(v: any) => updateField('posSystem', v)} />
                <Input label="Accounting Software" value={memoData.accountingSoftware || ''} onChange={(v: any) => updateField('accountingSoftware', v)} />
                <Input label="Other Systems" value={memoData.otherSystems || ''} onChange={(v: any) => updateField('otherSystems', v)} />
                <Checkbox label="Documented Processes" checked={memoData.documentedProcesses || false} onChange={(v: any) => updateField('documentedProcesses', v)} />
              </div>
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Suppliers</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Textarea label="Key Suppliers" value={memoData.keySuppliers || ''} onChange={(v: any) => updateField('keySuppliers', v)} />
                  <Input label="Supplier Terms" value={memoData.supplierTerms || ''} onChange={(v: any) => updateField('supplierTerms', v)} />
                  <Checkbox label="Exclusive Agreements" checked={memoData.exclusiveAgreements || false} onChange={(v: any) => updateField('exclusiveAgreements', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Team & Management</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Input label="Full-time Employees" type="number" value={memoData.ftEmployees || ''} onChange={(v: any) => updateField('ftEmployees', v)} />
                <Input label="Part-time Employees" type="number" value={memoData.ptEmployees || ''} onChange={(v: any) => updateField('ptEmployees', v)} />
                <Input label="Casual Employees" type="number" value={memoData.casualEmployees || ''} onChange={(v: any) => updateField('casualEmployees', v)} />
              </div>
              <Textarea label="Key Roles & Responsibilities" value={memoData.keyRoles || ''} onChange={(v: any) => updateField('keyRoles', v)} />
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Owner Hours per Week" type="number" value={memoData.ownerHoursPerWeek || ''} onChange={(v: any) => updateField('ownerHoursPerWeek', v)} />
                <Checkbox label="Manager in Place" checked={memoData.managerInPlace || false} onChange={(v: any) => updateField('managerInPlace', v)} />
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Assets Included</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="FFE Market Value ($)" type="number" value={memoData.ffeMktValue || ''} onChange={(v: any) => updateField('ffeMktValue', v)} />
                <Input label="FFE Age/Condition" value={memoData.ffeAge || ''} onChange={(v: any) => updateField('ffeAge', v)} />
                <Input label="Stock Value ($)" type="number" value={memoData.stockAtValue || ''} onChange={(v: any) => updateField('stockAtValue', v)} />
                <Checkbox label="Stock Included in Price" checked={memoData.stockIncluded || false} onChange={(v: any) => updateField('stockIncluded', v)} />
                <Textarea label="Vehicles Included" value={memoData.vehiclesIncluded || ''} onChange={(v: any) => updateField('vehiclesIncluded', v)} />
                <Textarea label="IP Included (trademarks, recipes, etc)" value={memoData.ipIncluded || ''} onChange={(v: any) => updateField('ipIncluded', v)} />
                <Textarea label="Licenses Required" value={memoData.licensesRequired || ''} onChange={(v: any) => updateField('licensesRequired', v)} />
              </div>
            </div>
          )}

          {activeTab === 'sale' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Sale Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Asking Price ($)" type="number" value={memoData.askingPrice || business?.askingPrice || ''} onChange={(v: any) => updateField('askingPrice', v)} />
                <Checkbox label="Stock Included in Price" checked={memoData.priceInclStock || false} onChange={(v: any) => updateField('priceInclStock', v)} />
                <Checkbox label="Training Included" checked={memoData.priceInclTraining || false} onChange={(v: any) => updateField('priceInclTraining', v)} />
                <Input label="Training Period" value={memoData.trainingPeriod || ''} onChange={(v: any) => updateField('trainingPeriod', v)} placeholder="e.g. 4 weeks" />
                <Textarea label="Reason for Sale" value={memoData.reasonForSale || ''} onChange={(v: any) => updateField('reasonForSale', v)} required />
                <Textarea label="Ideal Buyer Profile" value={memoData.idealBuyer || ''} onChange={(v: any) => updateField('idealBuyer', v)} />
              </div>
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Growth & Opportunity</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Textarea label="Competitive Advantages" value={memoData.competitiveAdvantages || ''} onChange={(v: any) => updateField('competitiveAdvantages', v)} />
                  <Textarea label="Growth Opportunities" value={memoData.growthOpportunities || ''} onChange={(v: any) => updateField('growthOpportunities', v)} />
                  <Textarea label="Recent Improvements" value={memoData.recentImprovements || ''} onChange={(v: any) => updateField('recentImprovements', v)} />
                  <Textarea label="Challenges to Note" value={memoData.challengesToNote || ''} onChange={(v: any) => updateField('challengesToNote', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Generate Information Memorandum</h2>
                <button onClick={generateAll} disabled={!!generating} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 disabled:opacity-50">
                  Generate All Sections
                </button>
              </div>
              <div className="space-y-3">
                {SECTIONS.map(sec => {
                  const existing = sections.find((s: any) => s.sectionKey === sec.key);
                  const isGenerating = generating === sec.key;
                  const hasContent = !!existing?.content;
                  return (
                    <div key={sec.key} className="bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <span className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500' : 'bg-slate-500'}`} />
                          <span className="text-white font-medium">{sec.title}</span>
                          {sec.tier === 2 && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Tier 2</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasContent && (
                            <button onClick={() => setExpandedSection(expandedSection === sec.key ? null : sec.key)} className="text-slate-400 hover:text-white px-3 py-1">
                              {expandedSection === sec.key ? 'Hide' : 'Preview'}
                            </button>
                          )}
                          <button onClick={() => generateSection(sec.key)} disabled={isGenerating} className="bg-cyan-600 text-white px-3 py-1 rounded hover:bg-cyan-500 disabled:opacity-50 text-sm">
                            {isGenerating ? 'Generating...' : hasContent ? 'Regenerate' : 'Generate'}
                          </button>
                        </div>
                      </div>
                      {expandedSection === sec.key && existing?.content && (
                        <div className="px-4 pb-4">
                          <div className="bg-slate-800 rounded p-4 text-slate-300 text-sm whitespace-pre-wrap">{existing.content}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '', required = false }: any) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}{required && ' *'}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
    </div>
  );
}

function Textarea({ label, value, onChange, required = false }: any) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}{required && ' *'}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} required={required}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
        <option value="">Select...</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: any) {
  return (
    <div className="flex items-center space-x-2">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-600 rounded focus:ring-cyan-500" />
      <label className="text-slate-300 text-sm">{label}</label>
    </div>
  );
}
