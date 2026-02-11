import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import benchmarkData from '@/data/benchmarks.json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  cafe_restaurant: 'Cafes and Restaurants',
  takeaway: 'Takeaway Food Services',
  pub_bar: 'Pubs, Taverns and Bars',
  retail: 'Retail Trade - Supermarkets',
  bakery: 'Bakery Products Retailing',
  construction: 'Building Construction',
  plumbing: 'Plumbing Services',
  electrical: 'Electrical Services',
  accounting: 'Accounting Services',
  legal: 'Legal Services',
  beauty: 'Hairdressing and Beauty Services',
  auto_repair: 'Motor Vehicle Repair and Maintenance',
  real_estate: 'Real Estate Services',
  gym: 'Gym and Fitness Centres',
  technology: 'Computer System Design Services',
  consulting: 'Management Advice and Consulting',
  veterinary: 'Veterinary Services',
  cleaning: 'Cleaning Services',
  landscaping: 'Landscaping Services',
  courier: 'Courier and Delivery Services',
  graphic_design: 'Graphic Design Services',
  photography: 'Photography Services',
  medical: 'Medical and Dental Practices',
  childcare: 'Child Care Services',
  hardware: 'Hardware and Building Supplies Retailing',
};

interface RequestBody {
  contactData: { name: string; email: string };
  businessDetails: { industry: string; annualRevenue: string; state: string; yearsOperating: string };
  plData: {
    revenue: string;
    cogs: string;
    ownerSalary: string;
    staffWages: string;
    rent: string;
    motorVehicle: string;
    interest: string;
    depreciation: string;
    otherExpenses: { description: string; amount: string }[];
  };
  normalizationAnswers: {
    ownerHours: string;
    nonWorkingPayroll: string;
    ownPremises: string;
    marketRent: string;
    personalExpenses: { description: string; amount: string }[];
    oneOffCosts: { description: string; amount: string }[];
    relatedPartyAdjustments: string;
  };
}

function getTurnoverRange(revenue: number): string {
  if (revenue < 200000) return '$0-$200K';
  if (revenue < 500000) return '$200K-$500K';
  return '$500K-$2M';
}

