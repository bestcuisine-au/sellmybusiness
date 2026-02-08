import { NextRequest, NextResponse } from 'next/server';

// Real industry multipliers from Australian market transaction data
// Hospitality sub-categories based on ~80 actual sales
const INDUSTRY_MULTIPLES: Record<string, {
  ebitdaAvg: number;
  ebitdaLow: number;
  ebitdaHigh: number;
  revenueAvg: number;
  typicalPriceLow: number;
  typicalPriceHigh: number;
  notes: string;
}> = {
  // HOSPITALITY SUB-CATEGORIES (from real transaction data)
  'Coffee Shop': {
    ebitdaAvg: 1.3,
    ebitdaLow: 0.8,
    ebitdaHigh: 2.0,
    revenueAvg: 0.2,
    typicalPriceLow: 80000,
    typicalPriceHigh: 300000,
    notes: 'Location and foot traffic critical. Franchise vs independent affects value.'
  },
  'Cafe': {
    ebitdaAvg: 1.8,
    ebitdaLow: 1.2,
    ebitdaHigh: 2.8,
    revenueAvg: 0.3,
    typicalPriceLow: 100000,
    typicalPriceHigh: 400000,
    notes: 'Food offering complexity and seating capacity affect multiples.'
  },
  'Restaurant': {
    ebitdaAvg: 1.7,
    ebitdaLow: 1.0,
    ebitdaHigh: 2.5,
    revenueAvg: 0.25,
    typicalPriceLow: 100000,
    typicalPriceHigh: 500000,
    notes: 'Liquor license adds value. Fine dining commands premium over casual.'
  },
  'Fine Dining Restaurant': {
    ebitdaAvg: 2.2,
    ebitdaLow: 1.5,
    ebitdaHigh: 3.5,
    revenueAvg: 0.35,
    typicalPriceLow: 200000,
    typicalPriceHigh: 1500000,
    notes: 'Reputation, chef quality, and awards significantly impact value.'
  },
  'Pub / Bar / Tavern': {
    ebitdaAvg: 1.6,
    ebitdaLow: 1.0,
    ebitdaHigh: 2.5,
    revenueAvg: 0.3,
    typicalPriceLow: 150000,
    typicalPriceHigh: 2000000,
    notes: 'Gaming licenses and poker machines can dramatically increase value.'
  },
  'Fast Food / Takeaway': {
    ebitdaAvg: 1.8,
    ebitdaLow: 1.0,
    ebitdaHigh: 2.8,
    revenueAvg: 0.25,
    typicalPriceLow: 80000,
    typicalPriceHigh: 400000,
    notes: 'Delivery platform integration and brand recognition important.'
  },
  'Fish & Chips / Chicken Shop': {
    ebitdaAvg: 1.5,
    ebitdaLow: 0.8,
    ebitdaHigh: 2.2,
    revenueAvg: 0.2,
    typicalPriceLow: 50000,
    typicalPriceHigh: 300000,
    notes: 'Equipment condition and local competition key factors.'
  },
  'Bakery': {
    ebitdaAvg: 1.6,
    ebitdaLow: 1.0,
    ebitdaHigh: 2.4,
    revenueAvg: 0.25,
    typicalPriceLow: 80000,
    typicalPriceHigh: 350000,
    notes: 'Production capacity and wholesale contracts add value.'
  },
  'Catering': {
    ebitdaAvg: 1.4,
    ebitdaLow: 0.8,
    ebitdaHigh: 2.0,
    revenueAvg: 0.3,
    typicalPriceLow: 60000,
    typicalPriceHigh: 300000,
    notes: 'Contract book and repeat corporate clients crucial.'
  },
  'Hotel / Motel': {
    ebitdaAvg: 1.5,
    ebitdaLow: 0.8,
    ebitdaHigh: 2.2,
    revenueAvg: 0.15,
    typicalPriceLow: 200000,
    typicalPriceHigh: 3000000,
    notes: 'Excludes freehold. Occupancy rates and star rating key factors.'
  },
  
  // OTHER INDUSTRIES (from BizStats aggregate data)
  'Healthcare & Medical': {
    ebitdaAvg: 3.3,
    ebitdaLow: 2.3,
    ebitdaHigh: 4.3,
    revenueAvg: 0.6,
    typicalPriceLow: 200000,
    typicalPriceHigh: 3000000,
    notes: 'Patient book value and practitioner agreements crucial.'
  },
  'Dental Practice': {
    ebitdaAvg: 3.5,
    ebitdaLow: 2.5,
    ebitdaHigh: 4.5,
    revenueAvg: 0.7,
    typicalPriceLow: 300000,
    typicalPriceHigh: 2500000,
    notes: 'Active patient numbers and equipment age key factors.'
  },
  'Medical Practice': {
    ebitdaAvg: 3.2,
    ebitdaLow: 2.2,
    ebitdaHigh: 4.2,
    revenueAvg: 0.6,
    typicalPriceLow: 200000,
    typicalPriceHigh: 2000000,
    notes: 'Bulk billing vs private affects margins significantly.'
  },
  'Pharmacy': {
    ebitdaAvg: 3.0,
    ebitdaLow: 2.0,
    ebitdaHigh: 4.0,
    revenueAvg: 0.4,
    typicalPriceLow: 400000,
    typicalPriceHigh: 2500000,
    notes: 'PBS scripts and location approval add significant value.'
  },
  'Childcare Centre': {
    ebitdaAvg: 3.6,
    ebitdaLow: 2.5,
    ebitdaHigh: 4.7,
    revenueAvg: 1.1,
    typicalPriceLow: 500000,
    typicalPriceHigh: 4000000,
    notes: 'Occupancy rates, waiting lists, and regulatory compliance key.'
  },
  'Retail Shop': {
    ebitdaAvg: 2.5,
    ebitdaLow: 1.5,
    ebitdaHigh: 3.5,
    revenueAvg: 0.3,
    typicalPriceLow: 50000,
    typicalPriceHigh: 500000,
    notes: 'Online presence and inventory quality impact pricing.'
  },
  'E-commerce': {
    ebitdaAvg: 2.8,
    ebitdaLow: 1.8,
    ebitdaHigh: 4.0,
    revenueAvg: 0.4,
    typicalPriceLow: 50000,
    typicalPriceHigh: 1000000,
    notes: 'Traffic sources, brand strength, and margins matter.'
  },
  'Professional Services': {
    ebitdaAvg: 3.7,
    ebitdaLow: 2.5,
    ebitdaHigh: 5.0,
    revenueAvg: 0.8,
    typicalPriceLow: 100000,
    typicalPriceHigh: 2000000,
    notes: 'Recurring revenue and client retention are key factors.'
  },
  'Accounting Practice': {
    ebitdaAvg: 3.5,
    ebitdaLow: 2.5,
    ebitdaHigh: 4.5,
    revenueAvg: 1.0,
    typicalPriceLow: 150000,
    typicalPriceHigh: 2000000,
    notes: 'Recurring revenue typically 1x annual fees. Staff retention crucial.'
  },
  'Legal Practice': {
    ebitdaAvg: 3.2,
    ebitdaLow: 2.2,
    ebitdaHigh: 4.2,
    revenueAvg: 0.7,
    typicalPriceLow: 150000,
    typicalPriceHigh: 1500000,
    notes: 'Practice area specialisation affects value. WIP consideration important.'
  },
  'Trades & Construction': {
    ebitdaAvg: 2.8,
    ebitdaLow: 1.8,
    ebitdaHigh: 3.8,
    revenueAvg: 0.4,
    typicalPriceLow: 100000,
    typicalPriceHigh: 1500000,
    notes: 'Equipment value and skilled staff retention important.'
  },
  'Manufacturing': {
    ebitdaAvg: 2.5,
    ebitdaLow: 1.8,
    ebitdaHigh: 3.5,
    revenueAvg: 0.5,
    typicalPriceLow: 200000,
    typicalPriceHigh: 5000000,
    notes: 'Machinery, contracts, and IP add significant value.'
  },
  'Transport & Logistics': {
    ebitdaAvg: 3.2,
    ebitdaLow: 2.2,
    ebitdaHigh: 4.2,
    revenueAvg: 0.8,
    typicalPriceLow: 150000,
    typicalPriceHigh: 3000000,
    notes: 'Fleet condition and customer contracts important.'
  },
  'Beauty Salon / Hair': {
    ebitdaAvg: 2.0,
    ebitdaLow: 1.2,
    ebitdaHigh: 2.8,
    revenueAvg: 0.35,
    typicalPriceLow: 40000,
    typicalPriceHigh: 300000,
    notes: 'Staff loyalty and client retention crucial. Fitout condition matters.'
  },
  'Gym / Fitness': {
    ebitdaAvg: 2.2,
    ebitdaLow: 1.4,
    ebitdaHigh: 3.0,
    revenueAvg: 0.4,
    typicalPriceLow: 80000,
    typicalPriceHigh: 600000,
    notes: 'Membership contracts and equipment value considered.'
  },
  'Automotive': {
    ebitdaAvg: 2.3,
    ebitdaLow: 1.5,
    ebitdaHigh: 3.2,
    revenueAvg: 0.3,
    typicalPriceLow: 100000,
    typicalPriceHigh: 1000000,
    notes: 'Workshop equipment and franchise agreements important.'
  },
  'Wholesale / Distribution': {
    ebitdaAvg: 2.9,
    ebitdaLow: 2.0,
    ebitdaHigh: 3.8,
    revenueAvg: 0.5,
    typicalPriceLow: 150000,
    typicalPriceHigh: 2000000,
    notes: 'Exclusive distribution rights and customer relationships add value.'
  },
  'Other': {
    ebitdaAvg: 2.2,
    ebitdaLow: 1.4,
    ebitdaHigh: 3.0,
    revenueAvg: 0.35,
    typicalPriceLow: 50000,
    typicalPriceHigh: 500000,
    notes: 'Varies significantly by specific business type.'
  }
};

