import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
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

    const { businessId, sectionType, title, content, order, mediaUrls, isVisible } = await req.json();

    // Verify ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Upsert the section
    const existing = await prisma.iMSection.findFirst({
      where: { businessId, sectionType },
    });

    let section;
    if (existing) {
      section = await prisma.iMSection.update({
        where: { id: existing.id },
        data: {
          title: title ?? existing.title,
          content: content ?? existing.content,
          order: order ?? existing.order,
          mediaUrls: mediaUrls ?? existing.mediaUrls,
          isVisible: isVisible ?? existing.isVisible,
        },
      });
    } else {
      section = await prisma.iMSection.create({
        data: {
          businessId,
          sectionType,
          title: title || sectionType,
          content: content || null,
          order: order ?? 0,
          mediaUrls: mediaUrls || [],
          isVisible: isVisible ?? true,
        },
      });
    }

    return NextResponse.json({ success: true, section });
  } catch (error) {
    console.error("IM sections error:", error);
    return NextResponse.json({ error: "Failed to save section" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const sections = await prisma.iMSection.findMany({
      where: { businessId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("IM sections GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}
