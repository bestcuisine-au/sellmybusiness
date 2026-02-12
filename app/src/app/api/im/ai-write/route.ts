import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sectionPrompts: Record<string, string> = {
  overview: `Write a Business Overview section. Structure:
- Opening paragraph (2-3 sentences, compelling summary)
- **Key Highlights** as bullet points (5-8 items: established year, location, revenue, profit, employees, unique selling points)
- Brief closing paragraph about the opportunity`,

  operations: `Write an Operations section. Structure:
- Brief intro paragraph about how the business runs
- **Operating Model** as bullet points (hours, days, seasonal patterns)
- **Key Systems & Processes** as bullet points
- **Supplier Relationships** as bullet points if relevant`,

  financials: `Write a Financial Performance section. Structure:
- Opening statement about financial health
- **Key Financial Metrics** as a markdown table:
  | Metric | Value |
  |--------|-------|
  | Annual Revenue | $X |
  | Gross Profit | $X |
  | EBITDA | $X |
  | Net Profit | $X |
- **Revenue Trends** as bullet points (growth, stability, seasonality)
- Brief note that detailed P&L is available on request`,

  growth: `Write a Growth Opportunities section. Structure:
- Brief intro paragraph
- **Immediate Opportunities** (6-12 months) as bullet points with estimated impact
- **Medium-Term Opportunities** (1-3 years) as bullet points
- Brief closing about the growth runway`,

  assets: `Write an Assets & Equipment section. Structure:
- Brief intro about what's included in the sale
- **Plant & Equipment** as a markdown table:
  | Item | Description | Est. Value |
  |------|-------------|-----------|
  | ... | ... | $X |
- **Fixtures & Fittings** as bullet points
- **Intellectual Property** as bullet points (if relevant: brand, website, social media, recipes, processes)
- **Stock** — brief note about stock included at value`,

  staff: `Write a Team & Staff section. Structure:
- Brief intro about the team
- **Organisation Structure** as a markdown table:
  | Role | Type | Responsibilities |
  |------|------|-----------------|
  | Owner/Manager | FT | Overall management, key relationships |
  | ... | FT/PT/Casual | ... |
- **Key Personnel** as bullet points (any critical staff, their tenure, replaceability)
- Brief note about transition/training period offered`,

  lease: `Write a Lease & Property section. Structure:
- Brief intro about the premises
- **Lease Summary** as a markdown table:
  | Detail | Value |
  |--------|-------|
  | Location | ... |
  | Lease Term | X years |
  | Remaining | X years |
  | Options | X x X years |
  | Annual Rent | $X |
  | Outgoings | $X |
  | Reviews | Annual CPI / Market |
- **Premises Description** as bullet points (size, features, condition, parking)
- Brief note about landlord relationship`,

  gallery: `Write a brief Photo Gallery introduction. Just 1-2 sentences inviting the reader to browse the images of the business premises, team, and operations.`,

  hero: `Write a compelling one-paragraph executive summary. Structure:
- A single powerful paragraph (3-5 sentences) that captures the essence of the business opportunity
- Mention key selling points: revenue, profit, location, established history, growth potential
- Use **bold** for the most important figures
- Make it compelling enough that a buyer wants to read the full document`,
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
Write in Australian English (normalise, organisation, colour, centre, analyse, licence).
Never use "valuation" — use "appraisal" instead.
Be professional but engaging. Use concrete details where available.

FORMAT RULES (critical):
- Use **bullet points** for key highlights and features
- Use **markdown tables** for structured data (financials, assets, lease terms, staff)
- Use short paragraphs (2-3 sentences max) between structured elements
- Start each section with a brief intro paragraph, then switch to bullets/tables
- Use **bold** for key figures and important terms
- Do NOT use markdown headers (# ## ###) — the section title is handled separately`,
        },
        {
          role: "user",
          content: `${promptBase} for an Information Memorandum.\n\nBusiness Details:\n${businessContext}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("IM AI write error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