// State economic factors
const STATE_FACTORS: Record<string, number> = {
  'NSW': 1.05,
  'VIC': 1.03,
  'QLD': 1.00,
  'WA': 1.02,
  'SA': 0.95,
  'TAS': 0.92,
  'NT': 0.90,
  'ACT': 1.02
};

// Years in business factor
function getYearsFactor(years: number): number {
  if (years < 2) return 0.75;
  if (years < 3) return 0.85;
  if (years < 5) return 0.95;
  if (years < 10) return 1.0;
  if (years < 20) return 1.05;
  return 1.1;
}

// Profit margin quality factor
function getProfitMarginFactor(revenue: number, profit: number, industry: string): number {
  const margin = (profit / revenue) * 100;
  
  // Industry-specific margin expectations
  const isHospitality = ['Coffee Shop', 'Cafe', 'Restaurant', 'Fine Dining Restaurant', 
    'Pub / Bar / Tavern', 'Fast Food / Takeaway', 'Fish & Chips / Chicken Shop',
    'Bakery', 'Catering', 'Hotel / Motel'].includes(industry);
  
  if (isHospitality) {
    // Hospitality typically has lower margins (15-25% is good)
    if (margin < 10) return 0.85;
    if (margin < 15) return 0.95;
    if (margin < 25) return 1.0;
    if (margin < 35) return 1.05;
    return 1.1;
  } else {
    // Other businesses expect higher margins
    if (margin < 10) return 0.8;
    if (margin < 15) return 0.9;
    if (margin < 25) return 1.0;
    if (margin < 35) return 1.05;
    return 1.1;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      industry, 
      annualRevenue, 
      annualProfit,
      yearsOperating, 
      state,
      employees,
      ownerOperated = true
    } = body;

    if (!industry || !annualRevenue || !annualProfit) {
      return NextResponse.json(
        { error: 'Missing required fields: industry, annualRevenue, annualProfit' },
        { status: 400 }
      );
    }

    const revenue = parseFloat(annualRevenue);
    const profit = parseFloat(annualProfit);
    const years = parseInt(yearsOperating) || 3;
    const stateKey = state?.toUpperCase() || 'QLD';

    const multiples = INDUSTRY_MULTIPLES[industry] || INDUSTRY_MULTIPLES['Other'];
    
    const stateFactor = STATE_FACTORS[stateKey] || 1.0;
    const yearsFactor = getYearsFactor(years);
    const marginFactor = getProfitMarginFactor(revenue, profit, industry);
    const managementFactor = ownerOperated ? 1.0 : 1.1;
    
    // Quality adjustment (average of factors)
    const qualityScore = (stateFactor + yearsFactor + marginFactor + managementFactor) / 4;
    
    // Calculate price range
    const rawLow = profit * multiples.ebitdaLow * qualityScore;
    const rawHigh = profit * multiples.ebitdaHigh * qualityScore;
    const rawMid = profit * multiples.ebitdaAvg * qualityScore;
    
    // Round to sensible numbers
    const lowPrice = Math.round(rawLow / 5000) * 5000;
    const highPrice = Math.round(rawHigh / 5000) * 5000;
    const midPrice = Math.round(rawMid / 5000) * 5000;

    // Revenue-based cross-check
    const revenueBasedPrice = Math.round(revenue * multiples.revenueAvg / 5000) * 5000;

    // Confidence level
    let confidence = 'Medium';
    let confidenceNotes: string[] = [];
    
    if (years >= 5 && revenue > 500000 && profit > 80000) {
      confidence = 'High';
      confidenceNotes.push('Established business with strong financials');
    } else if (years < 2) {
      confidence = 'Low';
      confidenceNotes.push('Limited trading history increases uncertainty');
    }
    
    if (profit < 50000) {
      confidence = 'Low';
      confidenceNotes.push('Low profit makes price estimates less reliable');
    }

    // Price reasonableness check
    if (midPrice < multiples.typicalPriceLow * 0.5 || midPrice > multiples.typicalPriceHigh * 2) {
      confidenceNotes.push('Estimate outside typical range for this category');
    }

    // Build factors explanation
    const factors: string[] = [];
    
    if (stateFactor > 1.01) {
      factors.push(`${stateKey} market premium (+${Math.round((stateFactor - 1) * 100)}%)`);
    } else if (stateFactor < 0.99) {
      factors.push(`${stateKey} market adjustment (${Math.round((stateFactor - 1) * 100)}%)`);
    }
    
    if (yearsFactor >= 1.05) {
      factors.push(`Established business (${years}+ years)`);
    } else if (yearsFactor < 0.9) {
      factors.push(`Early-stage business (${years} years)`);
    }
    
    const margin = (profit / revenue) * 100;
    if (marginFactor > 1.03) {
      factors.push(`Strong profit margins (${margin.toFixed(0)}%)`);
    } else if (marginFactor < 0.95) {
      factors.push(`Below-average margins (${margin.toFixed(0)}%)`);
    }

    if (!ownerOperated) {
      factors.push('Manager in place (turnkey business)');
    }

    const result = {
      priceRange: {
        low: lowPrice,
        mid: midPrice,
        high: highPrice
      },
      revenueBasedEstimate: revenueBasedPrice,
      typicalRange: {
        low: multiples.typicalPriceLow,
        high: multiples.typicalPriceHigh
      },
      multiples: {
        ebitdaLow: multiples.ebitdaLow,
        ebitdaAvg: multiples.ebitdaAvg,
        ebitdaHigh: multiples.ebitdaHigh,
        revenueMultiple: multiples.revenueAvg,
        applied: {
          low: Math.round(multiples.ebitdaLow * qualityScore * 100) / 100,
          high: Math.round(multiples.ebitdaHigh * qualityScore * 100) / 100
        }
      },
      confidence,
      confidenceNotes,
      methodology: 'EBITDA Multiple',
      dataSource: 'Australian market transaction data',
      factors,
      industryInsights: multiples.notes,
      inputs: {
        industry,
        annualRevenue: revenue,
        annualProfit: profit,
        yearsOperating: years,
        state: stateKey,
        profitMargin: Math.round(margin * 10) / 10,
        ownerOperated
      },
      disclaimer: 'This Price Guide provides an indicative range based on Australian market transaction data and is not a formal valuation or appraisal. Actual sale prices depend on buyer demand, negotiation, assets included, lease terms, and market conditions. We recommend consulting a qualified professional advisor for important decisions.',
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Price guide error:', error);
    return NextResponse.json(
      { error: 'Failed to generate price guide' },
      { status: 500 }
    );
  }
}
