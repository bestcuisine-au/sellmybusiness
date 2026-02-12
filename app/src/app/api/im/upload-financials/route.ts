import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import benchmarkData from "@/data/benchmarks.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Industry multiples for appraisal ───
const INDUSTRY_MULTIPLES: Record<string, { low: number; high: number }> = {
  cafe_restaurant: { low: 1.5, high: 2.5 },
  takeaway: { low: 1.5, high: 2.5 },
  pub_bar: { low: 1.5, high: 2.5 },
  retail: { low: 1.5, high: 3 },
  bakery: { low: 1.5, high: 2.5 },
  construction: { low: 2, high: 3.5 },
  plumbing: { low: 2, high: 3.5 },
  electrical: { low: 2, high: 3.5 },
  accounting: { low: 2, high: 4 },
  legal: { low: 2, high: 4 },
  beauty: { low: 1.5, high: 2.5 },
  auto_repair: { low: 2, high: 3 },
  real_estate: { low: 2, high: 4 },
  gym: { low: 1.5, high: 2.5 },
  technology: { low: 3, high: 6 },
  consulting: { low: 2, high: 4 },
  veterinary: { low: 3, high: 5 },
  cleaning: { low: 2, high: 3 },
  landscaping: { low: 2, high: 3 },
  courier: { low: 2, high: 3 },
  graphic_design: { low: 2, high: 4 },
  photography: { low: 2, high: 3 },
  medical: { low: 3, high: 5 },
  childcare: { low: 3, high: 5 },
  hardware: { low: 1.5, high: 3 },
};

const INDUSTRY_ANZSIC_MAP: Record<string, string> = {
  cafe_restaurant: "Cafes and Restaurants",
  takeaway: "Takeaway Food Services",
  pub_bar: "Pubs, Taverns and Bars",
  retail: "Retail Trade - Supermarkets",
  bakery: "Bakery Products Retailing",
  construction: "Building Construction",
  plumbing: "Plumbing Services",
  electrical: "Electrical Services",
  accounting: "Accounting Services",
  legal: "Legal Services",
  beauty: "Hairdressing and Beauty Services",
  auto_repair: "Motor Vehicle Repair and Maintenance",
  real_estate: "Real Estate Services",
  gym: "Gym and Fitness Centres",
  technology: "Computer System Design Services",
  consulting: "Management Advice and Consulting",
  veterinary: "Veterinary Services",
  cleaning: "Cleaning Services",
  landscaping: "Landscaping Services",
  courier: "Courier and Delivery Services",
  graphic_design: "Graphic Design Services",
  photography: "Photography Services",
  medical: "Medical and Dental Practices",
  childcare: "Child Care Services",
  hardware: "Hardware and Building Supplies Retailing",
};

function getTurnoverRange(revenue: number): string {
  if (revenue < 200000) return "$0-$200K";
  if (revenue < 500000) return "$200K-$500K";
  return "$500K-$2M";
}

function getBenchmarkForIndustry(industryCode: string, revenue: number) {
  const anzsicName = INDUSTRY_ANZSIC_MAP[industryCode];
  if (!anzsicName) return null;

  const industry = (benchmarkData as { industries: Array<{ industry: string; turnover_ranges: Array<{ range: string; benchmarks: Record<string, { low: number; mid: number; high: number }> }> }> }).industries.find(
    (ind) => ind.industry === anzsicName
  );
  if (!industry) return null;

  const turnoverRange = getTurnoverRange(revenue);
  const rangeData = industry.turnover_ranges.find((r) => r.range === turnoverRange);

  return rangeData?.benchmarks || null;
}

function getTrafficLight(value: number, benchmark: { low: number; mid: number; high: number }): "green" | "amber" | "red" {
  if (value >= benchmark.low && value <= benchmark.high) return "green";
  const range = benchmark.high - benchmark.low;
  if (value < benchmark.low - range * 0.5 || value > benchmark.high + range * 0.5) return "red";
  return "amber";
}

function formatAUD(val: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(val);
}

