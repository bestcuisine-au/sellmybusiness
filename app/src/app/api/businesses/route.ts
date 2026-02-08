import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await req.json();

    const business = await prisma.business.create({
      data: {
        userId: user.id,
        name: data.name,
        industry: data.industry,
        subIndustry: data.subIndustry || null,
        location: data.location,
        state: data.state,
        postcode: data.postcode || "",
        askingPrice: data.askingPrice ? parseFloat(data.askingPrice) : null,
        annualRevenue: data.annualRevenue ? parseFloat(data.annualRevenue) : null,
        annualProfit: data.annualProfit ? parseFloat(data.annualProfit) : null,
        establishedYear: data.establishedYear ? parseInt(data.establishedYear) : null,
        employees: data.employees ? parseInt(data.employees) : null,
        description: data.description || null,
        reasonForSale: data.reasonForSale || null,
        status: "DRAFT",
        tier: "STARTER",
      },
    });

    return NextResponse.json({ success: true, businessId: business.id });
  } catch (error) {
    console.error("Create business error:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const businesses = await prisma.business.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("Get businesses error:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
