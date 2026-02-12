import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { businessId } = await params;
    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const videoViews = await prisma.videoView.findMany({
      where: { businessId },
      orderBy: { timestamp: "desc" },
    });

    // Group by video URL
    const byVideo: Record<string, {
      totalViews: number;
      uniqueViewers: number;
      totalWatchTime: number;
      viewers: Set<string>;
      plays: number;
      completions: number;
    }> = {};

    for (const view of videoViews) {
      if (!byVideo[view.videoUrl]) {
        byVideo[view.videoUrl] = {
          totalViews: 0,
          uniqueViewers: 0,
          totalWatchTime: 0,
          viewers: new Set(),
          plays: 0,
          completions: 0,
        };
      }
      const stats = byVideo[view.videoUrl];
      stats.totalViews++;
      stats.viewers.add(view.buyerEmail);
      if (view.action === "play") stats.plays++;
      if (view.action === "ended") stats.completions++;
      if (view.watchTime) stats.totalWatchTime += view.watchTime;
    }

    // Build response
    const videoStats = Object.entries(byVideo).map(([url, stats]) => ({
      videoUrl: url,
      totalViews: stats.totalViews,
      uniqueViewers: stats.viewers.size,
      plays: stats.plays,
      completions: stats.completions,
      averageWatchTime: stats.plays > 0 ? Math.round(stats.totalWatchTime / stats.plays) : 0,
    }));

    // Buyer breakdown
    const buyerMap: Record<string, { videos: Record<string, { plays: number; watchTime: number; completed: boolean }> }> = {};
    for (const view of videoViews) {
      if (!buyerMap[view.buyerEmail]) {
        buyerMap[view.buyerEmail] = { videos: {} };
      }
      if (!buyerMap[view.buyerEmail].videos[view.videoUrl]) {
        buyerMap[view.buyerEmail].videos[view.videoUrl] = { plays: 0, watchTime: 0, completed: false };
      }
      const bv = buyerMap[view.buyerEmail].videos[view.videoUrl];
      if (view.action === "play") bv.plays++;
      if (view.action === "ended") bv.completed = true;
      if (view.watchTime) bv.watchTime += view.watchTime;
    }

    const buyerBreakdown = Object.entries(buyerMap).map(([email, data]) => ({
      buyerEmail: email,
      videos: Object.entries(data.videos).map(([url, stats]) => ({
        videoUrl: url,
        ...stats,
      })),
    }));

    return NextResponse.json({
      videoStats,
      buyerBreakdown,
      totalEvents: videoViews.length,
    });
  } catch (error) {
    console.error("Video stats error:", error);
    return NextResponse.json({ error: "Failed to fetch video stats" }, { status: 500 });
  }
}
