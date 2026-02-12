"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ───
interface Business {
  id: string;
  name: string;
  industry: string;
  subIndustry: string | null;
  location: string;
  state: string;
  postcode: string;
  askingPrice: number | null;
  annualRevenue: number | null;
  annualProfit: number | null;
  establishedYear: number | null;
  employees: number | null;
  description: string | null;
  reasonForSale: string | null;
}

interface Section {
  id?: string;
  sectionType: string;
  title: string;
  content: string | null;
  order: number;
  mediaUrls: string[];
  isVisible: boolean;
}

interface IMClientProps {
  business: Business;
  initialSections: Section[];
  isOwner: boolean;
}

interface FinancialData {
  year?: string;
  extracted?: ExtractedFinancials;
  revenue: number;
  otherIncome: number;
  expenses: Record<string, number>;
  totalExpenses: number;
  reportedProfit: number;
  addBacks: Array<{ name: string; amount: number }>;
  deductions: Array<{ name: string; amount: number }>;
  addBacksTotal: number;
  deductionsTotal: number;
  normalisedEBITDA: number;
  benchmarkComparison: Record<string, { value: number; benchmark: number; status: string }>;
  appraisalRange: { low: number; mid: number; high: number; multipleRange: string };
  uploadedAt?: string;
  updatedAt?: string;
}

interface ExtractedFinancials {
  revenue: number | null;
  otherIncome: number | null;
  costOfGoodsSold: number | null;
  wages: number | null;
  rent: number | null;
  utilities: number | null;
  insurance: number | null;
  marketing: number | null;
  depreciation: number | null;
  interest: number | null;
  otherExpenses: number | null;
  reportedProfit: number | null;
  ownerSalary: number | null;
  items: Array<{ name: string; amount: number; category: string }>;
}

// ─── Section definitions ───
const SECTION_DEFS = [
  { type: "hero", title: "Executive Summary", icon: "🏢", placeholder: "Click to add a compelling summary of your business..." },
  { type: "overview", title: "Business Overview", icon: "📋", placeholder: "Click to describe your business, its history, and what makes it special..." },
  { type: "operations", title: "Operations", icon: "⚙️", placeholder: "Click to explain how the business runs day-to-day..." },
  { type: "financials", title: "Financial Performance", icon: "📊", placeholder: "Click to highlight key financial metrics, revenue trends, and profitability..." },
  { type: "growth", title: "Growth Opportunities", icon: "🚀", placeholder: "Click to outline realistic growth paths for a new owner..." },
  { type: "assets", title: "Assets & Equipment", icon: "🔧", placeholder: "Click to detail the assets included in the sale..." },
  { type: "staff", title: "Team & Staff", icon: "👥", placeholder: "Click to describe the team structure and key personnel..." },
  { type: "lease", title: "Lease & Property", icon: "🏠", placeholder: "Click to cover location advantages and lease details..." },
  { type: "gallery", title: "Photo Gallery", icon: "📸", placeholder: "Click to add photos of the business..." },
];

function formatCurrency(val: number | null): string {
  if (!val && val !== 0) return "";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(val);
}

// ─── Buyer Gate ───
function BuyerGate({ businessId, businessName, onVerified }: { businessId: string; businessName: string; onVerified: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/im/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied");
      } else {
        onVerified(email);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#2e7847]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#2e7847]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
          <p className="text-gray-500 mt-2">Information Memorandum</p>
          <p className="text-sm text-gray-400 mt-1">Enter your email to access this confidential document</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900 mb-4"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2e7847] text-white py-3 rounded-lg font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Access Document"}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-6">
          Powered by <span className="font-medium">OwnerExit.ai</span>
        </p>
      </div>
    </div>
  );
}

// ─── Completion Bar ───
function CompletionBar({ sections }: { sections: Section[] }) {
  const filled = sections.filter((s) => s.content && s.content.trim().length > 0).length;
  const total = SECTION_DEFS.length;
  const pct = Math.round((filled / total) * 100);

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <span className="text-sm font-medium text-gray-600">IM Completion</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2e7847] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-bold text-[#2e7847]">{pct}%</span>
        <span className="text-xs text-gray-400">({filled}/{total} sections)</span>
      </div>
    </div>
  );
}

