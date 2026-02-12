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
  if (!val) return "";
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

// ─── Website Import Modal ───
function WebsiteImportModal({
  businessId,
  onSuccess,
  onClose,
}: {
  businessId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ sectionsGenerated: number; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    // Auto-prepend https:// if missing
    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    try {
      const res = await fetch("/api/im/scrape-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, url: finalUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to import from website");
      } else {
        setResult({ sectionsGenerated: data.sectionsGenerated, message: data.message });
        // Refresh sections after a short delay
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🌐</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Import from Website</h3>
          <p className="text-gray-500 text-sm mt-1">
            We&apos;ll scan your business website and pre-populate your IM sections
          </p>
        </div>

        {result ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-lg font-medium text-gray-900">
              We found content from your website!
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {result.message}
            </p>
            <p className="text-[#2e7847] text-sm mt-1 font-medium">
              Review and customise each section.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                ref={inputRef}
                id="website-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="www.yourbusiness.com.au"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900 disabled:bg-gray-50"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex-1 px-4 py-3 bg-[#2e7847] text-white rounded-lg font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scanning...
                  </>
                ) : (
                  "🌐 Import"
                )}
              </button>
            </div>

            {loading && (
              <p className="text-xs text-gray-400 text-center mt-3">
                This may take 15–30 seconds while we scan and generate content...
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Completion Bar ───
function CompletionBar({ sections, onImportWebsite }: { sections: Section[]; onImportWebsite: () => void }) {
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
        <button
          onClick={onImportWebsite}
          className="ml-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Import content from your business website"
        >
          🌐 Import from Website
        </button>
      </div>
    </div>
  );
}

// ─── Section Editor ───
function SectionEditor({
  section,
  def,
  isOwner,
  previewMode,
  onSave,
  onAIWrite,
}: {
  section: Section;
  def: (typeof SECTION_DEFS)[0];
  isOwner: boolean;
  previewMode: boolean;
  onSave: (sectionType: string, content: string, title: string) => void;
  onAIWrite: (sectionType: string) => void;
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importToast, setImportToast] = useState(false);

  // If not owner and not verified, show gate
  if (!isOwner && !buyerEmail) {
    return <BuyerGate businessId={business.id} businessName={business.name} onVerified={setBuyerEmail} />;
  }

  const refreshSections = async () => {
    try {
      const res = await fetch(`/api/im/sections?businessId=${business.id}`);
      const data = await res.json();
      if (res.ok && data.sections) {
        setSections(
          SECTION_DEFS.map((def, i) => {
            const existing = data.sections.find((s: Section) => s.sectionType === def.type);
            return existing || {
              sectionType: def.type,
              title: def.title,
              content: null,
              order: i,
              mediaUrls: [],
              isVisible: true,
            };
          })
        );
      }
    } catch (err) {
      console.error("Failed to refresh sections:", err);
    }
  };

  const handleImportSuccess = () => {
    refreshSections();
    setImportToast(true);
    setTimeout(() => setImportToast(false), 5000);
  };

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
        <CompletionBar sections={sections} onImportWebsite={() => setShowImportModal(true)} />
      )}

      {/* Website Import Modal */}
      {showImportModal && (
        <WebsiteImportModal
          businessId={business.id}
          onSuccess={handleImportSuccess}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Import Success Toast */}
      {importToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-green-200 shadow-lg rounded-xl px-5 py-4 flex items-center gap-3 max-w-sm">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Content imported!</p>
              <p className="text-xs text-gray-500">Review and customise each section.</p>
            </div>
            <button
              onClick={() => setImportToast(false)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
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
                onSave={handleSave}
                onAIWrite={handleAIWrite}
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
