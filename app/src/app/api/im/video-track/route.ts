import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { businessId, buyerEmail, videoUrl, action, watchTime, totalLength } = await req.json();

    if (!businessId || !buyerEmail || !videoUrl || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.videoView.create({
      data: {
        businessId,
        buyerEmail: buyerEmail.toLowerCase(),
        videoUrl,
        action,
        watchTime: watchTime ? Math.round(watchTime) : null,
        totalLength: totalLength ? Math.round(totalLength) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Video track error:", error);
    return NextResponse.json({ error: "Failed to track video view" }, { status: 500 });
  }
}
