import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── HTML text extraction helpers ───

function stripHtmlTags(html: string): string {
  // Remove script and style blocks entirely
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  // Replace block-level tags with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode common entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n/g, "\n\n");
  return text.trim();
}

function extractImageUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];
    // Skip tiny images, icons, tracking pixels
    if (src.includes("1x1") || src.includes("pixel") || src.includes(".svg") || src.includes("data:image")) continue;
    // Make absolute
    if (src.startsWith("//")) {
      src = "https:" + src;
    } else if (src.startsWith("/")) {
      try {
        const u = new URL(baseUrl);
        src = u.origin + src;
      } catch {
        continue;
      }
    } else if (!src.startsWith("http")) {
      try {
        src = new URL(src, baseUrl).href;
      } catch {
        continue;
      }
    }
    if (!urls.includes(src)) urls.push(src);
  }
  return urls.slice(0, 20); // Cap at 20 images
}

// Section type to order mapping
const SECTION_ORDER: Record<string, number> = {
  hero: 0,
  overview: 1,
  operations: 2,
  financials: 3,
  growth: 4,
  assets: 5,
  staff: 6,
  lease: 7,
  gallery: 8,
};

// Section type to title mapping
const SECTION_TITLES: Record<string, string> = {
  overview: "Business Overview",
  operations: "Operations",
  growth: "Growth Opportunities",
  assets: "Assets & Equipment",
  staff: "Team & Staff",
  lease: "Lease & Property",
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

    const { businessId, url } = await req.json();

    if (!businessId || !url) {
      return NextResponse.json({ error: "businessId and url are required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Please enter a valid website URL" }, { status: 400 });
    }

    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // ─── Step 1: Fetch the website ───
    let html: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(parsedUrl.href, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; OwnerExit/1.0; +https://ownerexit.ai)",
          "Accept": "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Website returned status ${response.status}. Please check the URL and try again.` },
          { status: 422 }
        );
      }

      html = await response.text();
    } catch (err: unknown) {
      const message = err instanceof Error && err.name === "AbortError"
        ? "Website took too long to respond. Please try again."
        : "Could not reach the website. Please check the URL and try again.";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    // ─── Step 2: Extract content ───
    const scrapedText = stripHtmlTags(html);
    const imageUrls = extractImageUrls(html, parsedUrl.href);

    if (scrapedText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough content from the website. The page may be JavaScript-rendered or have very little text." },
        { status: 422 }
      );
    }

    // Limit text to ~4000 chars for GPT context
    const truncatedText = scrapedText.slice(0, 4000);

    // ─── Step 3: Send to GPT-4o ───
    const askingPrice = business.askingPrice ? `$${Number(business.askingPrice).toLocaleString()}` : "Not disclosed";
    const annualRevenue = business.annualRevenue ? `$${Number(business.annualRevenue).toLocaleString()}` : "Not disclosed";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert business broker writing Information Memorandums for Australian businesses.
Write in Australian English (normalise, organisation, colour, centre, analyse, licence, favour, honour).
NEVER use the word "valuation" — use "appraisal" instead.
Be professional, compelling but factual. Use concrete details where available.

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
          content: `You are writing sections for an Information Memorandum (IM) for a business for sale.
Based on the following website content, generate professional IM sections.
Write in Australian English. Be compelling but factual.

Business: ${business.name} (${business.industry}) in ${business.location}, ${business.state}
Asking Price: ${askingPrice}
Annual Revenue: ${annualRevenue}

Website content:
${truncatedText}

Generate JSON with these sections (skip any where you don't have enough info):
{
  "overview": "Business overview with opening paragraph, then **Key Highlights** as bullet points (5-8 items), closing paragraph (200-400 words)",
  "operations": "Operations with intro paragraph, then **Operating Model** bullet points, **Key Systems & Processes** bullet points (200-300 words)",
  "growth": "Growth opportunities with intro, then **Immediate Opportunities** bullet points, **Medium-Term Opportunities** bullet points (150-250 words)",
  "assets": "Assets section with **Plant & Equipment** as a markdown table (| Item | Description | Est. Value |), then **Fixtures & Fittings** bullet points (100-200 words)",
  "staff": "Team section with **Organisation Structure** as a markdown table (| Role | Type | Responsibilities |), then **Key Personnel** bullet points (100-200 words)",
  "lease": "Lease section with **Lease Summary** as a markdown table (| Detail | Value |), then **Premises Description** bullet points (100-200 words)"
}

Return ONLY the JSON object. No markdown fences, no explanation.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const aiContent = completion.choices[0]?.message?.content || "";

    // Parse JSON from GPT response
    let generatedSections: Record<string, string>;
    try {
      // Strip any markdown fences if present
      const cleaned = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      generatedSections = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      return NextResponse.json(
        { error: "AI generated invalid output. Please try again." },
        { status: 500 }
      );
    }

    // ─── Step 4: Save to IMSection records ───
    const savedSections: Array<{ sectionType: string; title: string; content: string }> = [];

    for (const [sectionType, content] of Object.entries(generatedSections)) {
      if (!content || typeof content !== "string" || content.trim().length === 0) continue;
      if (!SECTION_TITLES[sectionType]) continue; // Skip unknown sections

      const existing = await prisma.iMSection.findFirst({
        where: { businessId, sectionType },
      });

      const sectionData = {
        title: SECTION_TITLES[sectionType],
        content: content.trim(),
        order: SECTION_ORDER[sectionType] ?? 0,
        mediaUrls: sectionType === "overview" && imageUrls.length > 0 ? imageUrls : [],
        isVisible: true,
      };

      if (existing) {
        // Only overwrite if existing content is empty
        if (!existing.content || existing.content.trim().length === 0) {
          await prisma.iMSection.update({
            where: { id: existing.id },
            data: sectionData,
          });
          savedSections.push({ sectionType, title: sectionData.title, content: sectionData.content });
        }
      } else {
        await prisma.iMSection.create({
          data: {
            businessId,
            sectionType,
            ...sectionData,
          },
        });
        savedSections.push({ sectionType, title: sectionData.title, content: sectionData.content });
      }
    }

    // ─── Step 5: Return results ───
    return NextResponse.json({
      success: true,
      sectionsGenerated: savedSections.length,
      sections: savedSections,
      imageUrls,
      message: savedSections.length > 0
        ? `Generated ${savedSections.length} section${savedSections.length !== 1 ? "s" : ""} from website content.`
        : "No new sections were generated — existing content was preserved.",
    });
  } catch (error) {
    console.error("Website scrape error:", error);
    return NextResponse.json({ error: "Failed to scrape website" }, { status: 500 });
  }
}
