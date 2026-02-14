import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sectionPrompts: Record<string, string> = {
  overview: `Generate a Business Overview TEMPLATE. Structure:
- Opening paragraph (2-3 sentences) using ONLY the known facts: business name, industry, location, established year, revenue, employees, asking price
- **Key Highlights** as bullet points — use known data, add [PLACEHOLDER] for: unique selling points, competitive advantages, owner's story
- Brief closing paragraph: "This is an [PLACEHOLDER: describe the opportunity — e.g., established business with strong customer base]"
- Prefix with: > 📝 **Template** — Fill in the [PLACEHOLDER] fields with your actual business details.`,

  operations: `Generate an Operations TEMPLATE. Structure:
- Brief intro: "Here's how the business operates on a day-to-day basis:"
- **Operating Model** as bullet points with placeholders:
  - **Operating hours:** [e.g., Mon-Fri 7am-3pm, Sat-Sun 8am-2pm]
  - **Days open per year:** [Specify days/weeks, seasonal closures]
  - **Peak periods:** [When is the business busiest?]
- **Key Systems & Processes** as bullet points:
  - **POS/Software:** [List main systems — POS, inventory, accounting, booking]
  - **Key equipment:** [List main equipment and estimated values]
  - **Daily workflow:** [Describe typical day's operations]
- **Supplier Relationships** as bullet points:
  - **Main suppliers:** [List 3-5 key suppliers and what they provide]
  - **Terms:** [Payment terms, contract obligations]
  - **Transferability:** [Are supplier relationships easily transferred?]
- Prefix with: > 📝 **Template** — Fill in the [PLACEHOLDER] fields with your actual business details.`,

  financials: `Generate a Financial Performance TEMPLATE. Structure:
- Opening: "The business demonstrates [PLACEHOLDER: describe financial health — strong/stable/growing revenue]."
- **Key Financial Metrics** as a markdown table — use revenue/profit if provided, otherwise use placeholders:
  | Metric | FY ${new Date().getFullYear() - 1} | FY ${new Date().getFullYear() - 2} | FY ${new Date().getFullYear() - 3} |
  |--------|----------|----------|----------|
  | Revenue | $[Amount] | $[Amount] | $[Amount] |
  | COGS | $[Amount] | $[Amount] | $[Amount] |
  | Gross Profit | $[Amount] | $[Amount] | $[Amount] |
  | Operating Expenses | $[Amount] | $[Amount] | $[Amount] |
  | EBITDA | $[Amount] | $[Amount] | $[Amount] |
- **Expense Breakdown** (latest year) as bullet points:
  - Rent: $[Amount]
  - Wages: $[Amount]
  - Utilities: $[Amount]
  - Other: $[Amount]
- Brief note: "Detailed profit & loss statements available under NDA."
- Prefix with: > 📝 **Template** — Fill in the [PLACEHOLDER] fields. If you've uploaded your financials, this section will auto-populate.`,

  growth: `Generate a Growth Opportunities TEMPLATE. Structure:
- Brief intro: "What growth opportunities have you identified but not yet pursued?"
- **Immediate Opportunities** (6-12 months) as bullet template:
  - **[Opportunity 1]:** [Describe the opportunity and estimated revenue impact]
  - **[Opportunity 2]:** [Describe the opportunity and estimated revenue impact]
  - **[Opportunity 3]:** [Describe the opportunity and estimated revenue impact]
- **Medium-Term Opportunities** (1-3 years):
  - **[Opportunity 1]:** [Describe]
  - **[Opportunity 2]:** [Describe]
- **Consider these categories:**
  - New products/services
  - Extended hours or additional locations
  - Delivery/online expansion
  - New customer segments or markets
  - Underutilised capacity or equipment
- Prefix with: > 📝 **Template** — Fill in the [PLACEHOLDER] fields with your actual business details.`,

  assets: `Generate a Plant & Equipment TEMPLATE. Structure:
- Brief intro: "List all significant equipment, vehicles, fixtures, and fittings included in the sale."
- **Plant & Equipment** as a markdown table:
  | Asset | Description | Age (Years) | Condition | Est. Value |
  |-------|-------------|-------------|-----------|-----------|
  | [Item 1] | [Details] | [Years] | [Good/Fair/Poor] | $[Value] |
  | [Item 2] | [Details] | [Years] | [Good/Fair/Poor] | $[Value] |
  | [Item 3] | [Details] | [Years] | [Good/Fair/Poor] | $[Value] |
- **Fixtures & Fittings** as bullet points:
  - [Item and estimated value]
  - [Item and estimated value]
- **Intellectual Property** (if relevant):
  - **Brand/Trademark:** [Details]
  - **Website/Domain:** [Details]
  - **Social media:** [Accounts and follower counts]
  - **Proprietary processes:** [Any unique recipes, systems, IP]
- **Stock:** [Note about stock included at value, typical stock level]
- If FF&E value is provided in context, include: "Total FF&E estimated value: $[amount]"
- Prefix with: > 📝 **Template** — Fill in the [PLACEHOLDER] fields with your actual business details.`,

  staff: `Generate a Team & Staff TEMPLATE. Structure:
- If employee count is provided, use it: "With [X] employees, describe your team structure."
- Otherwise: "Describe your team structure and key roles."
- **Organisation Structure** as a markdown table:
  | Role | FT/PT/Casual | Tenure | Key Responsibilities |
  |------|--------------|--------|---------------------|
  | [Role 1] | [Type] | [Years] | [Responsibilities] |
  | [Role 2] | [Type] | [Years] | [Responsibilities] |
  | [Role 3] | [Type] | [Years] | [Responsibilities] |
- **Key Questions:**
  - Are any staff critical to operations?
  - Would the owner's departure require a replacement hire?
  - What transition/training period is offered?
  - Are there any long-term contracts or employment agreements?
- Prefix with: > 📝 **Template** — Fill in the [PLACEHOLDER] fields with your actual business details.`,

  lease: `Generate a Lease & Property TEMPLATE. Structure:
- Brief intro: "Enter your lease details — buyers consider the lease one of the most critical factors."
- **Lease Summary** as structured bullet points:
  - **Lease term:** [Start date — End date]
  - **Options:** [Number × years each — e.g., 2 × 5 years]
  - **Annual rent:** $[Amount] + GST
  - **Outgoings:** $[Amount] p.a. (specify: council rates, water, strata, insurance)
  - **Total occupancy cost:** $[Rent + Outgoings]
  - **Rent reviews:** [Frequency and method — CPI, market review, fixed %]
  - **Assignment clause:** [Can the lease be assigned to a new owner? Any landlord consent required?]
  - **Make good:** [Any make-good obligations on exit?]
  - **Security deposit:** $[Amount]
- **Premises Description** as bullet points:
  - **Size:** [m² internal, m² external/courtyard if applicable]
  - **Features:** [Describe layout, fit-out, key features]
  - **Condition:** [Describe condition and any recent improvements]
  - **Parking:** [Number of spaces, type — customer/staff/street]
  - **Accessibility:** [Foot traffic, visibility, access]
- **Landlord Relationship:** [Note about landlord relationship, any issues or benefits]
- Prefix with: > 📝 **Template** — Fill in the [PLACEHOLDER] fields with your actual business details.`,

  gallery: `Generate a brief Photo Gallery prompt (2-3 sentences):
"Upload photos of your business to give buyers a visual understanding of the opportunity. Include:
- Exterior and signage
- Interior layout and customer areas
- Equipment and kitchen/production areas
- Products or services
- Team in action (if appropriate)

Aim for 6-10 high-quality photos that showcase your business professionally."

Prefix with: > 📝 **Template** — Upload your photos.`,

  hero: `Generate a compelling executive summary paragraph using ONLY known facts. Structure:
- A single powerful paragraph (3-5 sentences) that captures the essence using: business name, industry, location, revenue, profit (if provided), established year, asking price
- Use **bold** for the most important figures
- For anything not known, use general language: "with strong financials" instead of specific numbers
- Make it compelling but factual
- Prefix with: > ⚠️ **AI Draft** — Review and edit this content to ensure accuracy.`,
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
    const promptBase = sectionPrompts[sectionType] || `Generate a TEMPLATE for the ${sectionType} section with [PLACEHOLDER] markers for unknown details`;

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
          content: `You are helping a business owner create their Information Memorandum (IM) for selling their business. Your job is to create a STRUCTURED TEMPLATE that the owner can fill in with their real details.

CRITICAL RULES:
1. NEVER invent specific details you don't know (equipment names, staff names, lease terms, supplier names, specific financial figures not provided)
2. Use [PLACEHOLDER] or [PLACEHOLDER: helpful prompt] markers for details the owner needs to fill in
3. Use the business data provided (name, industry, location, revenue, employees, price, established year) to set context — these facts you CAN state
4. Create clear, professional structures with prompting questions to guide the owner
5. Use Australian English (normalise, organisation, colour, centre, analyse, licence)
6. Use "appraisal" NEVER "valuation", "solicitor" not "lawyer", "settlement" not "closing"

FORMAT: 
- Use **bullet points** for key highlights and lists
- Use **markdown tables** for structured data (financials, assets, lease terms, staff)
- Use short intro paragraphs (1-2 sentences) to set context
- Use **bold** for labels and key terms
- Do NOT use markdown headers (# ## ###) — section titles are handled separately
- Include the prefix markers (> 📝 **Template** or > ⚠️ **AI Draft**) as instructed in the section prompt`,
        },
        {
          role: "user",
          content: `${promptBase}\n\nKnown Business Details:\n${businessContext}\n\nGenerate a helpful template structure using known facts where available and [PLACEHOLDER] markers for everything else.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("IM AI write error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
