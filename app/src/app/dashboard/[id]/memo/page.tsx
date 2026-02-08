"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AccessCode {
  id: string;
  buyerName: string;
  buyerEmail: string;
  accessCode: string;
  tier: "TIER_1" | "TIER_2";
  isRevoked: boolean;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
}

interface Memo {
  id: string;
  content: string;
  videoUrl: string | null;
  isPublished: boolean;
  accessCodes: AccessCode[];
}

export default function MemoManagementPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [granting, setGranting] = useState(false);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: "", email: "", expiresInDays: "" });
  const [newAccessUrl, setNewAccessUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMemo();
  }, [businessId]);

  async function fetchMemo() {
    try {
      const res = await fetch(`/api/memo?businessId=${businessId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setMemo(data.memo);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function generateMemo() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      await fetchMemo();
    } catch {
      setError("Failed to generate memo");
    } finally {
      setGenerating(false);
    }
  }

  async function grantAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!memo) return;
    setGranting(true);
    setError("");
    try {
      const res = await fetch(`/api/memo/${memo.id}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: newBuyer.name,
          buyerEmail: newBuyer.email,
          expiresInDays: newBuyer.expiresInDays ? parseInt(newBuyer.expiresInDays) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewAccessUrl(data.accessUrl);
      setNewBuyer({ name: "", email: "", expiresInDays: "" });
      await fetchMemo();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to grant access");
    } finally {
      setGranting(false);
    }
  }

  async function revokeAccess(accessId: string) {
    if (!memo || !confirm("Revoke this buyer's access?")) return;
    try {
      await fetch(`/api/memo/${memo.id}/access`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessId }),
      });
      await fetchMemo();
    } catch {
      setError("Failed to revoke access");
    }
  }

  async function upgradeTier(accessId: string) {
    if (!memo) return;
    try {
      const res = await fetch(`/api/memo/${memo.id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessId, tier: "TIER_2" }),
      });
      if (!res.ok) throw new Error("Failed to upgrade");
      await fetchMemo();
    } catch {
      setError("Failed to upgrade tier");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700/50 py-4">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            OwnerExit.ai
          </Link>
          <Link href="/dashboard" className="text-slate-300 hover:text-white">← Back to Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Deal Room</h1>
        <p className="text-slate-400 mb-8">Manage your confidential information memorandum and buyer access.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Generate Memo Section */}
        {!memo ? (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-semibold text-white mb-2">No Info Memo Yet</h2>
            <p className="text-slate-400 mb-6">Generate an AI-powered Information Memorandum for serious buyers.</p>
            <button
              onClick={generateMemo}
              disabled={generating}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {generating ? "Generating..." : "✨ Generate Info Memo"}
            </button>
          </div>
        ) : (
          <>
            {/* Memo Preview */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-white">📋 Info Memo</h2>
                <button
                  onClick={generateMemo}
                  disabled={generating}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  {generating ? "Regenerating..." : "🔄 Regenerate"}
                </button>
              </div>
              <div className="prose prose-invert prose-sm max-w-none max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-slate-300 text-sm">{memo.content.slice(0, 500)}...</pre>
              </div>
            </div>

            {/* Grant Access Section */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">🔑 Buyer Access</h2>
                <button
                  onClick={() => setShowGrantForm(!showGrantForm)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  + Grant Access
                </button>
              </div>

              {showGrantForm && (
                <form onSubmit={grantAccess} className="bg-slate-700/50 rounded-lg p-4 mb-4">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Buyer Name"
                      value={newBuyer.name}
                      onChange={(e) => setNewBuyer({ ...newBuyer, name: e.target.value })}
                      className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Buyer Email"
                      value={newBuyer.email}
                      onChange={(e) => setNewBuyer({ ...newBuyer, email: e.target.value })}
                      className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Expires in days (optional)"
                      value={newBuyer.expiresInDays}
                      onChange={(e) => setNewBuyer({ ...newBuyer, expiresInDays: e.target.value })}
                      className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={granting}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {granting ? "Creating..." : "Create Access Link"}
                  </button>
                </form>
              )}

              {newAccessUrl && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-4">
                  <p className="text-green-400 text-sm mb-2">✅ Access granted! Share this link:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAccessUrl}
                      readOnly
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(newAccessUrl); }}
                      className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Access List */}
              {memo.accessCodes.length === 0 ? (
                <p className="text-slate-400 text-sm">No buyers have been granted access yet.</p>
              ) : (
                <div className="space-y-3">
                  {memo.accessCodes.map((access) => (
                    <div
                      key={access.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        access.isRevoked ? "bg-red-500/10 border border-red-500/30" : "bg-slate-700/50"
                      }`}
                    >
                      <div>
                        <p className="text-white font-medium">{access.buyerName}</p>
                        <p className="text-slate-400 text-sm">{access.buyerEmail}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            access.tier === "TIER_2" ? "bg-purple-500/20 text-purple-400" : "bg-cyan-500/20 text-cyan-400"
                          }`}>
                            {access.tier === "TIER_2" ? "🔓 Full Access" : "📋 Overview"}
                          </span>
                          {access.isRevoked && (
                            <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">Revoked</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">
                          {access.viewCount} views
                          {access.lastViewedAt && (
                            <> • Last: {new Date(access.lastViewedAt).toLocaleDateString()}</>
                          )}
                        </p>
                        {!access.isRevoked && (
                          <div className="flex gap-2 mt-2">
                            {access.tier === "TIER_1" && (
                              <button
                                onClick={() => upgradeTier(access.id)}
                                className="text-xs text-purple-400 hover:text-purple-300"
                              >
                                Upgrade to Tier 2
                              </button>
                            )}
                            <button
                              onClick={() => revokeAccess(access.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