// ─── Traffic Light Icon ───
function TrafficLight({ status }: { status: string }) {
  if (status === "green") return <span title="Within industry benchmark">🟢</span>;
  if (status === "amber") return <span title="Slightly off benchmark">🟡</span>;
  return <span title="Significantly different from benchmark">🔴</span>;
}

// ─── Financial Upload & Normalisation Panel (Owner View) ───
function FinancialUploadPanel({
  businessId,
  financialData,
  onDataUpdate,
}: {
  businessId: string;
  financialData: FinancialData | null;
  onDataUpdate: (data: FinancialData) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [localData, setLocalData] = useState<FinancialData | null>(financialData);
  const [normalising, setNormalising] = useState(false);
  const [showAddBackForm, setShowAddBackForm] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [newAddBack, setNewAddBack] = useState({ name: "", amount: "" });
  const [newDeduction, setNewDeduction] = useState({ name: "", amount: "" });

  useEffect(() => {
    setLocalData(financialData);
  }, [financialData]);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("businessId", businessId);
      formData.append("file", file);
      formData.append("year", year);

      const res = await fetch("/api/im/upload-financials", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        setUploadError(result.error || "Upload failed");
        return;
      }

      setLocalData(result.data);
      onDataUpdate(result.data);
    } catch {
      setUploadError("Failed to upload. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleNormalise = async () => {
    if (!localData) return;
    setNormalising(true);

    try {
      const res = await fetch("/api/im/normalise-financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          revenue: localData.revenue,
          otherIncome: localData.otherIncome,
          expenses: localData.expenses,
          reportedProfit: localData.reportedProfit,
          addBacks: localData.addBacks,
          deductions: localData.deductions,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        const updated = {
          ...localData,
          normalisedEBITDA: result.normalisedEBITDA,
          addBacksTotal: result.addBacksTotal,
          deductionsTotal: result.deductionsTotal,
          benchmarkComparison: result.benchmarks,
          appraisalRange: result.appraisalRange,
        };
        setLocalData(updated);
        onDataUpdate(updated);
      }
    } catch {
      // Silent fail — data stays as-is
    } finally {
      setNormalising(false);
    }
  };

  const toggleAddBack = (index: number) => {
    if (!localData) return;
    const updated = { ...localData };
    const ab = updated.addBacks[index];
    if (ab) {
      updated.addBacks = updated.addBacks.filter((_, i) => i !== index);
    }
    setLocalData(updated);
  };

  const updateAddBackAmount = (index: number, amount: number) => {
    if (!localData) return;
    const updated = { ...localData };
    updated.addBacks = updated.addBacks.map((ab, i) =>
      i === index ? { ...ab, amount } : ab
    );
    setLocalData(updated);
  };

  const addNewAddBack = () => {
    if (!localData || !newAddBack.name || !newAddBack.amount) return;
    const updated = {
      ...localData,
      addBacks: [...localData.addBacks, { name: newAddBack.name, amount: parseFloat(newAddBack.amount) || 0 }],
    };
    setLocalData(updated);
    setNewAddBack({ name: "", amount: "" });
    setShowAddBackForm(false);
  };

  const addNewDeduction = () => {
    if (!localData || !newDeduction.name || !newDeduction.amount) return;
    const updated = {
      ...localData,
      deductions: [...localData.deductions, { name: newDeduction.name, amount: parseFloat(newDeduction.amount) || 0 }],
    };
    setLocalData(updated);
    setNewDeduction({ name: "", amount: "" });
    setShowDeductionForm(false);
  };

  const removeDeduction = (index: number) => {
    if (!localData) return;
    const updated = {
      ...localData,
      deductions: localData.deductions.filter((_, i) => i !== index),
    };
    setLocalData(updated);
  };

  const EXPENSE_LABELS: Record<string, string> = {
    costOfGoodsSold: "Cost of Goods Sold",
    wages: "Wages & Salaries",
    rent: "Rent & Occupancy",
    utilities: "Utilities",
    insurance: "Insurance",
    marketing: "Marketing & Advertising",
    depreciation: "Depreciation",
    interest: "Interest",
    otherExpenses: "Other Expenses",
  };

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="font-bold text-gray-900">Upload Financials</h3>
            <p className="text-sm text-gray-500">Upload a P&L statement (PDF or image) to auto-extract financial data</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Financial Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
            >
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y.toString()}>{y}</option>;
              })}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Document</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#2e7847] file:text-white hover:file:bg-[#245f39] file:cursor-pointer"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-6 py-2 bg-[#2e7847] text-white rounded-lg font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <span className="animate-spin">⏳</span> Extracting...
              </>
            ) : (
              <>📤 Upload & Extract</>
            )}
          </button>
        </div>

        {uploadError && (
          <p className="text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>
        )}
      </div>

      {/* Financial Data Display */}
      {localData && (
        <>
          {/* P&L Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">
                📋 Reported Profit & Loss {localData.year ? `(FY${localData.year})` : ""}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-gray-600 font-medium">Item</th>
                    <th className="text-right px-6 py-3 text-gray-600 font-medium">Amount</th>
                    <th className="text-right px-6 py-3 text-gray-600 font-medium">% of Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Revenue */}
                  <tr className="bg-green-50/50 border-b border-gray-100">
                    <td className="px-6 py-3 font-semibold text-[#2e7847]">Revenue</td>
                    <td className="px-6 py-3 text-right font-semibold text-[#2e7847]">{formatCurrency(localData.revenue)}</td>
                    <td className="px-6 py-3 text-right text-gray-400">100%</td>
                  </tr>
                  {localData.otherIncome > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-6 py-3 text-gray-700">Other Income</td>
                      <td className="px-6 py-3 text-right text-gray-700">{formatCurrency(localData.otherIncome)}</td>
                      <td className="px-6 py-3 text-right text-gray-400">
                        {localData.revenue > 0 ? `${((localData.otherIncome / localData.revenue) * 100).toFixed(1)}%` : "-"}
                      </td>
                    </tr>
                  )}

                  {/* Expenses */}
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <td colSpan={3} className="px-6 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                      Expenses
                    </td>
                  </tr>
                  {Object.entries(localData.expenses).map(([key, value], i) => (
                    value > 0 && (
                      <tr key={key} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-6 py-2.5 text-gray-700">{EXPENSE_LABELS[key] || key}</td>
                        <td className="px-6 py-2.5 text-right text-red-600">({formatCurrency(value)})</td>
                        <td className="px-6 py-2.5 text-right text-gray-400">
                          {localData.revenue > 0 ? `${((value / localData.revenue) * 100).toFixed(1)}%` : "-"}
                        </td>
                      </tr>
                    )
                  ))}

                  {/* Total Expenses */}
                  <tr className="border-b border-gray-200 bg-red-50/30">
                    <td className="px-6 py-3 font-semibold text-gray-700">Total Expenses</td>
                    <td className="px-6 py-3 text-right font-semibold text-red-600">({formatCurrency(localData.totalExpenses)})</td>
                    <td className="px-6 py-3 text-right text-gray-400">
                      {localData.revenue > 0 ? `${((localData.totalExpenses / localData.revenue) * 100).toFixed(1)}%` : "-"}
                    </td>
                  </tr>

                  {/* Reported Profit */}
                  <tr className="bg-blue-50/50 border-t-2 border-gray-300">
                    <td className="px-6 py-4 font-bold text-gray-900 text-base">Reported Profit</td>
                    <td className={`px-6 py-4 text-right font-bold text-base ${localData.reportedProfit >= 0 ? "text-[#2e7847]" : "text-red-600"}`}>
                      {formatCurrency(localData.reportedProfit)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">
                      {localData.revenue > 0 ? `${((localData.reportedProfit / localData.revenue) * 100).toFixed(1)}%` : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Normalisation Panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">🔄 Normalisation Adjustments</h3>
              <p className="text-xs text-gray-500 mt-1">
                Add back owner-specific costs and one-off items to calculate the true earning potential
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Add-backs */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-green-600">＋</span> Add-backs
                </h4>
                <div className="space-y-2">
                  {localData.addBacks.map((ab, i) => (
                    <div key={i} className="flex items-center gap-3 bg-green-50/50 rounded-lg px-4 py-2">
                      <span className="flex-1 text-sm text-gray-700">{ab.name}</span>
                      <input
                        type="number"
                        value={ab.amount}
                        onChange={(e) => updateAddBackAmount(i, parseFloat(e.target.value) || 0)}
                        className="w-32 text-right px-3 py-1 rounded border border-gray-200 text-sm"
                      />
                      <button
                        onClick={() => toggleAddBack(i)}
                        className="text-red-400 hover:text-red-600 text-sm"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {showAddBackForm ? (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
                      <input
                        type="text"
                        value={newAddBack.name}
                        onChange={(e) => setNewAddBack({ ...newAddBack, name: e.target.value })}
                        placeholder="Description"
                        className="flex-1 px-3 py-1 rounded border border-gray-200 text-sm"
                      />
                      <input
                        type="number"
                        value={newAddBack.amount}
                        onChange={(e) => setNewAddBack({ ...newAddBack, amount: e.target.value })}
                        placeholder="Amount"
                        className="w-32 text-right px-3 py-1 rounded border border-gray-200 text-sm"
                      />
                      <button onClick={addNewAddBack} className="text-[#2e7847] font-bold text-sm">✓</button>
                      <button onClick={() => setShowAddBackForm(false)} className="text-gray-400 text-sm">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddBackForm(true)}
                      className="text-sm text-[#2e7847] hover:underline flex items-center gap-1"
                    >
                      ＋ Add item
                    </button>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-red-600">－</span> Deductions
                </h4>
                <div className="space-y-2">
                  {localData.deductions.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 bg-red-50/50 rounded-lg px-4 py-2">
                      <span className="flex-1 text-sm text-gray-700">{d.name}</span>
                      <span className="text-sm text-red-600 font-medium">({formatCurrency(d.amount)})</span>
                      <button
                        onClick={() => removeDeduction(i)}
                        className="text-red-400 hover:text-red-600 text-sm"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {showDeductionForm ? (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
                      <input
                        type="text"
                        value={newDeduction.name}
                        onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })}
                        placeholder="e.g. Market rent adjustment"
                        className="flex-1 px-3 py-1 rounded border border-gray-200 text-sm"
                      />
                      <input
                        type="number"
                        value={newDeduction.amount}
                        onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                        placeholder="Amount"
                        className="w-32 text-right px-3 py-1 rounded border border-gray-200 text-sm"
                      />
                      <button onClick={addNewDeduction} className="text-[#2e7847] font-bold text-sm">✓</button>
                      <button onClick={() => setShowDeductionForm(false)} className="text-gray-400 text-sm">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeductionForm(true)}
                      className="text-sm text-red-500 hover:underline flex items-center gap-1"
                    >
                      ＋ Add deduction
                    </button>
                  )}
                </div>
              </div>

              {/* Recalculate button */}
              <button
                onClick={handleNormalise}
                disabled={normalising}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-[#2e7847] to-[#3a9659] text-white rounded-lg font-medium hover:from-[#245f39] hover:to-[#2e7847] transition-all disabled:opacity-50 shadow-sm"
              >
                {normalising ? "⏳ Recalculating..." : "🔄 Recalculate Normalised EBITDA"}
              </button>
            </div>
          </div>

          {/* Normalised EBITDA Hero */}
          <div className="bg-gradient-to-br from-[#2e7847] to-[#1d5a33] rounded-xl p-8 text-white text-center shadow-lg">
            <p className="text-green-200 text-sm font-medium uppercase tracking-wider mb-2">
              Normalised EBITDA {localData.year ? `(FY${localData.year})` : ""}
            </p>
            <p className="text-5xl font-bold mb-4">{formatCurrency(localData.normalisedEBITDA)}</p>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="text-green-200">Reported Profit</p>
                <p className="font-semibold">{formatCurrency(localData.reportedProfit)}</p>
              </div>
              <div>
                <p className="text-green-200">＋ Add-backs</p>
                <p className="font-semibold">{formatCurrency(localData.addBacksTotal)}</p>
              </div>
              {localData.deductionsTotal > 0 && (
                <div>
                  <p className="text-green-200">－ Deductions</p>
                  <p className="font-semibold">({formatCurrency(localData.deductionsTotal)})</p>
                </div>
              )}
            </div>
          </div>

          {/* Benchmark Comparison */}
          {Object.keys(localData.benchmarkComparison).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">📏 Industry Benchmark Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-gray-600 font-medium">Metric</th>
                      <th className="text-right px-6 py-3 text-gray-600 font-medium">Your Business</th>
                      <th className="text-right px-6 py-3 text-gray-600 font-medium">Industry Avg</th>
                      <th className="text-center px-6 py-3 text-gray-600 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(localData.benchmarkComparison).map(([key, bm], i) => {
                      const labels: Record<string, string> = {
                        cogsPercent: "Cost of Goods Sold %",
                        labourPercent: "Labour Costs %",
                        rentPercent: "Rent / Occupancy %",
                        ebitdaMargin: "EBITDA Margin %",
                      };
                      return (
                        <tr key={key} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                          <td className="px-6 py-3 text-gray-700">{labels[key] || key}</td>
                          <td className="px-6 py-3 text-right font-medium">{bm.value}%</td>
                          <td className="px-6 py-3 text-right text-gray-500">{bm.benchmark}%</td>
                          <td className="px-6 py-3 text-center"><TrafficLight status={bm.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Appraisal Range */}
          {localData.appraisalRange && localData.appraisalRange.mid > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                💰 Indicative Appraisal Range
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Based on normalised EBITDA × industry multiples ({localData.appraisalRange.multipleRange})
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Low</p>
                  <p className="text-xl font-bold text-gray-700 mt-1">{formatCurrency(localData.appraisalRange.low)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm ring-2 ring-amber-300">
                  <p className="text-xs text-amber-600 uppercase tracking-wider font-medium">Mid</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(localData.appraisalRange.mid)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">High</p>
                  <p className="text-xl font-bold text-gray-700 mt-1">{formatCurrency(localData.appraisalRange.high)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center italic">
                This is an indicative appraisal only and should not be relied upon as a formal business valuation.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Financial Buyer View (Read-only) ───
function FinancialBuyerView({ data }: { data: FinancialData }) {
  const EXPENSE_LABELS: Record<string, string> = {
    costOfGoodsSold: "Cost of Goods Sold",
    wages: "Wages & Salaries",
    rent: "Rent & Occupancy",
    utilities: "Utilities",
    insurance: "Insurance",
    marketing: "Marketing & Advertising",
    depreciation: "Depreciation",
    interest: "Interest",
    otherExpenses: "Other Expenses",
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Annual Revenue</p>
          <p className="text-2xl font-bold text-[#2e7847] mt-1">{formatCurrency(data.revenue)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Normalised EBITDA</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(data.normalisedEBITDA)}</p>
        </div>
        {data.revenue > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider">EBITDA Margin</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {((data.normalisedEBITDA / data.revenue) * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* P&L Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h4 className="font-bold text-gray-900">
            Profit & Loss Summary {data.year ? `(FY${data.year})` : ""}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-green-50/50 border-b border-gray-100">
                <td className="px-6 py-3 font-semibold text-[#2e7847]">Revenue</td>
                <td className="px-6 py-3 text-right font-semibold text-[#2e7847]">{formatCurrency(data.revenue)}</td>
              </tr>
              {Object.entries(data.expenses).map(([key, value], i) => (
                value > 0 && (
                  <tr key={key} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-6 py-2.5 text-gray-700">{EXPENSE_LABELS[key] || key}</td>
                    <td className="px-6 py-2.5 text-right text-gray-600">({formatCurrency(value)})</td>
                  </tr>
                )
              ))}
              <tr className="bg-blue-50/50 border-t-2 border-gray-300">
                <td className="px-6 py-3 font-bold text-gray-900">Reported Profit</td>
                <td className={`px-6 py-3 text-right font-bold ${data.reportedProfit >= 0 ? "text-[#2e7847]" : "text-red-600"}`}>
                  {formatCurrency(data.reportedProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Normalisation Explanation */}
      <div className="bg-gradient-to-br from-[#2e7847]/5 to-[#2e7847]/10 rounded-xl border border-[#2e7847]/20 p-6">
        <h4 className="font-bold text-gray-900 mb-3">Normalised EBITDA Calculation</h4>
        <p className="text-sm text-gray-600 mb-4">
          Normalised EBITDA adjusts the reported profit by adding back owner-specific costs and non-recurring
          expenses to reflect the true earning potential of the business.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-700">Reported Profit</span>
            <span className="font-medium">{formatCurrency(data.reportedProfit)}</span>
          </div>
          {data.addBacks.map((ab, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-green-700">＋ {ab.name}</span>
              <span className="font-medium text-green-700">{formatCurrency(ab.amount)}</span>
            </div>
          ))}
          {data.deductions.map((d, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-red-600">－ {d.name}</span>
              <span className="font-medium text-red-600">({formatCurrency(d.amount)})</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
            <span className="font-bold text-gray-900 text-base">Normalised EBITDA</span>
            <span className="font-bold text-[#2e7847] text-lg">{formatCurrency(data.normalisedEBITDA)}</span>
          </div>
        </div>
      </div>

      {/* Benchmark Comparison */}
      {Object.keys(data.benchmarkComparison).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h4 className="font-bold text-gray-900">Industry Benchmark Comparison</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-gray-600 font-medium">Metric</th>
                  <th className="text-right px-6 py-3 text-gray-600 font-medium">This Business</th>
                  <th className="text-right px-6 py-3 text-gray-600 font-medium">Industry Average</th>
                  <th className="text-center px-6 py-3 text-gray-600 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.benchmarkComparison).map(([key, bm], i) => {
                  const labels: Record<string, string> = {
                    cogsPercent: "Cost of Goods Sold",
                    labourPercent: "Labour Costs",
                    rentPercent: "Rent / Occupancy",
                    ebitdaMargin: "EBITDA Margin",
                  };
                  return (
                    <tr key={key} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-6 py-3 text-gray-700">{labels[key] || key}</td>
                      <td className="px-6 py-3 text-right font-medium">{bm.value}%</td>
                      <td className="px-6 py-3 text-right text-gray-500">{bm.benchmark}%</td>
                      <td className="px-6 py-3 text-center"><TrafficLight status={bm.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appraisal Range */}
      {data.appraisalRange && data.appraisalRange.mid > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
          <h4 className="font-bold text-gray-900 mb-2">Indicative Appraisal Range</h4>
          <p className="text-xs text-gray-500 mb-4">
            Based on normalised EBITDA × industry multiples ({data.appraisalRange.multipleRange})
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/80 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Low</p>
              <p className="text-lg font-bold text-gray-700 mt-1">{formatCurrency(data.appraisalRange.low)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 ring-2 ring-amber-300">
              <p className="text-xs text-amber-600 uppercase font-medium">Mid</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.appraisalRange.mid)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">High</p>
              <p className="text-lg font-bold text-gray-700 mt-1">{formatCurrency(data.appraisalRange.high)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section Editor ───
function SectionEditor({
  section,
  def,
  isOwner,
  previewMode,
  business,
  onSave,
  onAIWrite,
  onFinancialUpdate,
}: {
  section: Section;
  def: (typeof SECTION_DEFS)[0];
  isOwner: boolean;
  previewMode: boolean;
  business: Business;
  onSave: (sectionType: string, content: string, title: string) => void;
  onAIWrite: (sectionType: string) => void;
  onFinancialUpdate: (data: FinancialData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(section.content || "");
  const [title, setTitle] = useState(section.title || def.title);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setContent(section.content || "");
    setTitle(section.title || def.title);
  }, [section.content, section.title, def.title]);

  const handleSave = useCallback(
    (newContent: string, newTitle: string) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        onSave(section.sectionType, newContent, newTitle);
      }, 1000);
    },
    [onSave, section.sectionType]
  );

  const handleContentChange = (val: string) => {
    setContent(val);
    handleSave(val, title);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    handleSave(content, val);
  };

  const startEditing = () => {
    if (!isOwner || previewMode) return;
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const isEmpty = !content || content.trim().length === 0;
  const showEdit = isOwner && !previewMode;

  // ─── Check if content is structured financial data ───
  let financialData: FinancialData | null = null;
  if (def.type === "financials" && content) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.revenue !== undefined && parsed.normalisedEBITDA !== undefined) {
        financialData = parsed;
      }
    } catch {
      // Not JSON — it's just text content
    }
  }

  // Gallery section is special
  if (def.type === "gallery") {
    return (
      <section className="py-10 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{def.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        {isEmpty && showEdit ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-[#2e7847]/40 transition-colors cursor-pointer">
            <p className="text-gray-400">📸 Photo gallery coming soon — drag and drop images here</p>
          </div>
        ) : (
          <p className="text-gray-400 italic">No photos uploaded yet.</p>
        )}
      </section>
    );
  }

  // ─── Financial section: Owner with structured data ───
  if (def.type === "financials" && showEdit) {
    return (
      <section className="py-10 border-b border-gray-100 last:border-b-0 group relative">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{def.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
            <button
              onClick={() => onAIWrite(section.sectionType)}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
              title="AI Write"
            >
              ✨ AI Write
            </button>
          </div>
        </div>
        <FinancialUploadPanel
          businessId={business.id}
          financialData={financialData}
          onDataUpdate={(data) => {
            onFinancialUpdate(data);
            onSave("financials", JSON.stringify(data), title);
          }}
        />
      </section>
    );
  }

  // ─── Financial section: Buyer view with structured data ───
  if (def.type === "financials" && financialData && !showEdit) {
    return (
      <section className="py-10 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{def.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <FinancialBuyerView data={financialData} />
      </section>
    );
  }

  // Buyer mode or preview mode - read only
  if (!showEdit) {
    if (isEmpty) return null; // Hide empty sections from buyers
    return (
      <section className="py-10 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{def.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`py-10 border-b border-gray-100 last:border-b-0 group relative rounded-lg transition-all ${
        editing ? "ring-2 ring-[#2e7847]/30 bg-[#2e7847]/[0.02]" : "hover:bg-gray-50/50"
      }`}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{def.icon}</span>
        {editing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-[#2e7847]/30 outline-none flex-1"
          />
        ) : (
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        )}
        {/* AI Write + Edit buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          <button
            onClick={() => onAIWrite(section.sectionType)}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
            title="AI Write"
          >
            ✨ AI Write
          </button>
          {!editing && (
            <button
              onClick={startEditing}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              ✏️ Edit
            </button>
          )}
          {editing && (
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 bg-[#2e7847] text-white rounded-lg text-sm font-medium hover:bg-[#245f39] transition-colors"
            >
              ✓ Done
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={def.placeholder}
          rows={8}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-700 leading-relaxed resize-y min-h-[200px]"
        />
      ) : (
        <div onClick={startEditing} className="cursor-pointer min-h-[60px]">
          {isEmpty ? (
            <p className="text-gray-400 italic">{def.placeholder}</p>
          ) : (
            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          )}
        </div>
      )}

      {/* Saving indicator */}
      {editing && (
        <p className="text-xs text-gray-400 mt-2 text-right">Auto-saves as you type</p>
      )}
    </section>
  );
}

// ─── Main Client Component ───
export default function IMClient({ business, initialSections, isOwner }: IMClientProps) {
  const [sections, setSections] = useState<Section[]>(() => {
    // Merge initial sections with defaults
    return SECTION_DEFS.map((def, i) => {
      const existing = initialSections.find((s) => s.sectionType === def.type);
      return existing || {
        sectionType: def.type,
        title: def.title,
        content: null,
        order: i,
        mediaUrls: [],
        isVisible: true,
      };
    });
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  // If not owner and not verified, show gate
  if (!isOwner && !buyerEmail) {
    return <BuyerGate businessId={business.id} businessName={business.name} onVerified={setBuyerEmail} />;
  }

  const handleSave = async (sectionType: string, content: string, title: string) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/im/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          sectionType,
          content,
          title,
          order: SECTION_DEFS.findIndex((d) => d.type === sectionType),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSections((prev) =>
          prev.map((s) =>
            s.sectionType === sectionType
              ? { ...s, id: data.section.id, content, title }
              : s
          )
        );
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  const handleAIWrite = async (sectionType: string) => {
    setAiLoading(sectionType);
    try {
      const res = await fetch("/api/im/ai-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, sectionType }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setSections((prev) =>
          prev.map((s) =>
            s.sectionType === sectionType ? { ...s, content: data.content } : s
          )
        );
        // Auto-save
        const def = SECTION_DEFS.find((d) => d.type === sectionType);
        const section = sections.find((s) => s.sectionType === sectionType);
        handleSave(sectionType, data.content, section?.title || def?.title || sectionType);
      }
    } catch (err) {
      console.error("AI write failed:", err);
    } finally {
      setAiLoading(null);
    }
  };

  const handleFinancialUpdate = (data: FinancialData) => {
    const content = JSON.stringify(data);
    setSections((prev) =>
      prev.map((s) =>
        s.sectionType === "financials" ? { ...s, content } : s
      )
    );
  };

  // Track buyer view on section scroll
  useEffect(() => {
    if (!buyerEmail) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionType = entry.target.getAttribute("data-section");
            if (sectionType) {
              fetch("/api/im/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  businessId: business.id,
                  buyerEmail,
                  sectionType,
                }),
              }).catch(() => {});
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll("[data-section]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [buyerEmail, business.id]);

  const viewingSections = previewMode || !isOwner
    ? sections.filter((s) => s.content && s.content.trim().length > 0)
    : sections;

  return (
    <div className="min-h-screen bg-white im-document">
      {/* Owner toolbar */}
      {isOwner && (
        <CompletionBar sections={sections} />
      )}

      {/* Hero header */}
      <header className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#4eba6f] font-medium text-sm tracking-wider uppercase mb-2">
                Information Memorandum
              </p>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{business.name}</h1>
              <p className="text-gray-300 text-lg">
                {business.location}, {business.state} {business.postcode}
              </p>
              {business.industry && (
                <p className="text-gray-400 mt-1">
                  {business.industry}{business.subIndustry ? ` — ${business.subIndustry}` : ""}
                </p>
              )}
            </div>
            {isOwner && (
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  saveStatus === "saved" ? "bg-green-900/30 text-green-400" :
                  saveStatus === "saving" ? "bg-yellow-900/30 text-yellow-400" :
                  "bg-red-900/30 text-red-400"
                }`}>
                  {saveStatus === "saved" ? "✓ Saved" : saveStatus === "saving" ? "Saving..." : "Error"}
                </span>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    previewMode
                      ? "bg-[#2e7847] text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {previewMode ? "← Back to Editing" : "👁 Preview as Buyer"}
                </button>
              </div>
            )}
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {business.askingPrice && (
              <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Asking Price</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(business.askingPrice)}</p>
              </div>
            )}
            {business.annualRevenue && (
              <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Annual Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(business.annualRevenue)}</p>
              </div>
            )}
            {business.annualProfit && (
              <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Annual Profit</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(business.annualProfit)}</p>
              </div>
            )}
            {business.establishedYear && (
              <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Established</p>
                <p className="text-2xl font-bold text-white mt-1">{business.establishedYear}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AI loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm">
            <div className="text-4xl mb-4 animate-bounce">✨</div>
            <h3 className="text-lg font-bold text-gray-900">AI is writing...</h3>
            <p className="text-gray-500 text-sm mt-2">
              Generating your {SECTION_DEFS.find((d) => d.type === aiLoading)?.title.toLowerCase()} section
            </p>
          </div>
        </div>
      )}

      {/* Sections */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {viewingSections.map((section) => {
          const def = SECTION_DEFS.find((d) => d.type === section.sectionType);
          if (!def) return null;
          return (
            <div key={section.sectionType} data-section={section.sectionType}>
              <SectionEditor
                section={section}
                def={def}
                isOwner={isOwner}
                previewMode={previewMode}
                business={business}
                onSave={handleSave}
                onAIWrite={handleAIWrite}
                onFinancialUpdate={handleFinancialUpdate}
              />
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">
            This Information Memorandum is confidential and prepared for prospective purchasers only.
          </p>
          <p className="text-gray-300 text-xs mt-2">
            Prepared with <a href="https://ownerexit.ai" className="text-[#2e7847] hover:underline">OwnerExit.ai</a>
          </p>
        </div>
      </footer>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .sticky, button, .group-hover\\:opacity-100 {
            display: none !important;
          }
          .im-document {
            font-size: 11pt;
          }
          header {
            background: #1a1a2e !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
