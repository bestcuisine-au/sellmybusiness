"use client";

import { OwnerVideoSection, BuyerVideoSection } from "./VideoSection";
import { useState, useCallback, useRef, useEffect } from "react";
import MarkdownContent from "./MarkdownContent";
// ──── Digital Presence Types & Panel ────

interface DigitalPresenceData {
  url?: string;
  websiteUrl?: string;
  desktopScreenshot: string | null;
  mobileScreenshot: string | null;
  socialLinks: Array<{ platform: string; url: string; screenshot?: string | null }>;
  capturedAt: string;
  socialProfiles?: Record<string, { name?: string; description?: string; image?: string; followers?: string }>;
}

// ──── Digital Presence Panel (Owner View) ────
function DigitalPresencePanel({
  businessId,
  digitalPresenceData,
  onDataUpdate,
}: {
  businessId: string;
  digitalPresenceData: DigitalPresenceData | null;
  onDataUpdate: (data: DigitalPresenceData) => void;
}) {
  const [url, setUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");

  const handleCapture = async () => {
    if (!url.trim()) {
      setError("Please enter a website URL");
      return;
    }

    setCapturing(true);
    setError("");

    try {
      const res = await fetch("/api/im/digital-presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, url }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Capture failed");
        return;
      }

      onDataUpdate(result.data);
    } catch {
      setError("Failed to capture. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Capture section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📸</span>
          <div>
            <h3 className="font-bold text-gray-900">Capture Digital Presence</h3>
            <p className="text-sm text-gray-500">
              Automatically capture website screenshots and detect social media profiles
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourbusiness.com.au"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900"
            />
          </div>
          <button
            onClick={handleCapture}
            disabled={capturing}
            className="px-6 py-2.5 bg-[#2e7847] text-white rounded-lg font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {capturing ? (
              <>
                <span className="animate-spin">⏳</span> Capturing...
              </>
            ) : (
              <>📸 Capture Digital Presence</>
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>

      {/* Display captured data */}
      {digitalPresenceData && (
        <>
          {/* Website Screenshots */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">🖥️ Website Screenshots</h3>
              <button
                onClick={handleCapture}
                className="text-sm text-[#2e7847] hover:underline flex items-center gap-1"
              >
                🔄 Recapture
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Desktop Screenshot */}
                {digitalPresenceData.desktopScreenshot && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Desktop View</p>
                    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                      <img
                        src={digitalPresenceData.desktopScreenshot.startsWith('data:') ? digitalPresenceData.desktopScreenshot : `data:image/jpeg;base64,${digitalPresenceData.desktopScreenshot}`}
                        alt="Desktop screenshot"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile Screenshot */}
                {digitalPresenceData.mobileScreenshot && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Mobile View</p>
                    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 max-w-[200px]">
                      <img
                        src={digitalPresenceData.mobileScreenshot.startsWith('data:') ? digitalPresenceData.mobileScreenshot : `data:image/jpeg;base64,${digitalPresenceData.mobileScreenshot}`}
                        alt="Mobile screenshot"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">🌐 Social Media Profiles</h3>
            </div>
            <div className="p-6">
              {digitalPresenceData.socialLinks.length === 0 ? (
                <p className="text-gray-500 italic">No social media profiles detected on this website</p>
              ) : (
                <>
                  {/* Social Links as Pills */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {digitalPresenceData.socialLinks.map((link, i) => {
                      const platformColors: Record<string, string> = {
                        facebook: "bg-blue-100 text-blue-700 border-blue-200",
                        instagram: "bg-pink-100 text-pink-700 border-pink-200",
                        twitter: "bg-sky-100 text-sky-700 border-sky-200",
                        linkedin: "bg-indigo-100 text-indigo-700 border-indigo-200",
                        youtube: "bg-red-100 text-red-700 border-red-200",
                        tiktok: "bg-slate-100 text-slate-700 border-slate-200",
                      };
                      const colorClass = platformColors[link.platform.toLowerCase()] || "bg-gray-100 text-gray-700 border-gray-200";

                      return (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2 rounded-full border font-medium text-sm flex items-center gap-2 hover:scale-105 transition-transform ${colorClass}`}
                        >
                          <span className="capitalize">{link.platform}</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      );
                    })}
                  </div>

                  {/* Social Screenshots Grid */}
                              {digitalPresenceData.socialLinks.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {digitalPresenceData.socialLinks.map((link, i) => {
                  const profile = digitalPresenceData.socialProfiles?.[link.platform];
                  const emojis: Record<string, string> = { facebook: '📘', instagram: '📷', linkedin: '💼', youtube: '📺', twitter: '🐦', tiktok: '🎵' };
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#2e7847] hover:shadow-md transition-all bg-white">
                      {profile?.image ? (
                        <img src={profile.image} alt={profile.name || link.platform} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                          {emojis[link.platform] || '🌐'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{profile?.name || link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}</p>
                        {profile?.description && <p className="text-sm text-gray-500 line-clamp-2">{profile.description}</p>}
                      </div>
                      <span className="text-gray-400 text-sm">↗</span>
                    </a>
                  );
                })}
              </div>
            )}
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Captured on {new Date(digitalPresenceData.capturedAt).toLocaleString("en-AU")}
          </p>
        </>
      )}
    </div>
  );
}

// ──── Digital Presence Buyer View ────
function DigitalPresenceBuyerView({ data }: { data: DigitalPresenceData }) {
  return (
    <div className="space-y-8">
      {/* Website Screenshots */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Website</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.desktopScreenshot && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Desktop View</p>
              <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                <img
                  src={data.desktopScreenshot.startsWith('data:') ? data.desktopScreenshot : `data:image/jpeg;base64,${data.desktopScreenshot}`}
                  alt="Desktop screenshot"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {data.mobileScreenshot && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Mobile View</p>
              <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 max-w-[200px]">
                <img
                  src={data.mobileScreenshot.startsWith('data:') ? data.mobileScreenshot : `data:image/jpeg;base64,${data.mobileScreenshot}`}
                  alt="Mobile screenshot"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Media */}
      {data.socialLinks.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Social Media Presence</h4>
          <div className="flex flex-wrap gap-3 mb-6">
            {data.socialLinks.map((link, i) => {
              const platformColors: Record<string, string> = {
                facebook: "bg-blue-100 text-blue-700 border-blue-200",
                instagram: "bg-pink-100 text-pink-700 border-pink-200",
                twitter: "bg-sky-100 text-sky-700 border-sky-200",
                linkedin: "bg-indigo-100 text-indigo-700 border-indigo-200",
                youtube: "bg-red-100 text-red-700 border-red-200",
                tiktok: "bg-slate-100 text-slate-700 border-slate-200",
              };
              const colorClass = platformColors[link.platform.toLowerCase()] || "bg-gray-100 text-gray-700 border-gray-200";

              return (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded-full border font-medium text-sm flex items-center gap-2 hover:scale-105 transition-transform ${colorClass}`}
                >
                  <span className="capitalize">{link.platform}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              );
            })}
          </div>

          {/* Social Screenshots Grid */}
                      {data.socialLinks.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.socialLinks.map((link, i) => {
                  const profile = data.socialProfiles?.[link.platform];
                  const emojis: Record<string, string> = { facebook: '📘', instagram: '📷', linkedin: '💼', youtube: '📺', twitter: '🐦', tiktok: '🎵' };
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#2e7847] hover:shadow-md transition-all bg-white">
                      {profile?.image ? (
                        <img src={profile.image} alt={profile.name || link.platform} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                          {emojis[link.platform] || '🌐'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{profile?.name || link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}</p>
                        {profile?.description && <p className="text-sm text-gray-500 line-clamp-2">{profile.description}</p>}
                      </div>
                      <span className="text-gray-400 text-sm">↗</span>
                    </a>
                  );
                })}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

// ──── ABN Lookup Panel (Owner View) ────
interface ABNDetails {
  abn: string;
  entityName: string;
  entityType: string;
  status: string;
  gstRegistered: boolean;
  gstDate: string | null;
  businessNames: string[];
  state: string;
  postcode: string;
  registrationDate: string;
  lookedUpAt: string;
}

function ABNLookupPanel({
  businessId,
  abnData,
  onDataUpdate,
}: {
  businessId: string;
  abnData: ABNDetails | null;
  onDataUpdate: (data: ABNDetails) => void;
}) {
  const [abn, setAbn] = useState("");
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(!abnData);

  const handleLookup = async () => {
    if (!abn.trim()) {
      setError("Please enter an ABN");
      return;
    }

    // Validate ABN (11 digits)
    const abnDigits = abn.replace(/\s/g, "");
    if (!/^\d{11}$/.test(abnDigits)) {
      setError("ABN must be 11 digits");
      return;
    }

    setLooking(true);
    setError("");

    try {
      const res = await fetch("/api/im/abn-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, abn }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Lookup failed");
        return;
      }

      onDataUpdate(result.data);
      setShowForm(false);
    } catch {
      setError("Failed to lookup ABN. Please try again.");
    } finally {
      setLooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lookup section */}
      {showForm && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔍</span>
            <div>
              <h3 className="font-bold text-gray-900">ABN Lookup</h3>
              <p className="text-sm text-gray-500">
                Automatically retrieve your business details from the Australian Business Register
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Australian Business Number (ABN)
              </label>
              <input
                type="text"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="51 824 753 556"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={looking}
              className="px-6 py-2.5 bg-[#2e7847] text-white rounded-lg font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {looking ? (
                <>
                  <span className="animate-spin">⏳</span> Looking up ABN...
                </>
              ) : (
                <>🔍 Look Up ABN</>
              )}
            </button>
            {abnData && (
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>
      )}

      {/* Display ABN details */}
      {abnData && !showForm && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#2e7847] to-[#3d9a5d] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <span className="text-2xl">🏢</span>
              <div>
                <h3 className="font-bold text-lg">{abnData.entityName}</h3>
                <p className="text-sm text-green-100">ABN: {abnData.abn}</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-white hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                    abnData.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {abnData.status === "Active" ? "🟢" : "🔴"} {abnData.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">GST:</span>
                {abnData.gstRegistered ? (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                    ✅ Registered {abnData.gstDate && `since ${abnData.gstDate}`}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium flex items-center gap-1">
                    ❌ Not registered
                  </span>
                )}
              </div>
            </div>

            {/* Entity Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Entity Type</p>
                <p className="text-sm text-gray-900 font-medium">{abnData.entityType}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Registration Date</p>
                <p className="text-sm text-gray-900 font-medium">{abnData.registrationDate}</p>
              </div>
              {abnData.state && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Location</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {abnData.state} {abnData.postcode}
                  </p>
                </div>
              )}
            </div>

            {/* Trading Names */}
            {abnData.businessNames && abnData.businessNames.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Trading Names</p>
                <div className="flex flex-wrap gap-2">
                  {abnData.businessNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Last updated */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Details retrieved from Australian Business Register on{" "}
                {new Date(abnData.lookedUpAt).toLocaleString("en-AU")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──── ABN Lookup Panel (Buyer View) ────
function ABNBuyerView({ abnData }: { abnData: ABNDetails | null }) {
  if (!abnData) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-[#2e7847] to-[#3d9a5d] px-6 py-4">
        <div className="flex items-center gap-3 text-white">
          <span className="text-2xl">🏢</span>
          <div>
            <h3 className="font-bold text-lg">{abnData.entityName}</h3>
            <p className="text-sm text-green-100">ABN: {abnData.abn}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                abnData.status === "Active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {abnData.status === "Active" ? "🟢" : "🔴"} {abnData.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">GST:</span>
            {abnData.gstRegistered ? (
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                ✅ Registered {abnData.gstDate && `since ${abnData.gstDate}`}
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium flex items-center gap-1">
                ❌ Not registered
              </span>
            )}
          </div>
        </div>

        {/* Entity Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Entity Type</p>
            <p className="text-sm text-gray-900 font-medium">{abnData.entityType}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Registration Date</p>
            <p className="text-sm text-gray-900 font-medium">{abnData.registrationDate}</p>
          </div>
          {abnData.state && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Location</p>
              <p className="text-sm text-gray-900 font-medium">
                {abnData.state} {abnData.postcode}
              </p>
            </div>
          )}
        </div>

        {/* Trading Names */}
        {abnData.businessNames && abnData.businessNames.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Trading Names</p>
            <div className="flex flex-wrap gap-2">
              {abnData.businessNames.map((name, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ──── Industry Overview Panel (Owner View) ────
function IndustryOverviewPanel({
  businessId,
  industry,
  location,
  overviewContent,
  onContentUpdate,
}: {
  businessId: string;
  industry: string | null;
  location: string | null;
  overviewContent: string | null;
  onContentUpdate: (content: string) => void;
}) {
  const [customIndustry, setCustomIndustry] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleGenerate = async () => {
    const finalIndustry = industry || customIndustry;
    const finalLocation = location || customLocation;

    if (!finalIndustry || !finalLocation) {
      setError("Please provide both industry and location");
      setShowForm(true);
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/im/industry-overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          industry: finalIndustry,
          location: finalLocation,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Generation failed");
        return;
      }

      onContentUpdate(result.content);
      setShowForm(false);
    } catch {
      setError("Failed to generate. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const needsInput = !industry || !location;

  return (
    <div className="space-y-6">
      {/* Generate section */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="font-bold text-gray-900">Generate Industry Overview</h3>
            <p className="text-sm text-gray-500">
              AI-powered market analysis for your industry and location
            </p>
          </div>
        </div>

        {showForm || needsInput ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
                <input
                  type="text"
                  value={industry || customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="e.g., Cafe, Restaurant, Retail"
                  disabled={!!industry}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={location || customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g., Sydney, Melbourne CBD"
                  disabled={!!location}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900 disabled:bg-gray-50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2.5 bg-[#2e7847] text-white rounded-lg font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="animate-spin">⏳</span> Generating...
                  </>
                ) : (
                  <>📊 Generate Overview</>
                )}
              </button>
              {!needsInput && (
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-6 py-3 bg-[#2e7847] text-white rounded-lg font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="animate-spin">⏳</span> Generating market analysis...
              </>
            ) : (
              <>📊 Generate Industry Overview</>
            )}
          </button>
        )}

        {error && (
          <p className="text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>

      {/* Display generated content */}
      {overviewContent && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">📊 Market Analysis</h3>
            <button
              onClick={handleGenerate}
              className="text-sm text-[#2e7847] hover:underline flex items-center gap-1"
            >
              🔄 Regenerate
            </button>
          </div>
          <div className="p-6">
            <MarkdownContent content={overviewContent} />
          </div>
        </div>
      )}
    </div>
  );
}


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
  { type: "videos", title: "Videos", icon: "🎥", placeholder: "Add videos to showcase your business..." },
  { type: "digital-presence", title: "Digital Presence", icon: "📸", placeholder: "Capture website and social media presence..." },
  { type: "abn-details", title: "ABN Details", icon: "🔍", placeholder: "Look up business details from ABR..." },
  { type: "industry-overview", title: "Industry Overview", icon: "📊", placeholder: "Generate AI-powered market analysis..." },
];


// ─── Section Guidance (Seller-only coaching notes) ───
const SECTION_GUIDANCE: Record<string, { why: string; include: string; tip: string }> = {
  overview: {
    why: "The overview is the first thing buyers read. A strong overview creates excitement and sets the tone for the entire IM. Weak overviews lose buyers immediately.",
    include: "Your unique story — what makes this business special, key achievements, competitive advantages, and why it's a great opportunity.",
    tip: "Lead with your strongest selling point. If you have impressive revenue growth, loyal customers, or a prime location — say it upfront."
  },
  operations: {
    why: "Buyers need to understand how the business actually runs day-to-day. They're assessing whether they can step in and operate it successfully.",
    include: "Operating hours, key processes, systems used (POS, booking, inventory), supplier relationships, and what a typical day/week looks like.",
    tip: "The easier you make it look to run, the more attractive it is. Document your systems — a well-systemised business commands a premium."
  },
  financials: {
    why: "This is the section buyers scrutinise most. Strong, transparent financials build trust and justify your asking price.",
    include: "Revenue, expenses, profit margins, and any add-backs that normalise the true earning capacity. Upload your P&L for automatic analysis.",
    tip: "Be upfront about add-backs (personal expenses, one-off costs, owner's salary above market rate). Buyers respect transparency — and it increases your normalised profit."
  },
  growth: {
    why: "Buyers aren't just buying today's business — they're buying its potential. Growth opportunities can justify a higher price.",
    include: "Realistic, specific opportunities you've identified but haven't pursued. Why haven't you done them? What investment would they need?",
    tip: "Be specific and realistic. \"Could expand interstate\" is vague. \"A second location in [suburb] could add $200K revenue based on local demand\" is compelling."
  },
  assets: {
    why: "Buyers want to know exactly what's included in the sale — and the condition and value of those assets.",
    include: "Every significant piece of equipment, furniture, vehicle, and fixture. Include approximate age, condition, and estimated replacement value.",
    tip: "A detailed asset list builds buyer confidence. Missing assets create doubt and can derail negotiations late in the process."
  },
  staff: {
    why: "Buyers need to know if the team will stay post-sale, who's critical, and what the wage bill looks like.",
    include: "Number of staff, roles, full-time/part-time/casual split, approximate tenure, and key person dependencies.",
    tip: "If the business can run without you, say so clearly. Owner-dependent businesses are harder to sell and attract lower multiples."
  },
  lease: {
    why: "For many businesses, the lease is the single most critical factor. A poor lease can kill a deal entirely.",
    include: "Lease term, options, annual rent, outgoings, rent review method, assignment clause, and any make-good obligations.",
    tip: "Buyers want long remaining terms (5+ years including options). If your lease is short, consider negotiating an extension before listing — it can add significant value."
  },
  gallery: {
    why: "Photos sell businesses. Listings with professional photos get 3x more enquiries than those without.",
    include: "Exterior, interior, equipment, products/services in action, team (if they consent). Minimum 6-10 photos.",
    tip: "Clean, well-lit photos on a quiet day. No clutter, no customers visible (privacy). First photo should be your hero shot — the one that makes buyers want to learn more."
  },
  "digital-presence": {
    why: "A strong online presence adds value. Buyers see a business with active socials and good reviews as lower risk.",
    include: "Click the Capture button to automatically screenshot your website and detect social media profiles.",
    tip: "If your online presence is weak, consider improving it before listing. Even basic improvements (Google Business profile, active Facebook page) can impact buyer perception."
  },
  "industry-overview": {
    why: "Buyers want market context — is this industry growing? Is the local area booming? This section positions your business within the broader opportunity.",
    include: "Click the Generate button to auto-create a market analysis based on your industry and location.",
    tip: "This auto-generated analysis gives buyers confidence that they're entering a healthy market. Review it for accuracy."
  },
  "abn-details": {
    why: "Verified business registration details build immediate trust with buyers and confirm the business is legitimate and active.",
    include: "Enter your ABN to auto-populate your business registration details from the Australian Business Register.",
    tip: "An active ABN with GST registration shows buyers this is an established, compliant business."
  },
  videos: {
    why: "Video walkthroughs dramatically increase buyer engagement. Listings with video get 2-4x more serious enquiries.",
    include: "A walkthrough of the business, customer testimonials (with permission), or a brief owner introduction explaining the opportunity.",
    tip: "Keep it under 3 minutes. A smartphone video is fine — authenticity beats production quality. Don't show customers' faces or anything commercially sensitive."
  }
};

function formatCurrency(val: number | null): string {
  if (!val && val !== 0) return "";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(val);
}

// ─── Buyer Gate ───
function BuyerGate({ businessId, businessName, onVerified }: { businessId: string; businessName: string; onVerified: (email: string, name: string | null) => void }) {
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
        onVerified(email, data.buyerName || null);
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

  // Videos section is handled separately in the main component
  if (def.type === "videos") {
    return null;
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
        {/* Seller-only guidance notes */}
        {isOwner && !previewMode && SECTION_GUIDANCE[section.sectionType] && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg text-sm">
            <p className="text-gray-700 mb-2"><strong>💡 Why this matters:</strong> {SECTION_GUIDANCE[section.sectionType].why}</p>
            <p className="text-gray-700 mb-2"><strong>📋 What to include:</strong> {SECTION_GUIDANCE[section.sectionType].include}</p>
            <p className="text-gray-700"><strong>⭐ Tip:</strong> {SECTION_GUIDANCE[section.sectionType].tip}</p>
          </div>
        )}



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

  // ─── Digital Presence section: Owner with structured data ───
  if (def.type === "digital-presence" && showEdit) {
    let digitalPresenceData: DigitalPresenceData | null = null;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if ((parsed.url || parsed.websiteUrl) && parsed.capturedAt) {
          // Transform object socialLinks to array format
          if (parsed.socialLinks && !Array.isArray(parsed.socialLinks)) {
            const linksObj = parsed.socialLinks;
            const screenshotsObj = parsed.socialScreenshots || {};
            parsed.socialLinks = Object.entries(linksObj).map(([platform, url]) => ({
              platform,
              url,
              screenshot: screenshotsObj[platform] || null,
            }));
          }
          digitalPresenceData = parsed;
        }
      } catch {
        // Not JSON
      }
    }

    return (
      <section className="py-10 border-b border-gray-100 last:border-b-0 group relative">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{def.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <DigitalPresencePanel
          businessId={business.id}
          digitalPresenceData={digitalPresenceData}
          onDataUpdate={(data) => {
            onSave("digital-presence", JSON.stringify(data), title);
          }}
        />
      </section>
    );
  }

  // ─── Digital Presence section: Buyer view with structured data ───
  if (def.type === "digital-presence" && content && !showEdit) {
    let digitalPresenceData: DigitalPresenceData | null = null;
    try {
      const parsed = JSON.parse(content);
      if ((parsed.url || parsed.websiteUrl) && parsed.capturedAt) {
        // Transform object socialLinks to array format
        if (parsed.socialLinks && !Array.isArray(parsed.socialLinks)) {
          const linksObj = parsed.socialLinks;
          const screenshotsObj = parsed.socialScreenshots || {};
          parsed.socialLinks = Object.entries(linksObj).map(([platform, url]) => ({
            platform,
            url,
            screenshot: screenshotsObj[platform] || null,
          }));
        }
        digitalPresenceData = parsed;
      }
    } catch {
      // Not JSON
    }

    if (digitalPresenceData) {
      return (
        <section className="py-10 border-b border-gray-100 last:border-b-0">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{def.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <DigitalPresenceBuyerView data={digitalPresenceData} />
        </section>
      );
    }
  }


  // ─── ABN Details section ───
  if (def.type === "abn-details") {
    const abnData = content ? (JSON.parse(content) as ABNDetails) : null;
    
    if (showEdit) {
      return (
        <section className="py-10 border-b border-gray-100 last:border-b-0 group relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{def.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <ABNLookupPanel
            businessId={business.id}
            abnData={abnData}
            onDataUpdate={(data) => {
              onSave("abn-details", JSON.stringify(data), title);
            }}
          />
        </section>
      );
    } else {
      // Buyer view
      if (!abnData) return null;
      return (
        <section className="py-10 border-b border-gray-100 last:border-b-0">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{def.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <ABNBuyerView abnData={abnData} />
        </section>
      );
    }
  }

  // ─── Industry Overview section: Owner view ───
  if (def.type === "industry-overview" && showEdit) {
    return (
      <section className="py-10 border-b border-gray-100 last:border-b-0 group relative">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{def.icon}</span>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <IndustryOverviewPanel
          businessId={business.id}
          industry={business.industry}
          location={business.location}
          overviewContent={content}
          onContentUpdate={(newContent) => {
            onSave("industry-overview", newContent, title);
          }}
        />
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
        <MarkdownContent content={content || ""} />
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
            <MarkdownContent content={content || ""} />
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

// Sidebar Navigation Component
function SidebarNav({ sections, activeSection, isOwner }: { sections: { sectionType: string; title: string }[]; activeSection: string; isOwner: boolean }) {
  const scrollTo = (sectionType: string) => {
    const el = document.querySelector(`[data-section="${sectionType}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 w-56 pl-4 pr-2 z-40">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sections</h3>
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.sectionType}>
              <button
                onClick={() => scrollTo(s.sectionType)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                  activeSection === s.sectionType
                    ? "bg-[#2e7847]/10 text-[#2e7847] font-medium"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {s.title}
              </button>
            </li>
          ))}
          {!isOwner && (
            <li>
              <button
                onClick={() => scrollTo("make-offer")}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === "make-offer"
                    ? "bg-[#2e7847]/10 text-[#2e7847]"
                    : "text-[#2e7847] hover:bg-[#2e7847]/5"
                }`}
              >
                Make an Offer →
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}


// ─── Offer Types ───
interface OfferData {
  id: string;
  businessId: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string | null;
  offerPrice: string | number;
  depositAmount: string | number | null;
  settlementDays: number | null;
  conditions: string | null;
  financingDetails: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

// ─── Currency Input Helper ───
function formatNumberInput(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("en-AU").format(parseInt(num));
}

function parseNumberInput(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, "")) || 0;
}

// ─── Buyer Offer Section ───
function BuyerOfferSection({
  businessId,
  buyerEmail,
  buyerName: initialName,
  askingPrice,
}: {
  businessId: string;
  buyerEmail: string;
  buyerName: string;
  askingPrice: number | null;
}) {
  const [formData, setFormData] = useState({
    buyerName: initialName || "",
    buyerPhone: "",
    offerPrice: "",
    depositAmount: "",
    settlementDays: "30",
    conditions: [] as string[],
    otherCondition: "",
    financing: "Cash",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const conditionOptions = [
    "Subject to due diligence (14 days)",
    "Subject to finance approval",
    "Subject to lease assignment",
    "Subject to accountant review",
  ];

  const toggleCondition = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const allConditions = [...formData.conditions];
    if (formData.otherCondition.trim()) {
      allConditions.push(formData.otherCondition.trim());
    }

    try {
      const res = await fetch("/api/im/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          buyerEmail,
          buyerName: formData.buyerName,
          buyerPhone: formData.buyerPhone || null,
          offerPrice: parseNumberInput(formData.offerPrice),
          depositAmount: formData.depositAmount ? parseNumberInput(formData.depositAmount) : null,
          settlementDays: formData.settlementDays === "other" ? null : parseInt(formData.settlementDays),
          conditions: allConditions.length > 0 ? allConditions.join("; ") : null,
          financingDetails: formData.financing,
          message: formData.message || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit offer");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Section divider */}
      <div className="border-t-2 border-[#2e7847]/20 mb-12" />

      {/* Next Steps Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Next Steps</h2>
        <p className="text-gray-500 text-lg">Your guide to making an informed offer</p>
      </div>

      {/* Steps Process */}
      <div className="grid gap-6 mb-12">
        {[
          {
            num: 1,
            icon: "📖",
            title: "Review the Information",
            desc: "Take time to thoroughly review this Information Memorandum. We recommend having your accountant review the financial information presented.",
          },
          {
            num: 2,
            icon: "⚖️",
            title: "Seek Professional Advice",
            desc: "Before making any offer, we strongly recommend you engage a solicitor experienced in business sales to advise you on the transaction.",
          },
          {
            num: 3,
            icon: "📝",
            title: "Submit Your Offer",
            desc: "When you\u2019re ready, submit your offer below with your proposed terms and conditions.",
          },
          {
            num: 4,
            icon: "🤝",
            title: "Negotiation",
            desc: "The seller will review your offer and may accept, counter, or decline. All communication is managed through the platform.",
          },
          {
            num: 5,
            icon: "🔍",
            title: "Due Diligence",
            desc: "Once terms are agreed, you\u2019ll enter a due diligence period to verify the information provided.",
          },
          {
            num: 6,
            icon: "✅",
            title: "Settlement",
            desc: "Your solicitor and the seller\u2019s solicitor will manage the settlement process.",
          },
        ].map((step) => (
          <div key={step.num} className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2e7847]/10 flex items-center justify-center">
              <span className="text-xl">{step.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#2e7847] bg-[#2e7847]/10 px-2 py-0.5 rounded-full">
                  Step {step.num}
                </span>
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer Box */}
      <div className="bg-[#f0faf3] border-l-4 border-[#2e7847] rounded-r-xl p-6 mb-12">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-[#2e7847]">ℹ️</span> Important
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          OwnerExit.ai is a platform that connects business sellers with buyers. We are not business brokers, financial advisers, or legal practitioners. The financial information in this memorandum has been provided by the seller and has not been independently verified. We strongly recommend:
        </p>
        <ul className="space-y-2 text-sm text-gray-700 mb-4">
          <li className="flex items-start gap-2">
            <span className="text-[#2e7847] mt-0.5">•</span>
            <span>Having your <strong>accountant</strong> review all financial data before making an offer</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#2e7847] mt-0.5">•</span>
            <span>Engaging a <strong>solicitor</strong> experienced in business transfers to advise on any agreement</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#2e7847] mt-0.5">•</span>
            <span>Conducting thorough <strong>due diligence</strong> before committing to a purchase</span>
          </li>
        </ul>
        <p className="text-gray-500 text-xs">
          OwnerExit.ai accepts no responsibility for the accuracy of information provided by sellers.
        </p>
      </div>

      {/* Make an Offer Form */}
      {submitted ? (
        <div className="bg-[#f0faf3] border border-[#2e7847]/20 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Offer Submitted</h3>
          <p className="text-gray-600">
            Your offer has been submitted. The seller will review and respond through the platform.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#2e7847] to-[#3a9a5c] px-8 py-6">
            <h3 className="text-2xl font-bold text-white">Make an Offer</h3>
            <p className="text-white/80 text-sm mt-1">
              Submit your offer with proposed terms and conditions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.buyerName}
                  onChange={(e) => setFormData((p) => ({ ...p, buyerName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  readOnly
                  value={buyerEmail}
                  className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.buyerPhone}
                onChange={(e) => setFormData((p) => ({ ...p, buyerPhone: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900"
                placeholder="04XX XXX XXX"
              />
            </div>

            {/* Financial Details */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Offer Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Price (AUD) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input
                      type="text"
                      required
                      value={formData.offerPrice}
                      onChange={(e) => setFormData((p) => ({ ...p, offerPrice: formatNumberInput(e.target.value) }))}
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900 text-lg font-semibold"
                      placeholder="0"
                    />
                  </div>
                  {askingPrice && (
                    <p className="text-xs text-gray-400 mt-1">Asking price: {formatCurrency(askingPrice)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Deposit (AUD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input
                      type="text"
                      value={formData.depositAmount}
                      onChange={(e) => setFormData((p) => ({ ...p, depositAmount: formatNumberInput(e.target.value) }))}
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Settlement Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Period</label>
              <select
                value={formData.settlementDays}
                onChange={(e) => setFormData((p) => ({ ...p, settlementDays: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900 bg-white"
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="120">120 days</option>
                <option value="other">Other (specify in message)</option>
              </select>
            </div>

            {/* Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Conditions</label>
              <div className="space-y-3">
                {conditionOptions.map((condition) => (
                  <label key={condition} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        formData.conditions.includes(condition)
                          ? "bg-[#2e7847] border-[#2e7847]"
                          : "border-gray-300 group-hover:border-[#2e7847]/50"
                      }`}
                      onClick={() => toggleCondition(condition)}
                    >
                      {formData.conditions.includes(condition) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-sm text-gray-700"
                      onClick={() => toggleCondition(condition)}
                    >
                      {condition}
                    </span>
                  </label>
                ))}
                <div className="flex items-start gap-3">
                  <div className="mt-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                        formData.otherCondition.trim()
                          ? "bg-[#2e7847] border-[#2e7847]"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.otherCondition.trim() && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.otherCondition}
                      onChange={(e) => setFormData((p) => ({ ...p, otherCondition: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900 text-sm"
                      placeholder="Other condition (specify)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Financing</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Cash", "Bank finance", "Vendor finance", "Combination"].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${
                      formData.financing === option
                        ? "border-[#2e7847] bg-[#2e7847]/5 text-[#2e7847]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="financing"
                      value={option}
                      checked={formData.financing === option}
                      onChange={(e) => setFormData((p) => ({ ...p, financing: e.target.value }))}
                      className="sr-only"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message to Seller</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900 resize-none"
                placeholder="Tell the seller a little about yourself and why you're interested in this business..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2e7847] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#245f39] transition-colors disabled:opacity-50 shadow-lg shadow-[#2e7847]/20"
            >
              {submitting ? "Submitting..." : "Submit Offer"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By submitting this offer, you acknowledge that it is non-binding and subject to the conditions specified above.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Owner Offers Section ───
function OwnerOffersSection({ businessId }: { businessId: string }) {
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/im/offer?businessId=${businessId}`)
      .then((res) => res.json())
      .then((data) => {
        setOffers(data.offers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [businessId]);

  const updateStatus = async (offerId: string, status: string) => {
    setUpdating(offerId);
    try {
      const res = await fetch("/api/im/offer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, status }),
      });
      if (res.ok) {
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status } : o))
        );
      }
    } catch {
      // Silent fail
    } finally {
      setUpdating(null);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      COUNTERED: "bg-blue-100 text-blue-800",
      WITHDRAWN: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="border-t-2 border-[#2e7847]/20 mb-8" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📨 Offers Received</h2>
        <span className="text-sm text-gray-500">{offers.length} offer{offers.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-3xl mb-3">⏳</div>
          <p className="text-gray-500">Loading offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Offers Yet</h3>
          <p className="text-gray-500">When buyers submit offers, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Offer Header */}
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === offer.id ? null : offer.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#2e7847]/10 flex items-center justify-center text-[#2e7847] font-bold">
                    {offer.buyerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{offer.buyerName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(offer.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-[#2e7847]">
                    {formatCurrency(typeof offer.offerPrice === "string" ? parseFloat(offer.offerPrice) : offer.offerPrice)}
                  </p>
                  {statusBadge(offer.status)}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === offer.id ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === offer.id && (
                <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Email:</span>{" "}
                      <span className="font-medium text-gray-900">{offer.buyerEmail}</span>
                    </div>
                    {offer.buyerPhone && (
                      <div>
                        <span className="text-gray-500">Phone:</span>{" "}
                        <span className="font-medium text-gray-900">{offer.buyerPhone}</span>
                      </div>
                    )}
                    {offer.depositAmount && (
                      <div>
                        <span className="text-gray-500">Proposed Deposit:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {formatCurrency(typeof offer.depositAmount === "string" ? parseFloat(offer.depositAmount) : offer.depositAmount)}
                        </span>
                      </div>
                    )}
                    {offer.settlementDays && (
                      <div>
                        <span className="text-gray-500">Settlement Period:</span>{" "}
                        <span className="font-medium text-gray-900">{offer.settlementDays} days</span>
                      </div>
                    )}
                    {offer.financingDetails && (
                      <div>
                        <span className="text-gray-500">Financing:</span>{" "}
                        <span className="font-medium text-gray-900">{offer.financingDetails}</span>
                      </div>
                    )}
                  </div>

                  {offer.conditions && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-500 block mb-1">Conditions:</span>
                      <p className="text-sm text-gray-900 bg-white rounded-lg px-4 py-3 border border-gray-100">
                        {offer.conditions}
                      </p>
                    </div>
                  )}

                  {offer.message && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-500 block mb-1">Message from Buyer:</span>
                      <p className="text-sm text-gray-900 bg-white rounded-lg px-4 py-3 border border-gray-100 italic">
                        &ldquo;{offer.message}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {offer.status === "PENDING" && (
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => updateStatus(offer.id, "ACCEPTED")}
                        disabled={updating === offer.id}
                        className="px-6 py-2.5 bg-[#2e7847] text-white rounded-lg font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => updateStatus(offer.id, "REJECTED")}
                        disabled={updating === offer.id}
                        className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                      <button
                        onClick={() => updateStatus(offer.id, "COUNTERED")}
                        disabled={updating === offer.id}
                        className="px-6 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        ↩ Counter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


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

  const [activeSection, setActiveSection] = useState("");

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute("data-section");
            if (section) setActiveSection(section);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    document.querySelectorAll("[data-section]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const [previewMode, setPreviewMode] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  // If not owner and not verified, show gate
  if (!isOwner && !buyerEmail) {
    return <BuyerGate businessId={business.id} businessName={business.name} onVerified={(email, name) => { setBuyerEmail(email); setBuyerName(name); }} />;
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

      {/* Sidebar Navigation */}
      <SidebarNav
        sections={SECTION_DEFS.map((d) => ({ sectionType: d.type, title: d.title }))}
        activeSection={activeSection}
        isOwner={isOwner}
      />

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

        {/* Video Section */}
        {(() => {
          const videoSection = sections.find((s) => s.sectionType === "videos");
          let videoData: Array<{ url: string; embedUrl: string; platform: "youtube" | "vimeo" | "mp4"; title: string; addedAt: string }> = [];
          if (videoSection?.content) {
            try {
              const parsed = JSON.parse(videoSection.content);
              videoData = parsed.videos || [];
            } catch {
              // ignore parse errors
            }
          }

          if (isOwner && !previewMode) {
            return (
              <OwnerVideoSection
                businessId={business.id}
                initialVideos={videoData}
              />
            );
          }

          // Buyer or preview mode
          if (videoData.length > 0) {
            return (
              <BuyerVideoSection
                businessId={business.id}
                videos={videoData}
                buyerEmail={buyerEmail || ""}
              />
            );
          }
          return null;
        })()}
      </main>


      {/* Make an Offer / Offers Received Section */}
      {(!isOwner || previewMode) ? (
        <BuyerOfferSection
          businessId={business.id}
          buyerEmail={buyerEmail || ""}
          buyerName={buyerName || ""}
          askingPrice={business.askingPrice}
        />
      ) : isOwner && !previewMode ? (
        <OwnerOffersSection businessId={business.id} />
      ) : null}

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
