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

  // Update view count and last viewed
  await prisma.memoAccess.update({
    where: { id: access.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });

  return access;
}

export default async function MemoViewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await getMemoByCode(code);

  if (!access) {
    notFound();
  }

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
          <p className="text-slate-400">This access link has expired. Contact the seller for renewed access.</p>
        </div>
      </main>
    );
  }

  const { memo, buyerName } = access;
  const business = memo.business;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">{business.name}</h1>
            <p className="text-sm text-slate-400">{business.industry} • {business.location}, {business.state}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Confidential Information Memorandum</p>
            <p className="text-xs text-slate-500">Prepared for: {buyerName}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Video Section (if available) */}
        {memo.videoUrl && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Business Walkthrough</h2>
            <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden">
              <video 
                controls 
                className="w-full h-full"
                poster="/video-poster.jpg"
              >
                <source src={memo.videoUrl} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        )}

        {/* Memo Content */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <article className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown>{memo.content}</ReactMarkdown>
          </article>
        </div>

        {/* Confidentiality Notice */}
        <div className="mt-12 bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <h3 className="text-amber-400 font-semibold mb-2">⚠️ Confidentiality Notice</h3>
          <p className="text-slate-400 text-sm">
            This Information Memorandum contains confidential and proprietary information. 
            By accessing this document, you agree not to disclose, copy, or distribute any 
            information contained herein without the express written consent of the seller.
            All information should be verified independently before making any decisions.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Powered by <span className="text-cyan-400">OwnerExit.ai</span>
          </p>
        </div>
      </div>
    </main>
  );
}
