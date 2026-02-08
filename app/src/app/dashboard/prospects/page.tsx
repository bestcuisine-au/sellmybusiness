"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProspectNote {
  id: string;
  content: string;
  createdAt: string;
}

interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  company: string | null;
  message: string | null;
  source: string;
  ndaStatus: "PENDING" | "SENT" | "SIGNED" | "DECLINED";
  status: string;
  createdAt: string;
  business: { name: string };
  memoAccess: { tier: string; viewCount: number } | null;
  notes_list: ProspectNote[];
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  CONTACTED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  NDA_SIGNED: "bg-green-500/20 text-green-400 border-green-500/50",
  QUALIFIED: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  NEGOTIATING: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
  CLOSED_WON: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  CLOSED_LOST: "bg-red-500/20 text-red-400 border-red-500/50",
};

const statusLabels: Record<string, string> = {
  NEW: "New Lead",
  CONTACTED: "Contacted",
  NDA_SIGNED: "NDA Signed",
  QUALIFIED: "Qualified",
  NEGOTIATING: "Negotiating",
  CLOSED_WON: "Won! 🎉",
  CLOSED_LOST: "Lost",
};

export default function ProspectsCRMPage() {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<{ [key: string]: Partial<Prospect> }>({});
  const [newNote, setNewNote] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchProspects();
  }, []);

  async function fetchProspects() {
    try {
      const res = await fetch("/api/prospects");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateProspect(prospectId: string, updates: Record<string, string | undefined>) {
    setUpdating(prospectId);
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, ...updates }),
      });
      await fetchProspects();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  async function addNote(prospectId: string) {
    const content = newNote[prospectId]?.trim();
    if (!content) return;
    
    setUpdating(prospectId);
    try {
      await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, content }),
      });
      setNewNote({ ...newNote, [prospectId]: "" });
      await fetchProspects();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const p = prospects.find(x => x.id === id);
      if (p) {
        setEditingFields({ 
          ...editingFields, 
          [id]: { 
            name: p.name,
            email: p.email,
            mobile: p.mobile || "",
            address: p.address || "",
            company: p.company || "",
          } 
        });
      }
    }
  }

  async function saveDetails(prospectId: string) {
    const fields = editingFields[prospectId] || {};
    await updateProspect(prospectId, {
      name: fields.name,
      email: fields.email,
      mobile: fields.mobile || undefined,
      address: fields.address || undefined,
      company: fields.company || undefined,
    });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-AU", { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto border-b border-slate-800">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          OwnerExit.ai
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className="text-slate-300 hover:text-white">Dashboard</Link>
          <a href="/api/auth/signout" className="text-slate-300 hover:text-white">Sign out</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Buyer Prospects</h1>
          <div className="text-slate-400 text-sm">
            {prospects.length} prospect{prospects.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400 text-center py-12">Loading prospects...</div>
        ) : prospects.length === 0 ? (
          <div className="bg-slate-800/30 rounded-2xl p-12 border border-slate-700 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-white mb-2">No prospects yet</h2>
            <p className="text-slate-400">When buyers inquire about your listings, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prospects.map((prospect) => (
              <div key={prospect.id} className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                {/* Header row */}
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-800/50 transition"
                  onClick={() => toggleExpand(prospect.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{prospect.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[prospect.status] || statusColors.NEW}`}>
                          {statusLabels[prospect.status] || prospect.status}
                        </span>
                        {prospect.ndaStatus === "SIGNED" && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/50">
                            NDA ✓
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{prospect.email}</p>
                      {prospect.mobile && <p className="text-slate-500 text-sm">📱 {prospect.mobile}</p>}
                      <p className="text-slate-500 text-xs mt-1">For: {prospect.business.name}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      {new Date(prospect.createdAt).toLocaleDateString()}
                      <div className="mt-1 text-slate-600">{expandedId === prospect.id ? "▼" : "▶"}</div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === prospect.id && (
                  <div className="border-t border-slate-700 p-4 bg-slate-800/20">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Contact Info - All Editable */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">Contact Information</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-slate-500">Name</label>
                            <input
                              type="text"
                              value={editingFields[prospect.id]?.name || ""}
                              onChange={(e) => setEditingFields({
                                ...editingFields,
                                [prospect.id]: { ...editingFields[prospect.id], name: e.target.value }
                              })}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">Email</label>
                            <input
                              type="email"
                              value={editingFields[prospect.id]?.email || ""}
                              onChange={(e) => setEditingFields({
                                ...editingFields,
                                [prospect.id]: { ...editingFields[prospect.id], email: e.target.value }
                              })}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">Mobile</label>
                            <input
                              type="tel"
                              value={editingFields[prospect.id]?.mobile || ""}
                              onChange={(e) => setEditingFields({
                                ...editingFields,
                                [prospect.id]: { ...editingFields[prospect.id], mobile: e.target.value }
                              })}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                              placeholder="0400 000 000"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">Address</label>
                            <input
                              type="text"
                              value={editingFields[prospect.id]?.address || ""}
                              onChange={(e) => setEditingFields({
                                ...editingFields,
                                [prospect.id]: { ...editingFields[prospect.id], address: e.target.value }
                              })}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                              placeholder="123 Main St, Sydney NSW 2000"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">Company</label>
                            <input
                              type="text"
                              value={editingFields[prospect.id]?.company || ""}
                              onChange={(e) => setEditingFields({
                                ...editingFields,
                                [prospect.id]: { ...editingFields[prospect.id], company: e.target.value }
                              })}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                              placeholder="Company name"
                            />
                          </div>
                          <button
                            onClick={() => saveDetails(prospect.id)}
                            disabled={updating === prospect.id}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded text-sm transition disabled:opacity-50"
                          >
                            {updating === prospect.id ? "Saving..." : "Save Details"}
                          </button>
                        </div>
                      </div>

                      {/* Notes Timeline */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">Activity Notes</h4>
                        
                        {/* Add new note */}
                        <div className="mb-4">
                          <textarea
                            value={newNote[prospect.id] || ""}
                            onChange={(e) => setNewNote({ ...newNote, [prospect.id]: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm h-20 resize-none"
                            placeholder="Add a note..."
                          />
                          <button
                            onClick={() => addNote(prospect.id)}
                            disabled={updating === prospect.id || !newNote[prospect.id]?.trim()}
                            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition disabled:opacity-50"
                          >
                            {updating === prospect.id ? "Adding..." : "Add Note"}
                          </button>
                        </div>

                        {/* Notes list */}
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {prospect.notes_list.length === 0 ? (
                            <p className="text-slate-500 text-sm italic">No notes yet</p>
                          ) : (
                            prospect.notes_list.map((note) => (
                              <div key={note.id} className="bg-slate-800/50 rounded p-3 border-l-2 border-purple-500">
                                <p className="text-slate-300 text-sm whitespace-pre-wrap">{note.content}</p>
                                <p className="text-slate-500 text-xs mt-2">{formatDate(note.createdAt)}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Original Message */}
                    {prospect.message && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Original Inquiry</h4>
                        <p className="text-slate-400 text-sm bg-slate-800/50 rounded p-3">{prospect.message}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-2">
                      <select
                        value={prospect.status}
                        onChange={(e) => updateProspect(prospect.id, { status: e.target.value })}
                        disabled={updating === prospect.id}
                        className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      
                      {prospect.ndaStatus !== "SIGNED" && (
                        <button
                          onClick={() => updateProspect(prospect.id, { ndaStatus: "SIGNED", status: "NDA_SIGNED" })}
                          disabled={updating === prospect.id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition disabled:opacity-50"
                        >
                          Mark NDA Signed
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
