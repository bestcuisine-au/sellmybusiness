"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ProspectNote {
  id: string;
  content: string;
  createdAt: string;
}

interface Prospect {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  address: string | null;
  company: string | null;
  notes_list: ProspectNote[];
}

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
  prospect: Prospect | null;
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
  const [newBuyer, setNewBuyer] = useState({ name: "", email: "", expiresInDays: "", mobile: "", company: "" });
  const [newAccessUrl, setNewAccessUrl] = useState("");
  const [error, setError] = useState("");
  const [expandedBuyerId, setExpandedBuyerId] = useState<string | null>(null);
  const [editingBuyer, setEditingBuyer] = useState<{ [key: string]: Partial<Prospect> }>({});
  const [newNotes, setNewNotes] = useState<{ [key: string]: string }>({});
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchMemo(); }, [businessId]);

  async function fetchMemo() {
    try {
      const res = await fetch(`/api/memo?businessId=${businessId}`);
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setMemo(data.memo);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function generateMemo() {
    setGenerating(true); setError("");
    try {
      const res = await fetch("/api/memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      await fetchMemo();
    } catch { setError("Failed to generate memo"); }
    finally { setGenerating(false); }
  }

  async function grantAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!memo) return;
    setGranting(true); setError("");
    try {
      const res = await fetch(`/api/memo/${memo.id}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: newBuyer.name,
          buyerEmail: newBuyer.email,
          mobile: newBuyer.mobile || undefined,
          company: newBuyer.company || undefined,
          expiresInDays: newBuyer.expiresInDays ? parseInt(newBuyer.expiresInDays) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewAccessUrl(data.accessUrl);
      setNewBuyer({ name: "", email: "", expiresInDays: "", mobile: "", company: "" });
      await fetchMemo();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to grant access"); }
    finally { setGranting(false); }
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
    } catch { setError("Failed to revoke access"); }
  }

  async function upgradeTier(accessId: string) {
    if (!memo) return;
    try {
      await fetch(`/api/memo/${memo.id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessId, tier: "TIER_2" }),
      });
      await fetchMemo();
    } catch { setError("Failed to upgrade tier"); }
  }

  function toggleBuyerExpand(accessId: string, access: AccessCode) {
    if (expandedBuyerId === accessId) {
      setExpandedBuyerId(null);
    } else {
      setExpandedBuyerId(accessId);
      setEditingBuyer({
        ...editingBuyer,
        [accessId]: {
          name: access.buyerName,
          email: access.buyerEmail,
          mobile: access.prospect?.mobile || "",
          address: access.prospect?.address || "",
          company: access.prospect?.company || "",
        }
      });
    }
  }

  async function saveBuyerDetails(accessId: string) {
    if (!memo) return;
    setUpdating(accessId);
    const fields = editingBuyer[accessId] || {};
    try {
      await fetch(`/api/memo/${memo.id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessId,
          buyerName: fields.name,
          buyerEmail: fields.email,
          mobile: fields.mobile,
          address: fields.address,
          company: fields.company,
        }),
      });
      await fetchMemo();
    } catch { setError("Failed to save"); }
    finally { setUpdating(null); }
  }

  async function addNote(accessId: string) {
    if (!memo || !newNotes[accessId]?.trim()) return;
    setUpdating(accessId);
    try {
      await fetch(`/api/memo/${memo.id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessId, noteContent: newNotes[accessId] }),
      });
      setNewNotes({ ...newNotes, [accessId]: "" });
      await fetchMemo();
    } catch { setError("Failed to add note"); }
    finally { setUpdating(null); }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (loading) return <main className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></main>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700/50 py-4">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">OwnerExit.ai</Link>
          <Link href="/dashboard" className="text-slate-300 hover:text-white">← Dashboard</Link><Link href="/dashboard/prospects" className="text-slate-300 hover:text-white ml-4">👥 CRM</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">📁 Deal Room</h1>
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg mb-4">{error}</div>}

        {!memo ? (
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 text-center">
            <p className="text-slate-400 mb-4">Generate an AI Information Memo to share with buyers</p>
            <button onClick={generateMemo} disabled={generating} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg disabled:opacity-50">
              {generating ? "Generating..." : "Generate Info Memo"}
            </button>
          </div>
        ) : (
          <>
            {/* Memo Preview */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-white">📋 Info Memo</h2>
                <button onClick={generateMemo} disabled={generating} className="text-sm text-cyan-400 hover:text-cyan-300">{generating ? "Regenerating..." : "🔄 Regenerate"}</button>
              </div>
              <pre className="whitespace-pre-wrap text-slate-300 text-sm max-h-48 overflow-y-auto">{memo.content.slice(0, 600)}...</pre>
            </div>

            {/* Grant Access */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">🔑 Buyer Access</h2>
                <button onClick={() => setShowGrantForm(!showGrantForm)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">+ Grant Access</button>
              </div>

              {showGrantForm && (
                <form onSubmit={grantAccess} className="bg-slate-700/50 rounded-lg p-4 mb-4">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder="Buyer Name *" value={newBuyer.name} onChange={(e) => setNewBuyer({ ...newBuyer, name: e.target.value })} className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white" required />
                    <input type="email" placeholder="Email *" value={newBuyer.email} onChange={(e) => setNewBuyer({ ...newBuyer, email: e.target.value })} className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white" required />
                    <input type="tel" placeholder="Mobile (optional)" value={newBuyer.mobile} onChange={(e) => setNewBuyer({ ...newBuyer, mobile: e.target.value })} className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white" />
                    <input type="text" placeholder="Company (optional)" value={newBuyer.company} onChange={(e) => setNewBuyer({ ...newBuyer, company: e.target.value })} className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white" />
                  </div>
                  <button type="submit" disabled={granting} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">{granting ? "Creating..." : "Create Access Link"}</button>
                </form>
              )}

              {newAccessUrl && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-4">
                  <p className="text-green-400 text-sm mb-2">✅ Access granted! Share this link:</p>
                  <div className="flex gap-2">
                    <input type="text" value={newAccessUrl} readOnly className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" />
                    <button onClick={() => navigator.clipboard.writeText(newAccessUrl)} className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded text-sm">Copy</button>
                  </div>
                </div>
              )}

              {/* Buyer List with Edit & Notes */}
              {memo.accessCodes.length === 0 ? (
                <p className="text-slate-400 text-sm">No buyers have been granted access yet.</p>
              ) : (
                <div className="space-y-3">
                  {memo.accessCodes.map((access) => (
                    <div key={access.id} className={`rounded-lg overflow-hidden ${access.isRevoked ? "bg-red-500/10 border border-red-500/30" : "bg-slate-700/50"}`}>
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleBuyerExpand(access.id, access)}>
                        <div>
                          <p className="text-white font-medium">{access.buyerName}</p>
                          <p className="text-slate-400 text-sm">{access.buyerEmail}</p>
                          <div className="flex gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${access.tier === "TIER_2" ? "bg-purple-500/20 text-purple-400" : "bg-cyan-500/20 text-cyan-400"}`}>
                              {access.tier === "TIER_2" ? "🔓 Full" : "📋 Overview"}
                            </span>
                            {access.isRevoked && <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">Revoked</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">{access.viewCount} views</p>
                          <div className="text-slate-600 text-xs mt-1">{expandedBuyerId === access.id ? "▼" : "▶"}</div>
                        </div>
                      </div>

                      {/* Expanded Edit & Notes */}
                      {expandedBuyerId === access.id && !access.isRevoked && (
                        <div className="border-t border-slate-600 p-4 bg-slate-800/30">
                          {/* Edit Details - Full Width */}
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">📝 Buyer Details</h4>
                            <div className="grid md:grid-cols-3 gap-3">
                              <input type="text" placeholder="Name" value={editingBuyer[access.id]?.name || ""} onChange={(e) => setEditingBuyer({ ...editingBuyer, [access.id]: { ...editingBuyer[access.id], name: e.target.value }})} className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" />
                              <input type="email" placeholder="Email" value={editingBuyer[access.id]?.email || ""} onChange={(e) => setEditingBuyer({ ...editingBuyer, [access.id]: { ...editingBuyer[access.id], email: e.target.value }})} className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" />
                              <input type="tel" placeholder="Mobile" value={editingBuyer[access.id]?.mobile || ""} onChange={(e) => setEditingBuyer({ ...editingBuyer, [access.id]: { ...editingBuyer[access.id], mobile: e.target.value }})} className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" />
                              <input type="text" placeholder="Address" value={editingBuyer[access.id]?.address || ""} onChange={(e) => setEditingBuyer({ ...editingBuyer, [access.id]: { ...editingBuyer[access.id], address: e.target.value }})} className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" />
                              <input type="text" placeholder="Company" value={editingBuyer[access.id]?.company || ""} onChange={(e) => setEditingBuyer({ ...editingBuyer, [access.id]: { ...editingBuyer[access.id], company: e.target.value }})} className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm" />
                              <button onClick={() => saveBuyerDetails(access.id)} disabled={updating === access.id} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50">{updating === access.id ? "Saving..." : "Save Details"}</button>
                            </div>
                          </div>

                          {/* Notes Section - Full Width, Prominent */}
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <h4 className="text-sm font-semibold text-white mb-3">📋 Activity Notes</h4>
                            <div className="flex gap-3 mb-4">
                              <textarea placeholder="Add a note about this buyer..." value={newNotes[access.id] || ""} onChange={(e) => setNewNotes({ ...newNotes, [access.id]: e.target.value })} className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm h-16 resize-none" />
                              <button onClick={() => addNote(access.id)} disabled={updating === access.id || !newNotes[access.id]?.trim()} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50 h-16">{updating === access.id ? "..." : "+ Add"}</button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {(!access.prospect?.notes_list || access.prospect.notes_list.length === 0) && <p className="text-slate-500 text-sm italic text-center py-4">No notes yet — add your first note above</p>}
                              {access.prospect?.notes_list?.map((note) => (
                                <div key={note.id} className="bg-slate-700/50 rounded p-3 border-l-4 border-purple-500">
                                  <p className="text-slate-200 text-sm whitespace-pre-wrap">{note.content}</p>
                                  <p className="text-slate-500 text-xs mt-2">{formatDate(note.createdAt)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-600 flex gap-3">
                            {access.tier === "TIER_1" && <button onClick={() => upgradeTier(access.id)} className="text-sm text-purple-400 hover:text-purple-300 border border-purple-500/50 px-3 py-1 rounded">⬆️ Upgrade to Full Access</button>}
                            <button onClick={() => revokeAccess(access.id)} className="text-sm text-red-400 hover:text-red-300 border border-red-500/50 px-3 py-1 rounded">🚫 Revoke Access</button>
                          </div>
                        </div>
                      )}
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
