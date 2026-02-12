import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      buyerEmail,
      buyerName,
      buyerPhone,
      offerPrice,
      depositAmount,
      settlementDays,
      conditions,
      financingDetails,
      message,
    } = body;

    if (!businessId || !buyerEmail || !buyerName || !offerPrice) {
      return NextResponse.json(
        { error: "Business ID, buyer name, email, and offer price are required" },
        { status: 400 }
      );
    }

    // Verify buyer has IM access
    const access = await prisma.iMAccess.findFirst({
      where: {
        businessId,
        buyerEmail: buyerEmail.toLowerCase(),
        granted: true,
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "You do not have access to submit an offer for this business" },
        { status: 403 }
      );
    }

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        businessId,
        buyerEmail: buyerEmail.toLowerCase(),
        buyerName,
        buyerPhone: buyerPhone || null,
        offerPrice: parseFloat(offerPrice),
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        settlementDays: settlementDays ? parseInt(settlementDays) : null,
        conditions: conditions || null,
        financingDetails: financingDetails || null,
        message: message || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, offerId: offer.id });
  } catch (error) {
    console.error("Offer submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit offer" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID required" },
        { status: 400 }
      );
    }

    const offers = await prisma.offer.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Offer fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { offerId, status } = await req.json();

    if (!offerId || !status) {
      return NextResponse.json(
        { error: "Offer ID and status required" },
        { status: 400 }
      );
    }

    if (!["ACCEPTED", "REJECTED", "COUNTERED", "WITHDRAWN"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });

    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error("Offer update error:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}
