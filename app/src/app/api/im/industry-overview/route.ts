import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `You are an expert Australian business analyst writing a professional Industry & Regional Overview for a business Information Memorandum (IM). Write in a factual, authoritative tone suitable for prospective buyers conducting due diligence.

Use Australian spelling throughout (normalise, organisation, colour, centre, analyse).
Say "appraisal" not "valuation". Say "solicitor" not "lawyer". Say "settlement" not "closing".

Structure your response with these sections using markdown:

## Industry Overview
- Current state of the [industry] sector in Australia
- Key growth drivers and trends
- Market size indicators
- Regulatory environment
- Technology and innovation impact
- Outlook for the next 3-5 years

## Regional Analysis: [Location]
- Population and demographic profile
- Population growth trends
- Economic indicators (employment, median income, key industries)
- Tourism and visitor economy (if relevant)
- Infrastructure and development projects
- Property market indicators

## Local Market Conditions
- Competitive landscape for [industry] in [location]
- Demand drivers specific to the region
- Barriers to entry
- Seasonal factors (if any)
- Growth opportunities

## Key Takeaways for Buyers
- 3-5 bullet points summarising why this is an attractive opportunity in this market

Use specific numbers, percentages, and data points where possible. If exact current figures aren't available, use the most recent reliable estimates and note the source period. Keep the total length to approximately 800-1200 words.`;

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

    const { businessId, industry, location, state, postcode } = await req.json();

    // Validate required inputs
    if (!businessId || !industry || !location) {
      return NextResponse.json(
        { error: "businessId, industry, and location are required" },
        { status: 400 }
      );
    }

    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Build user message
    const userMessage = `Generate an Industry & Regional Overview for a ${industry} business located in ${location}, ${state || business.state}, Australia.${postcode ? ` Postcode: ${postcode}.` : ''}`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || "";

    // Upsert IMSection
    const existing = await prisma.iMSection.findFirst({
      where: { businessId, sectionType: "industry-overview" },
    });

    let section;
    if (existing) {
      section = await prisma.iMSection.update({
        where: { id: existing.id },
        data: { content, updatedAt: new Date() },
      });
    } else {
      section = await prisma.iMSection.create({
        data: {
          businessId,
          sectionType: "industry-overview",
          title: "Industry & Regional Overview",
          content,
          order: 2,
          mediaUrls: [],
          isVisible: true,
        },
      });
    }

    return NextResponse.json({ success: true, content, sectionId: section.id });
  } catch (error) {
    console.error("Industry overview generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate industry overview" },
      { status: 500 }
    );
  }
}
