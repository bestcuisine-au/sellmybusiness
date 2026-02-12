import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { businessId: string } }) {
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

    const { searchParams } = new URL(req.url);
    const { businessId } = params;

    const id = businessId;

    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const [views, accessList, totalViews] = await Promise.all([
      prisma.iMView.findMany({
        where: { businessId },
        orderBy: { viewedAt: "desc" },
        take: 50,
      }),
      prisma.iMAccess.findMany({
        where: { businessId },
        orderBy: { grantedAt: "desc" },
      }),
      prisma.iMView.count({ where: { businessId } }),
    ]);

    // Unique viewers
    const uniqueViewers = new Set(views.map((v) => v.buyerEmail)).size;

    // Views by section
    const sectionViews = views.reduce((acc, v) => {
      const key = v.sectionType || "page";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalViews,
      uniqueViewers,
      sectionViews,
      recentViews: views.slice(0, 20),
      accessList,
    });
  } catch (error) {
    console.error("IM stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
