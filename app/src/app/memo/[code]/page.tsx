import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import ReactMarkdown from 'react-markdown';

const prisma = new PrismaClient();

async function getMemoByCode(code: string) {
  const access = await prisma.memoAccess.findUnique({
    where: { accessCode: code },
    include: {
      memo: {
        include: {
          business: {
            select: { name: true, industry: true, location: true, state: true },
          },
          documents: true,
        },
      },
    },
  });

  if (!access) return null;
  if (access.isRevoked) return { revoked: true };
  if (access.expiresAt && access.expiresAt < new Date()) return { expired: true };

  // Log the view
  const headersList = await headers();
  await prisma.memoViewLog.create({
    data: {
      accessId: access.id,
      ipAddress: headersList.get('x-forwarded-for') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    },
  });

  await prisma.memoAccess.update({
    where: { id: access.id },
    data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
  });

  return access;
}

const categoryLabels: Record<string, string> = {
  FINANCIALS: '📊 Financial Statements',
  TAX: '🧾 Tax Documents',
  LEASE: '🏠 Lease Agreements',
  LICENSES: '📜 Licenses & Permits',
  CONTRACTS: '📝 Contracts',
  OTHER: '📁 Other Documents',
};

export default async function MemoViewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await getMemoByCode(code);

  if (!access) notFound();

  if ('revoked' in access) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Revoked</h1>
          <p className="text-slate-400">The seller has revoked access to this information.</p>
        </div>
      </main>
    );
  }

  if ('expired' in access) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Expired</h1>
          <p className="text-slate-400">This access link has expired.</p>
        </div>
      </main>
    );
  }

  const { memo, buyerName, tier } = access;
  const business = memo.business;
  const isTier2 = tier === 'TIER_2';

  // Group documents by category
  const docsByCategory = memo.documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof memo.documents>);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">{business.name}</h1>
            <p className="text-sm text-slate-400">{business.industry} • {business.location}, {business.state}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className={`px-2 py-1 rounded text-xs font-medium ${isTier2 ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {isTier2 ? '🔓 Full Access' : '📋 Overview'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Prepared for: {buyerName}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Video Section */}
        {memo.videoUrl && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Business Walkthrough</h2>
            <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden">
              <video controls className="w-full h-full">
                <source src={memo.videoUrl} type="video/mp4" />
              </video>
            </div>
          </div>
        )}

        {/* Memo Content */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-8">
          <article className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown>{memo.content}</ReactMarkdown>
          </article>
        </div>

        {/* Tier 2: Confidential Documents */}
        {isTier2 && Object.keys(docsByCategory).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">📁 Confidential Documents</h2>
            <div className="space-y-6">
              {Object.entries(docsByCategory).map(([category, docs]) => (
                <div key={category} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">{categoryLabels[category] || category}</h3>
                  <div className="space-y-3">
                    {docs.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition"
                      >
                        <span className="text-slate-200">{doc.name}</span>
                        <span className="text-cyan-400 text-sm">Download →</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier 1: Upgrade prompt */}
        {!isTier2 && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-purple-400 font-semibold mb-2">🔒 Additional Documents Available</h3>
            <p className="text-slate-400 text-sm">
              Detailed financials, BAS statements, and confidential documents are available 
              at the seller&apos;s discretion. Contact the seller to request full access.
            </p>
          </div>
        )}

        {/* Confidentiality Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <h3 className="text-amber-400 font-semibold mb-2">⚠️ Confidentiality Notice</h3>
          <p className="text-slate-400 text-sm">
            This document contains confidential information. By accessing, you agree not to 
            disclose or distribute without the seller&apos;s written consent.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">Powered by <span className="text-cyan-400">OwnerExit.ai</span></p>
        </div>
      </div>
    </main>
  );
}
