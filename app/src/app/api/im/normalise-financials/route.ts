import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import benchmarkData from "@/data/benchmarks.json";

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

interface NormaliseRequest {
  businessId: string;
  revenue: number;
  otherIncome: number;
  expenses: {
    costOfGoodsSold?: number;
    wages?: number;
    rent?: number;
    utilities?: number;
    insurance?: number;
    marketing?: number;
    depreciation?: number;
    interest?: number;
    otherExpenses?: number;
  };
  reportedProfit: number;
  addBacks: Array<{ name: string; amount: number }>;
  deductions: Array<{ name: string; amount: number }>;
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

    const body: NormaliseRequest = await req.json();
    const { businessId, revenue, otherIncome, expenses, reportedProfit, addBacks, deductions } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    // Verify ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found or not owned by you" }, { status: 404 });
    }

    // Calculate normalised EBITDA
    const addBacksTotal = addBacks.reduce((sum, ab) => sum + (ab.amount || 0), 0);
    const deductionsTotal = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const normalisedEBITDA = reportedProfit + addBacksTotal - deductionsTotal;

    // Benchmark comparison
    const industryKey = business.industry.toLowerCase().replace(/[\s&]+/g, "_");
    const benchmarks = getBenchmarkForIndustry(industryKey, revenue);

    const benchmarkComparison: Record<string, { value: number; benchmark: number; status: string }> = {};
    if (benchmarks && revenue > 0) {
      const cogsPercent = ((expenses.costOfGoodsSold || 0) / revenue) * 100;
      const labourPercent = ((expenses.wages || 0) / revenue) * 100;
      const rentPercent = ((expenses.rent || 0) / revenue) * 100;
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

    // Appraisal range
    const multiples = INDUSTRY_MULTIPLES[industryKey] || { low: 2, high: 3.5 };
    const midMultiple = (multiples.low + multiples.high) / 2;
    const appraisalRange = {
      low: Math.round(normalisedEBITDA * multiples.low),
      mid: Math.round(normalisedEBITDA * midMultiple),
      high: Math.round(normalisedEBITDA * multiples.high),
      multipleRange: `${multiples.low}x-${multiples.high}x`,
    };

    // Update IMSection with normalised data
    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0);
    const existing = await prisma.iMSection.findFirst({
      where: { businessId, sectionType: "financials" },
    });

    const financialContent = JSON.stringify({
      revenue,
      otherIncome,
      expenses,
      totalExpenses,
      reportedProfit,
      addBacks,
      deductions,
      addBacksTotal,
      deductionsTotal,
      normalisedEBITDA,
      benchmarkComparison,
      appraisalRange,
      updatedAt: new Date().toISOString(),
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

    return NextResponse.json({
      reportedProfit,
      normalisedEBITDA,
      addBacksTotal,
      deductionsTotal,
      benchmarks: benchmarkComparison,
      appraisalRange,
    });
  } catch (error) {
    console.error("Normalise financials error:", error);
    return NextResponse.json(
      { error: "Failed to normalise financials" },
      { status: 500 }
    );
  }
}
