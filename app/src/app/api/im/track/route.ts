import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const { businessId, buyerEmail, sectionType, duration } = await req.json();
    const headersList = await headers();

    await prisma.iMView.create({
      data: {
        businessId,
        buyerEmail: buyerEmail.toLowerCase(),
        sectionType: sectionType || null,
        duration: duration || null,
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
        userAgent: headersList.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IM track error:", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
