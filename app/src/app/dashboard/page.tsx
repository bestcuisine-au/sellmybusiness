"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Business {
  id: string;
  name: string;
  industry: string;
  location: string;
  state: string;
  askingPrice: string | null;
  status: string;
  createdAt: string;
}

function DashboardContent() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const created = searchParams.get("created");

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const res = await fetch("/api/businesses");
        if (res.ok) {
          const data = await res.json();
          setBusinesses(data.businesses || []);
        }
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBusinesses();
  }, []);

  const formatPrice = (price: string | null) => {
    if (!price) return "Price TBD";
    return "$" + parseInt(price).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      ACTIVE: "bg-green-500/20 text-green-400 border-green-500/50",
      SOLD: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      EXPIRED: "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return styles[status] || styles.DRAFT;
  };

  return (
    <>
      {created && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-6">
          ✅ Listing created successfully! It&apos;s currently a draft - edit and publish when ready.
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-center py-12">Loading your listings...</div>
      ) : businesses.length === 0 ? (
        <div className="bg-slate-800/30 rounded-2xl p-12 border border-slate-700 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-white mb-2">No listings yet</h2>
          <p className="text-slate-400 mb-6">
            Ready to sell? Create your first business listing and reach thousands of buyers.
          </p>
          <Link
            href="/list-business"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((biz) => (
            <div key={biz.id} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{biz.name}</h3>
                  <p className="text-slate-400">{biz.industry}</p>
                  <p className="text-slate-500 text-sm">{biz.location}, {biz.state}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{formatPrice(biz.askingPrice)}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs border ${getStatusBadge(biz.status)}`}>
                    {biz.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
                <Link href={`/listing/${biz.id}`} className="text-cyan-400 hover:text-cyan-300 text-sm">
                  View Listing
                </Link>
                <Link href={`/listing/${biz.id}/edit`} className="text-purple-400 hover:text-purple-300 text-sm">
                  Edit
                </Link>
                {biz.status === "DRAFT" && (
                  <button className="text-green-400 hover:text-green-300 text-sm">
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto border-b border-slate-800">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          OwnerExit.ai
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/api/auth/signout" className="text-slate-300 hover:text-white">
            Sign out
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Your Listings</h1>
          <Link
            href="/list-business"
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + List Your Business
          </Link>
        </div>

        <Suspense fallback={<div className="text-slate-400 text-center py-12">Loading...</div>}>
          <DashboardContent />
        </Suspense>
      </div>
    </main>
  );
}
