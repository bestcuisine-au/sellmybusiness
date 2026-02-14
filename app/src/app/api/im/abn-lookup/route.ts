import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

interface ABNDetails {
  abn: string;
  entityName: string;
  entityType: string;
  status: string;
  gstRegistered: boolean;
  gstDate: string | null;
  businessNames: string[];
  state: string;
  postcode: string;
  registrationDate: string;
  lookedUpAt: string;
}

function parseABNHtml(html: string, abn: string): ABNDetails | null {
  try {
    const entityNameMatch = html.match(/<span itemprop="legalName">([^<]+)<\/span>/);
    const entityName = entityNameMatch ? entityNameMatch[1].trim() : "";

    const abnStatusMatch = html.match(/ABN status:<\/th>\s*<td>\s*([^<]+?(?:from|since)[^<]+)/i);
    const statusText = abnStatusMatch ? abnStatusMatch[1].trim() : "";
    const status = statusText.toLowerCase().includes("active") ? "Active" : "Cancelled";
    const registrationDateMatch = statusText.match(/(\d{2})\s+(\w{3})\s+(\d{4})/);
    const registrationDate = registrationDateMatch ? `${registrationDateMatch[1]} ${registrationDateMatch[2]} ${registrationDateMatch[3]}` : "";

    const entityTypeMatch = html.match(/Entity type:<\/th>\s*<td>[\s\S]*?>([^<]+)<\/a>/i);
    const entityType = entityTypeMatch ? entityTypeMatch[1].trim() : "";

    const gstMatch = html.match(/Goods &amp; Services Tax \(GST\):<\/th>\s*<td>\s*([^<]+)/i);
    const gstText = gstMatch ? gstMatch[1].trim() : "";
    const gstRegistered = gstText.toLowerCase().includes("registered");
    const gstDateMatch = gstText.match(/(\d{2})\s+(\w{3})\s+(\d{4})/);
    const gstDate = gstDateMatch ? `${gstDateMatch[1]} ${gstDateMatch[2]} ${gstDateMatch[3]}` : null;

    const businessNames: string[] = [];
    const businessNameMatches = html.matchAll(/Main business name:<\/th>\s*<td>\s*<strong>([^<]+)<\/strong>/gi);
    for (const match of businessNameMatches) {
      businessNames.push(match[1].trim());
    }

    let state = "";
    let postcode = "";
    const locationMatch = html.match(/(?:Main business location|Principal place of business):<\/th>[\s\S]*?([A-Z]{2,3})\s+(\d{4})/i);
    if (locationMatch) {
      state = locationMatch[1];
      postcode = locationMatch[2];
    }

    const abnDigits = abn.replace(/\s/g, "");
    const formattedAbn = `${abnDigits.slice(0, 2)} ${abnDigits.slice(2, 5)} ${abnDigits.slice(5, 8)} ${abnDigits.slice(8, 11)}`;

    if (!entityName) {
      return null;
    }

    return {
      abn: formattedAbn,
      entityName,
      entityType,
      status,
      gstRegistered,
      gstDate,
      businessNames,
      state,
      postcode,
      registrationDate,
      lookedUpAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("ABN HTML parsing error:", error);
    return null;
  }
}

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

    const { businessId, abn } = await req.json();

    if (!businessId || !abn) {
      return NextResponse.json(
        { error: "businessId and abn are required" },
        { status: 400 }
      );
    }

    const abnDigits = abn.replace(/\s/g, "");
    if (!/^\d{11}$/.test(abnDigits)) {
      return NextResponse.json(
        { error: "ABN must be 11 digits" },
        { status: 400 }
      );
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const abnUrl = `https://abr.business.gov.au/ABN/View?abn=${abnDigits}`;
    const response = await fetch(abnUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ABN details from ABR" },
        { status: 500 }
      );
    }

    const html = await response.text();
    const abnDetails = parseABNHtml(html, abnDigits);

    if (!abnDetails) {
      return NextResponse.json(
        { error: "ABN not found or invalid" },
        { status: 404 }
      );
    }

    const existing = await prisma.iMSection.findFirst({
      where: { businessId, sectionType: "abn-details" },
    });

    let section;
    if (existing) {
      section = await prisma.iMSection.update({
        where: { id: existing.id },
        data: {
          content: JSON.stringify(abnDetails),
          updatedAt: new Date(),
        },
      });
    } else {
      section = await prisma.iMSection.create({
        data: {
          businessId,
          sectionType: "abn-details",
          title: "ABN Details",
          content: JSON.stringify(abnDetails),
          order: 1,
          mediaUrls: [],
          isVisible: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: abnDetails,
      sectionId: section.id,
    });
  } catch (error) {
    console.error("ABN lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup ABN" },
      { status: 500 }
    );
  }
}
