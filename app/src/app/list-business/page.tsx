"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const industries = [
  "Hospitality - Restaurant/Cafe",
  "Hospitality - Bar/Pub",
  "Hospitality - Takeaway/Fast Food",
  "Retail - Fashion",
  "Retail - Home & Garden",
  "Retail - General",
  "Services - Professional",
  "Services - Trade",
  "Services - Health & Beauty",
  "Automotive",
  "Manufacturing",
  "Wholesale/Distribution",
  "Online/E-commerce",
  "Other",
];

export default function ListBusinessPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    location: "",
    state: "",
    postcode: "",
    askingPrice: "",
    annualRevenue: "",
    annualProfit: "",
    employees: "",
    establishedYear: "",
    description: "",
    reasonForSale: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateAIDescription = async () => {
    if (!formData.name || !formData.industry) {
      setError("Please fill in business name and industry first");
      return;
    }
    
    setAiLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/ai-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.name,
          industry: formData.industry,
          location: formData.location,
          state: formData.state,
          annualRevenue: formData.annualRevenue ? parseInt(formData.annualRevenue) : null,
          annualProfit: formData.annualProfit ? parseInt(formData.annualProfit) : null,
          employees: formData.employees,
          yearsOperating: formData.establishedYear ? new Date().getFullYear() - parseInt(formData.establishedYear) : null,
          reasonForSale: formData.reasonForSale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setError(data.error || "Failed to generate description");
        return;
      }

      setFormData({ ...formData, description: data.description });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setError(data.error || "Failed to create listing");
        return;
      }

      router.push("/dashboard?created=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto border-b border-slate-800">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          OwnerExit.ai
        </Link>
        <Link href="/dashboard" className="text-slate-300 hover:text-white">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">List Your Business</h1>
          <p className="text-slate-400">Step {step} of 3 - {step === 1 ? "Basic Info" : step === 2 ? "Financials" : "Description"}</p>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded ${s <= step ? "bg-purple-500" : "bg-slate-700"}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Business Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                  placeholder="e.g. Joe's Coffee Shop"
                  required
                />
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-2">City/Suburb *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. Brisbane"
                    required
                  />
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
                    <option value="">State</option>
                    <option value="QLD">QLD</option>
                    <option value="NSW">NSW</option>
                    <option value="VIC">VIC</option>
                    <option value="WA">WA</option>
                    <option value="SA">SA</option>
                    <option value="TAS">TAS</option>
                    <option value="NT">NT</option>
                    <option value="ACT">ACT</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Asking Price (AUD)</label>
                <input
                  type="number"
                  name="askingPrice"
                  value={formData.askingPrice}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                  placeholder="e.g. 500000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-2">Annual Revenue</label>
                  <input
                    type="number"
                    name="annualRevenue"
                    value={formData.annualRevenue}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. 800000"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2">Annual Profit (EBITDA)</label>
                  <input
                    type="number"
                    name="annualProfit"
                    value={formData.annualProfit}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. 150000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-2">Employees</label>
                  <input
                    type="number"
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2">Year Established</label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                    placeholder="e.g. 2018"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-300">Business Description</label>
                  <button
                    type="button"
                    onClick={generateAIDescription}
                    disabled={aiLoading}
                    className="flex items-center gap-2 text-sm bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>✨ AI Generate</>
                    )}
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={8}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                  placeholder="Describe your business, what makes it special, growth opportunities..."
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">Reason for Sale</label>
                <textarea
                  name="reasonForSale"
                  value={formData.reasonForSale}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
                  placeholder="Why are you selling? (Retirement, new opportunity, etc.)"
                />
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-cyan-400 text-sm">
                  💡 <strong>Tip:</strong> Use the AI Generate button to create a professional description based on your business details.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="border border-slate-600 text-slate-300 px-6 py-3 rounded-lg hover:bg-slate-800 transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Listing"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