interface ExtractedFinancials {
  revenue: number | null;
  otherIncome: number | null;
  costOfGoodsSold: number | null;
  wages: number | null;
  rent: number | null;
  utilities: number | null;
  insurance: number | null;
  marketing: number | null;
  depreciation: number | null;
  interest: number | null;
  otherExpenses: number | null;
  reportedProfit: number | null;
  ownerSalary: number | null;
  items: Array<{ name: string; amount: number; category: string }>;
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

    const formData = await req.formData();
    const businessId = formData.get("businessId") as string;
    const file = formData.get("file") as File;
    const year = formData.get("year") as string;

    if (!businessId || !file || !year) {
      return NextResponse.json(
        { error: "Missing required fields: businessId, file, year" },
        { status: 400 }
      );
    }

    // Verify ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found or not owned by you" }, { status: 404 });
    }

    // Read file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    let extractedText = "";

    // ─── Step 1: Extract text from document ───
    if (mimeType === "application/pdf") {
      // PDF extraction
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } catch (pdfError) {
        console.error("PDF parse error:", pdfError);
        return NextResponse.json(
          { error: "Failed to parse PDF. Please try an image instead." },
          { status: 400 }
        );
      }
    } else if (
      mimeType === "image/jpeg" ||
      mimeType === "image/png" ||
      mimeType === "image/jpg" ||
      mimeType === "image/webp"
    ) {
      // Image OCR via GPT-4o vision
      const base64Image = fileBuffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const visionRes = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this financial document image. Include all numbers, line items, and labels exactly as they appear. Focus on Profit & Loss / Income Statement data.",
              },
              {
                type: "image_url",
                image_url: { url: dataUri },
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      extractedText = visionRes.choices[0]?.message?.content || "";
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or image (JPG/PNG)." },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from the document. Please try a clearer image or PDF." },
        { status: 400 }
      );
    }

    // ─── Step 2: Extract structured P&L data via GPT-4o ───
    const extractionRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a financial data extraction specialist. Extract Profit & Loss data from the provided text. Return ONLY valid JSON, no markdown fences.",
        },
        {
          role: "user",
          content: `Extract the Profit & Loss statement from this financial document text.
Return JSON with:
{
  "revenue": number,
  "otherIncome": number,
  "costOfGoodsSold": number,
  "wages": number,
  "rent": number,
  "utilities": number,
  "insurance": number,
  "marketing": number,
  "depreciation": number,
  "interest": number,
  "otherExpenses": number,
  "reportedProfit": number,
  "ownerSalary": number (if identifiable),
  "items": [{"name": "line item name", "amount": number, "category": "revenue|cogs|expense|other"}]
}
Use Australian dollars. If a figure is not found, use null.

Document text:
${extractedText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    let extractedData: ExtractedFinancials;
    try {
      let jsonStr = extractionRes.choices[0]?.message?.content || "{}";
      // Strip markdown fences if present
      jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extractedData = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse extracted financial data. Please try again." },
        { status: 500 }
      );
    }

    // ─── Step 3: Calculate normalised figures ───
    const revenue = extractedData.revenue || 0;
    const otherIncome = extractedData.otherIncome || 0;
    const totalIncome = revenue + otherIncome;

    const expenses = {
      costOfGoodsSold: extractedData.costOfGoodsSold || 0,
      wages: extractedData.wages || 0,
      rent: extractedData.rent || 0,
      utilities: extractedData.utilities || 0,
      insurance: extractedData.insurance || 0,
      marketing: extractedData.marketing || 0,
      depreciation: extractedData.depreciation || 0,
      interest: extractedData.interest || 0,
      otherExpenses: extractedData.otherExpenses || 0,
    };

    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
    const reportedProfit = totalIncome - totalExpenses;

    // Default add-backs
    const addBacks: Array<{ name: string; amount: number }> = [];
    if (extractedData.ownerSalary) {
      addBacks.push({ name: "Owner salary", amount: extractedData.ownerSalary });
    }
    if (expenses.depreciation > 0) {
      addBacks.push({ name: "Depreciation", amount: expenses.depreciation });
    }
    if (expenses.interest > 0) {
      addBacks.push({ name: "Interest", amount: expenses.interest });
    }

    const addBacksTotal = addBacks.reduce((sum, ab) => sum + ab.amount, 0);
    const normalisedEBITDA = reportedProfit + addBacksTotal;

    // ─── Step 4: Benchmark comparison ───
    const industryKey = business.industry.toLowerCase().replace(/[\s&]+/g, "_");
    const benchmarks = getBenchmarkForIndustry(industryKey, revenue);

    const benchmarkComparison: Record<string, { value: number; benchmark: number; status: string }> = {};
    if (benchmarks && revenue > 0) {
      const cogsPercent = (expenses.costOfGoodsSold / revenue) * 100;
      const labourPercent = (expenses.wages / revenue) * 100;
      const rentPercent = (expenses.rent / revenue) * 100;
      const ebitdaMargin = (normalisedEBITDA / revenue) * 100;

      if (benchmarks.cost_of_sales_pct) {
        benchmarkComparison.cogsPercent = {
          value: Math.round(cogsPercent * 10) / 10,
          benchmark: benchmarks.cost_of_sales_pct.mid,
          status: getTrafficLight(cogsPercent, benchmarks.cost_of_sales_pct),
        };
      }
      if (benchmarks.labour_cost_pct) {
        benchmarkComparison.labourPercent = {
          value: Math.round(labourPercent * 10) / 10,
          benchmark: benchmarks.labour_cost_pct.mid,
          status: getTrafficLight(labourPercent, benchmarks.labour_cost_pct),
        };
      }
      if (benchmarks.rent_pct) {
        benchmarkComparison.rentPercent = {
          value: Math.round(rentPercent * 10) / 10,
          benchmark: benchmarks.rent_pct.mid,
          status: getTrafficLight(rentPercent, benchmarks.rent_pct),
        };
      }
      if (benchmarks.ebitda_margin_pct) {
        benchmarkComparison.ebitdaMargin = {
          value: Math.round(ebitdaMargin * 10) / 10,
          benchmark: benchmarks.ebitda_margin_pct.mid,
          status: getTrafficLight(ebitdaMargin, benchmarks.ebitda_margin_pct),
        };
      }
    }

    // ─── Step 5: Calculate appraisal range ───
    const multiples = INDUSTRY_MULTIPLES[industryKey] || { low: 2, high: 3.5 };
    const midMultiple = (multiples.low + multiples.high) / 2;
    const appraisalRange = {
      low: Math.round(normalisedEBITDA * multiples.low),
      mid: Math.round(normalisedEBITDA * midMultiple),
      high: Math.round(normalisedEBITDA * multiples.high),
      multipleRange: `${multiples.low}x-${multiples.high}x`,
    };

    // ─── Step 6: Save to IMSection ───
    const financialContent = JSON.stringify({
      year,
      extracted: extractedData,
      revenue,
      otherIncome,
      expenses,
      totalExpenses,
      reportedProfit,
      addBacks,
      deductions: [],
      addBacksTotal,
      deductionsTotal: 0,
      normalisedEBITDA,
      benchmarkComparison,
      appraisalRange,
      uploadedAt: new Date().toISOString(),
    });

    // Upsert the financials section
    const existing = await prisma.iMSection.findFirst({
      where: { businessId, sectionType: "financials" },
    });

    if (existing) {
      await prisma.iMSection.update({
        where: { id: existing.id },
        data: { content: financialContent },
      });
    } else {
      await prisma.iMSection.create({
        data: {
          businessId,
          sectionType: "financials",
          title: "Financial Performance",
          content: financialContent,
          order: 3,
          mediaUrls: [],
          isVisible: true,
        },
      });
    }

    // ─── Step 7: Return results ───
    return NextResponse.json({
      success: true,
      data: {
        year,
        extracted: extractedData,
        revenue,
        otherIncome,
        expenses,
        totalExpenses,
        reportedProfit,
        addBacks,
        deductions: [],
        addBacksTotal,
        deductionsTotal: 0,
        normalisedEBITDA,
        benchmarkComparison,
        appraisalRange,
      },
    });
  } catch (error) {
    console.error("Upload financials error:", error);
    return NextResponse.json(
      { error: "Failed to process financial document" },
      { status: 500 }
    );
  }
}
