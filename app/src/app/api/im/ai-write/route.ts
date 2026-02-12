import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sectionPrompts: Record<string, string> = {
  overview: "Write a compelling Business Overview section",
  operations: "Write a detailed Operations section describing how the business runs day-to-day",
  financials: "Write a Financial Performance section highlighting key metrics and trends",
  growth: "Write a Growth Opportunities section identifying realistic expansion paths",
  assets: "Write an Assets & Equipment section detailing what is included in the sale",
  staff: "Write a Team & Staff section describing the organisational structure",
  lease: "Write a Lease & Property section covering location advantages and lease terms",
  hero: "Write a compelling one-paragraph executive summary",
};

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

    const { businessId, sectionType } = await req.json();

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
      include: { memoData: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const memo = business.memoData;
    const promptBase = sectionPrompts[sectionType] || `Write a compelling ${sectionType} section`;

    const businessContext = [
      `Business Name: ${business.name}`,
      `Industry: ${business.industry}${business.subIndustry ? ` (${business.subIndustry})` : ""}`,
      `Location: ${business.location}, ${business.state}`,
      business.annualRevenue ? `Annual Revenue: $${Number(business.annualRevenue).toLocaleString()}` : null,
      business.annualProfit ? `Annual Profit: $${Number(business.annualProfit).toLocaleString()}` : null,
      business.employees ? `Employees: ${business.employees}` : null,
      business.establishedYear ? `Established: ${business.establishedYear}` : null,
      business.askingPrice ? `Asking Price: $${Number(business.askingPrice).toLocaleString()}` : null,
      business.reasonForSale ? `Reason for Sale: ${business.reasonForSale}` : null,
      business.description ? `Description: ${business.description}` : null,
      memo?.operatingHours ? `Operating Hours: ${memo.operatingHours}` : null,
      memo?.ftEmployees != null ? `Full-time staff: ${memo.ftEmployees}` : null,
      memo?.ptEmployees != null ? `Part-time staff: ${memo.ptEmployees}` : null,
      memo?.casualEmployees != null ? `Casual staff: ${memo.casualEmployees}` : null,
      memo?.keyRoles ? `Key Roles: ${memo.keyRoles}` : null,
      memo?.managerInPlace ? `Manager in place: Yes` : null,
      memo?.ownerHoursPerWeek ? `Owner hours/week: ${memo.ownerHoursPerWeek}` : null,
      memo?.ffeMktValue ? `FF&E Value: $${Number(memo.ffeMktValue).toLocaleString()}` : null,
      memo?.stockAtValue ? `Stock Value: $${Number(memo.stockAtValue).toLocaleString()}` : null,
      memo?.leaseExpiry ? `Lease Expiry: ${new Date(memo.leaseExpiry).toLocaleDateString("en-AU")}` : null,
      memo?.rentPerAnnum ? `Rent p.a.: $${Number(memo.rentPerAnnum).toLocaleString()}` : null,
      memo?.growthOpportunities ? `Growth Notes: ${memo.growthOpportunities}` : null,
      memo?.competitiveAdvantages ? `Competitive Advantages: ${memo.competitiveAdvantages}` : null,
      memo?.revenueCurrent ? `Current Revenue: $${Number(memo.revenueCurrent).toLocaleString()}` : null,
      memo?.ebitdaCurrent ? `Current EBITDA: $${Number(memo.ebitdaCurrent).toLocaleString()}` : null,
    ].filter(Boolean).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert business broker writing Information Memorandums for Australian businesses. 
Write in Australian English (use "organisation", "normalise", "colour", "centre", "analyse", "licence").
Never use the word "valuation" — use "appraisal" instead.
Be professional but engaging. Use concrete details where available.
Format with paragraphs. Do NOT use markdown headers — the section title is handled separately.
Write 200-400 words.`,
        },
        {
          role: "user",
          content: `${promptBase} for an Information Memorandum.\n\nBusiness Details:\n${businessContext}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("IM AI write error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
