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

    const { businessId, buyerEmail, buyerName } = await req.json();

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if access already exists
    const existing = await prisma.iMAccess.findFirst({
      where: { businessId, buyerEmail: buyerEmail.toLowerCase() },
    });

    if (existing) {
      // Re-grant if previously revoked
      const access = await prisma.iMAccess.update({
        where: { id: existing.id },
        data: { granted: true, revokedAt: null, buyerName: buyerName || existing.buyerName },
      });
      return NextResponse.json({ success: true, access });
    }

    const access = await prisma.iMAccess.create({
      data: {
        businessId,
        buyerEmail: buyerEmail.toLowerCase(),
        buyerName: buyerName || null,
      },
    });

    return NextResponse.json({ success: true, access });
  } catch (error) {
    console.error("IM access grant error:", error);
    return NextResponse.json({ error: "Failed to grant access" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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

    const { accessId } = await req.json();

    const access = await prisma.iMAccess.findUnique({
      where: { id: accessId },
      include: { business: true },
    });

    if (!access || access.business.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.iMAccess.update({
      where: { id: accessId },
      data: { granted: false, revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IM access revoke error:", error);
    return NextResponse.json({ error: "Failed to revoke access" }, { status: 500 });
  }
}

export async function GET(req: Request) {
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
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const accessList = await prisma.iMAccess.findMany({
      where: { businessId },
      orderBy: { grantedAt: "desc" },
    });

    return NextResponse.json({ accessList });
  } catch (error) {
    console.error("IM access list error:", error);
    return NextResponse.json({ error: "Failed to fetch access list" }, { status: 500 });
  }
}
