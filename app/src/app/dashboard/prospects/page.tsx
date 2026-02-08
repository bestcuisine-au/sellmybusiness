"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  source: string;
  ndaStatus: "PENDING" | "SENT" | "SIGNED" | "DECLINED";
  status: string;
  notes: string | null;
  createdAt: string;
  business: { name: string };
  memoAccess: { tier: string; viewCount: number } | null;
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-500/20 text-blue-400",
  CONTACTED: "bg-yellow-500/20 text-yellow-400",
  NDA_SIGNED: "bg-green-500/20 text-green-400",
  QUALIFIED: "bg-purple-500/20 text-purple-400",
  NEGOTIATING: "bg-cyan-500/20 text-cyan-400",
  CLOSED_WON: "bg-emerald-500/20 text-emerald-400",
  CLOSED_LOST: "bg-red-500/20 text-red-400",
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

  async function updateStatus(prospectId: string, status: string) {
    setUpdating(prospectId);
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, status }),
      });
      await fetchProspects();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  async function markNdaSigned(prospectId: string) {
    setUpdating(prospectId);
    try {
      await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, ndaStatus: "SIGNED", status: "NDA_SIGNED" }),
      });
      await fetchProspects();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
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
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            OwnerExit.ai
          </Link>
          <Link href="/dashboard" className="text-slate-300 hover:text-white">← Back to Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Prospect CRM</h1>
            <p className="text-slate-400">Manage inquiries from all your listings</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{prospects.length}</p>
            <p className="text-slate-400 text-sm">Total Prospects</p>
          </div>
        </div>

        {prospects.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-white mb-2">No prospects yet</h2>
            <p className="text-slate-400">When buyers inquire about your listings, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prospects.map((prospect) => (
              <div
                key={prospect.id}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{prospect.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${statusColors[prospect.status]}`}>
                        {statusLabels[prospect.status]}
                      </span>
                      {prospect.ndaStatus === "SIGNED" && (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                          ✓ NDA Signed
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{prospect.email} {prospect.phone && `• ${prospect.phone}`}</p>
                    {prospect.company && <p className="text-slate-500 text-sm">{prospect.company}</p>}
                    <p className="text-slate-500 text-xs mt-1">
                      For: <span className="text-cyan-400">{prospect.business.name}</span>
                      {" • "}Source: {prospect.source}
                      {" • "}{new Date(prospect.createdAt).toLocaleDateString()}
                    </p>
                    {prospect.message && (
                      <p className="text-slate-400 text-sm mt-3 p-3 bg-slate-700/30 rounded">
                        &quot;{prospect.message}&quot;
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    {prospect.memoAccess && (
                      <p className="text-slate-400 text-sm mb-2">
                        {prospect.memoAccess.viewCount} memo views
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      {prospect.ndaStatus !== "SIGNED" && (
                        <button
                          onClick={() => markNdaSigned(prospect.id)}
                          disabled={updating === prospect.id}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded disabled:opacity-50"
                        >
                          Mark NDA Signed
                        </button>
                      )}
                      <select
                        value={prospect.status}
                        onChange={(e) => updateStatus(prospect.id, e.target.value)}
                        disabled={updating === prospect.id}
                        className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                      >
                        <option value="NEW">New Lead</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="NDA_SIGNED">NDA Signed</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="NEGOTIATING">Negotiating</option>
                        <option value="CLOSED_WON">Won!</option>
                        <option value="CLOSED_LOST">Lost</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
