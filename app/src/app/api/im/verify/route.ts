import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const { businessId, email } = await req.json();

    if (!businessId || !email) {
      return NextResponse.json({ error: "Business ID and email required" }, { status: 400 });
    }

    const access = await prisma.iMAccess.findFirst({
      where: {
        businessId,
        buyerEmail: email.toLowerCase(),
        granted: true,
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Access not granted. Please contact the seller." }, { status: 403 });
    }

    // Update last viewed
    const headersList = await headers();
    await prisma.iMAccess.update({
      where: { id: access.id },
      data: {
        lastViewed: new Date(),
        viewCount: { increment: 1 },
      },
    });

    // Log page view
    await prisma.iMView.create({
      data: {
        businessId,
        buyerEmail: email.toLowerCase(),
        buyerName: access.buyerName,
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
        userAgent: headersList.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true, buyerName: access.buyerName });
  } catch (error) {
    console.error("IM verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