function getBenchmarkForIndustry(industryCode: string, revenue: number) {
  const anzsicName = INDUSTRY_ANZSIC_MAP[industryCode];
  if (!anzsicName) return null;

  const industry = benchmarkData.industries.find((ind: any) => ind.industry === anzsicName);
  if (!industry) return null;

  const turnoverRange = getTurnoverRange(revenue);
  const rangeData = industry.turnover_ranges.find((r: any) => r.range === turnoverRange);
  
  return rangeData?.benchmarks || null;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { contactData, businessDetails, plData, normalizationAnswers } = body;

    // Parse all numbers
    const revenue = parseFloat(plData.revenue);
    const cogs = parseFloat(plData.cogs);
    const ownerSalary = parseFloat(plData.ownerSalary);
    const staffWages = parseFloat(plData.staffWages);
    const rent = parseFloat(plData.rent);
    const motorVehicle = parseFloat(plData.motorVehicle);
    const interest = parseFloat(plData.interest);
    const depreciation = parseFloat(plData.depreciation);

    const otherExpensesTotal = plData.otherExpenses.reduce(
      (sum, exp) => sum + (parseFloat(exp.amount) || 0),
      0
    );

    // Calculate reported EBITDA
    const reportedNetProfit =
      revenue -
      cogs -
      ownerSalary -
      staffWages -
      rent -
      motorVehicle -
      interest -
      depreciation -
      otherExpensesTotal;

    const reportedEBITDA = reportedNetProfit + interest + depreciation;

    // Calculate addbacks
    const addbacks: { description: string; amount: number; explanation: string }[] = [];

    // Owner salary replacement adjustment
    const ownerHours = parseFloat(normalizationAnswers.ownerHours);
    const marketRateSalary = ownerHours >= 40 ? 80000 : (ownerHours / 40) * 80000;
    const ownerSalaryAddback = ownerSalary - marketRateSalary;
    if (ownerSalaryAddback !== 0) {
      addbacks.push({
        description: 'Owner Salary Adjustment',
        amount: ownerSalaryAddback,
        explanation:
          ownerSalaryAddback > 0
            ? `Owner taking more than market rate (${ownerHours}h/week). Adjusted to $${marketRateSalary.toFixed(0)}.`
            : `Owner taking less than market rate. Adjusted to $${marketRateSalary.toFixed(0)}.`,
      });
    }

    // Non-working payroll addback
    if (normalizationAnswers.nonWorkingPayroll) {
      const match = normalizationAnswers.nonWorkingPayroll.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        addbacks.push({
          description: 'Non-Working Payroll',
          amount: amount,
          explanation: normalizationAnswers.nonWorkingPayroll,
        });
      }
    }

    // Rent adjustment if owner owns premises
    if (normalizationAnswers.ownPremises === 'yes' && normalizationAnswers.marketRent) {
      const marketRent = parseFloat(normalizationAnswers.marketRent);
      const rentAddback = rent - marketRent;
      if (rentAddback !== 0) {
        addbacks.push({
          description: 'Rent Adjustment (Owned Premises)',
          amount: rentAddback,
          explanation:
            rentAddback > 0
              ? 'Paying above market rent (related party). Adjusted to market rate.'
              : 'Below-market rent (owned premises). Adjusted to market rate.',
        });
      }
    }

    // Personal expenses addbacks
    normalizationAnswers.personalExpenses.forEach((exp) => {
      if (exp.description && exp.amount) {
        const amount = parseFloat(exp.amount);
        addbacks.push({
          description: `Personal Expense: ${exp.description}`,
          amount: amount,
          explanation: 'Personal expense added back to normalize earnings.',
        });
      }
    });

    // One-off costs addbacks
    normalizationAnswers.oneOffCosts.forEach((cost) => {
      if (cost.description && cost.amount) {
        const amount = parseFloat(cost.amount);
        addbacks.push({
          description: `One-Off: ${cost.description}`,
          amount: amount,
          explanation: 'Non-recurring cost added back.',
        });
      }
    });

    // Interest and Depreciation (already in EBITDA but list for clarity)
    addbacks.push({
      description: 'Interest Expense',
      amount: interest,
      explanation: 'Added back to calculate EBITDA.',
    });

    addbacks.push({
      description: 'Depreciation',
      amount: depreciation,
      explanation: 'Non-cash expense added back to calculate EBITDA.',
    });

    // Calculate total addbacks and normalized EBITDA
    const totalAddbacks = addbacks.reduce((sum, ab) => sum + ab.amount, 0);
    const normalizedEBITDA = reportedEBITDA + totalAddbacks - interest - depreciation; // Remove I&D since we're showing them separately

    // Actually, let me recalculate this properly
    // Normalized EBITDA = Revenue - Normalized Operating Expenses (excluding I&D)
    const normalizedCOGS = cogs;
    const normalizedOwnerSalary = marketRateSalary;
    const normalizedStaffWages = staffWages - (normalizationAnswers.nonWorkingPayroll ? parseFloat(normalizationAnswers.nonWorkingPayroll.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/)?.[1]?.replace(/,/g, '') || '0') : 0);
    const normalizedRent = normalizationAnswers.ownPremises === 'yes' && normalizationAnswers.marketRent ? parseFloat(normalizationAnswers.marketRent) : rent;
    const normalizedMotorVehicle = motorVehicle;
    
    // Subtract personal and one-off expenses
    const personalExpensesTotal = normalizationAnswers.personalExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const oneOffCostsTotal = normalizationAnswers.oneOffCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const normalizedOtherExpenses = otherExpensesTotal - personalExpensesTotal - oneOffCostsTotal;

    const normalizedNetProfitBeforeID = revenue - normalizedCOGS - normalizedOwnerSalary - normalizedStaffWages - normalizedRent - normalizedMotorVehicle - normalizedOtherExpenses;
    const actualNormalizedEBITDA = normalizedNetProfitBeforeID; // This is EBITDA (before interest and depreciation)

    // Get industry benchmarks
    const benchmarks = getBenchmarkForIndustry(businessDetails.industry, revenue);
    const benchmarkComparison = [];

    if (benchmarks) {
      const cogsPercent = (cogs / revenue) * 100;
      const cogsAvg = benchmarks.cost_of_sales_pct.mid;
      benchmarkComparison.push({
        metric: 'Cost of Goods Sold',
        yourValue: cogsPercent.toFixed(1),
        industryAvg: cogsAvg.toFixed(1),
        status: cogsPercent <= benchmarks.cost_of_sales_pct.high ? 'good' : 'poor',
      });

      const wagesPercent = ((staffWages + ownerSalary) / revenue) * 100;
      const wagesAvg = benchmarks.labour_cost_pct.mid;
      benchmarkComparison.push({
        metric: 'Labour Costs',
        yourValue: wagesPercent.toFixed(1),
        industryAvg: wagesAvg.toFixed(1),
        status: wagesPercent <= benchmarks.labour_cost_pct.high ? 'good' : 'poor',
      });

      const rentPercent = (rent / revenue) * 100;
      const rentAvg = benchmarks.rent_pct.mid;
      benchmarkComparison.push({
        metric: 'Rent',
        yourValue: rentPercent.toFixed(1),
        industryAvg: rentAvg.toFixed(1),
        status: rentPercent <= benchmarks.rent_pct.high ? 'good' : 'poor',
      });

      const ebitdaMargin = (actualNormalizedEBITDA / revenue) * 100;
      const ebitdaAvg = benchmarks.ebitda_margin_pct.mid;
      benchmarkComparison.push({
        metric: 'EBITDA Margin',
        yourValue: ebitdaMargin.toFixed(1),
        industryAvg: ebitdaAvg.toFixed(1),
        status:
          ebitdaMargin >= benchmarks.ebitda_margin_pct.mid
            ? 'good'
            : ebitdaMargin >= benchmarks.ebitda_margin_pct.low
            ? 'average'
            : 'poor',
      });
    }

    // Calculate valuation range
    const multiples = INDUSTRY_MULTIPLES[businessDetails.industry] || { low: 2, high: 3 };
    const valuationRange = {
      low: Math.round(actualNormalizedEBITDA * multiples.low),
      high: Math.round(actualNormalizedEBITDA * multiples.high),
      multipleLow: multiples.low,
      multipleHigh: multiples.high,
    };

    // Generate AI commentary
    const aiPrompt = `You are an experienced business valuation expert. Analyze this business P&L normalization and provide a 2-3 paragraph commentary.

Business Details:
- Industry: ${businessDetails.industry}
- Revenue: $${revenue.toLocaleString()}
- Reported EBITDA: $${reportedEBITDA.toLocaleString()}
- Normalized EBITDA: $${actualNormalizedEBITDA.toLocaleString()}
- Total Addbacks: $${totalAddbacks.toLocaleString()}

Key Addbacks:
${addbacks.map((ab) => `- ${ab.description}: $${ab.amount.toLocaleString()}`).join('\n')}

Benchmark Comparison:
${benchmarkComparison.map((bc) => `- ${bc.metric}: ${bc.yourValue}% (industry avg: ${bc.industryAvg}%)`).join('\n')}

Provide commentary on:
1. What looks strong about this business
2. Any areas of concern or opportunity for improvement
3. How the normalized EBITDA compares to industry standards

Be specific, practical, and constructive. Write in a professional but approachable tone.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: aiPrompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiCommentary = completion.choices[0]?.message?.content || 'Analysis unavailable.';

    // Build result
    const result = {
      reportedEBITDA,
      normalizedEBITDA: actualNormalizedEBITDA,
      totalAddbacks,
      reportedPL: {
        Revenue: revenue,
        COGS: cogs,
        'Owner Salary': ownerSalary,
        'Staff Wages': staffWages,
        Rent: rent,
        'Motor Vehicle': motorVehicle,
        'Other Expenses': otherExpensesTotal,
        Interest: interest,
        Depreciation: depreciation,
        EBITDA: reportedEBITDA,
      },
      normalizedPL: {
        Revenue: revenue,
        COGS: normalizedCOGS,
        'Owner Salary': normalizedOwnerSalary,
        'Staff Wages': normalizedStaffWages,
        Rent: normalizedRent,
        'Motor Vehicle': normalizedMotorVehicle,
        'Other Expenses': normalizedOtherExpenses,
        EBITDA: actualNormalizedEBITDA,
      },
      addbacks,
      benchmarkComparison,
      valuationRange,
      aiCommentary,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error normalizing P&L:', error);
    return NextResponse.json({ error: error.message || 'Failed to normalize P&L' }, { status: 500 });
  }
}
