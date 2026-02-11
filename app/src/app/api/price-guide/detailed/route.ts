import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';
import { getServerSession } from 'next-auth';

// Industry multiples (same as basic price guide)
const INDUSTRY_MULTIPLES: Record<string, {
  ebitdaAvg: number;
  ebitdaLow: number;
  ebitdaHigh: number;
  revenueAvg: number;
}> = {
  'Coffee Shop': { ebitdaAvg: 1.3, ebitdaLow: 0.8, ebitdaHigh: 2.0, revenueAvg: 0.2 },
  'Cafe': { ebitdaAvg: 1.8, ebitdaLow: 1.2, ebitdaHigh: 2.8, revenueAvg: 0.3 },
  'Restaurant': { ebitdaAvg: 1.7, ebitdaLow: 1.0, ebitdaHigh: 2.5, revenueAvg: 0.25 },
  'Fine Dining Restaurant': { ebitdaAvg: 2.2, ebitdaLow: 1.5, ebitdaHigh: 3.5, revenueAvg: 0.35 },
  'Pub / Bar / Tavern': { ebitdaAvg: 1.6, ebitdaLow: 1.0, ebitdaHigh: 2.5, revenueAvg: 0.3 },
  'Fast Food / Takeaway': { ebitdaAvg: 1.8, ebitdaLow: 1.0, ebitdaHigh: 2.8, revenueAvg: 0.25 },
  'Fish & Chips / Chicken Shop': { ebitdaAvg: 1.5, ebitdaLow: 0.8, ebitdaHigh: 2.2, revenueAvg: 0.2 },
  'Bakery': { ebitdaAvg: 1.6, ebitdaLow: 1.0, ebitdaHigh: 2.4, revenueAvg: 0.25 },
  'Catering': { ebitdaAvg: 1.4, ebitdaLow: 0.8, ebitdaHigh: 2.0, revenueAvg: 0.3 },
  'Hotel / Motel': { ebitdaAvg: 1.5, ebitdaLow: 0.8, ebitdaHigh: 2.2, revenueAvg: 0.15 },
  'Healthcare & Medical': { ebitdaAvg: 3.3, ebitdaLow: 2.3, ebitdaHigh: 4.3, revenueAvg: 0.6 },
  'Dental Practice': { ebitdaAvg: 3.5, ebitdaLow: 2.5, ebitdaHigh: 4.5, revenueAvg: 0.7 },
  'Medical Practice': { ebitdaAvg: 3.2, ebitdaLow: 2.2, ebitdaHigh: 4.2, revenueAvg: 0.6 },
  'Pharmacy': { ebitdaAvg: 3.0, ebitdaLow: 2.0, ebitdaHigh: 4.0, revenueAvg: 0.4 },
  'Childcare Centre': { ebitdaAvg: 3.6, ebitdaLow: 2.5, ebitdaHigh: 4.7, revenueAvg: 1.1 },
  'Professional Services': { ebitdaAvg: 3.7, ebitdaLow: 2.5, ebitdaHigh: 5.0, revenueAvg: 0.8 },
  'Accounting Practice': { ebitdaAvg: 3.5, ebitdaLow: 2.5, ebitdaHigh: 4.5, revenueAvg: 1.0 },
  'Legal Practice': { ebitdaAvg: 3.2, ebitdaLow: 2.2, ebitdaHigh: 4.2, revenueAvg: 0.7 },
  'Retail Shop': { ebitdaAvg: 2.5, ebitdaLow: 1.5, ebitdaHigh: 3.5, revenueAvg: 0.3 },
  'E-commerce': { ebitdaAvg: 2.8, ebitdaLow: 1.8, ebitdaHigh: 4.0, revenueAvg: 0.4 },
  'Trades & Construction': { ebitdaAvg: 2.8, ebitdaLow: 1.8, ebitdaHigh: 3.8, revenueAvg: 0.4 },
  'Manufacturing': { ebitdaAvg: 2.5, ebitdaLow: 1.8, ebitdaHigh: 3.5, revenueAvg: 0.5 },
  'Transport & Logistics': { ebitdaAvg: 3.2, ebitdaLow: 2.2, ebitdaHigh: 4.2, revenueAvg: 0.8 },
  'Wholesale / Distribution': { ebitdaAvg: 2.9, ebitdaLow: 2.0, ebitdaHigh: 3.8, revenueAvg: 0.5 },
  'Beauty Salon / Hair': { ebitdaAvg: 2.0, ebitdaLow: 1.2, ebitdaHigh: 2.8, revenueAvg: 0.35 },
  'Gym / Fitness': { ebitdaAvg: 2.2, ebitdaLow: 1.4, ebitdaHigh: 3.0, revenueAvg: 0.4 },
  'Automotive': { ebitdaAvg: 2.3, ebitdaLow: 1.5, ebitdaHigh: 3.2, revenueAvg: 0.3 },
  'Other': { ebitdaAvg: 2.2, ebitdaLow: 1.4, ebitdaHigh: 3.0, revenueAvg: 0.35 }
};

const STATE_FACTORS: Record<string, number> = {
  'NSW': 1.05, 'VIC': 1.03, 'QLD': 1.00, 'WA': 1.02,
  'SA': 0.95, 'TAS': 0.92, 'NT': 0.90, 'ACT': 1.02
};

export async function POST(req: NextRequest) {
  try {

    // Rate limiting: 10 requests per minute per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const rateLimitResult = checkRateLimit(`price-guide:${ip}`, 10, 60000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          resetIn: Math.ceil(rateLimitResult.resetIn / 1000) 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + rateLimitResult.resetIn / 1000))
          }
        }
      );
    }
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      // Basic
      industry,
      annualRevenue,
      annualProfit,
      yearsOperating,
      state,
      // Assets
      plantEquipment,
      stockInventory,
      // Structure
      isFranchise,
      franchiseBrand,
      franchiseFee,
      ownerOperated,
      employeesFT,
      employeesPT,
      // Lease
      hasLease,
      leaseYearsRemaining,
      monthlyRent,
      // Licenses
      hasLiquorLicense,
      hasGamingLicense,
      // Other
      reasonForSale
    } = body;

    if (!industry || !annualRevenue || !annualProfit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const revenue = parseFloat(annualRevenue);
    const profit = parseFloat(annualProfit);
    const years = parseInt(yearsOperating) || 3;
    const stateKey = state?.toUpperCase() || 'QLD';
    const pe = parseFloat(plantEquipment) || 0;
    const stock = parseFloat(stockInventory) || 0;
    const leaseYears = parseFloat(leaseYearsRemaining) || 0;
    const rent = parseFloat(monthlyRent) || 0;
    const ftEmployees = parseInt(employeesFT) || 0;
    const ptEmployees = parseInt(employeesPT) || 0;

    const multiples = INDUSTRY_MULTIPLES[industry] || INDUSTRY_MULTIPLES['Other'];
    const factors: string[] = [];
    const confidenceNotes: string[] = [];

    // Base quality score
    let qualityScore = 1.0;

    // State factor
    const stateFactor = STATE_FACTORS[stateKey] || 1.0;
    qualityScore *= stateFactor;
    if (stateFactor > 1.01) factors.push(`${stateKey} market premium (+${Math.round((stateFactor - 1) * 100)}%)`);
    if (stateFactor < 0.99) factors.push(`${stateKey} market adjustment (${Math.round((stateFactor - 1) * 100)}%)`);

    // Years factor
    let yearsFactor = 1.0;
    if (years < 2) { yearsFactor = 0.75; factors.push('Early-stage business (<2 years) - higher risk'); }
    else if (years < 3) { yearsFactor = 0.85; factors.push('Developing business (2-3 years)'); }
    else if (years < 5) { yearsFactor = 0.95; }
    else if (years >= 10) { yearsFactor = 1.1; factors.push(`Established business (${years} years) premium`); }
    else if (years >= 5) { yearsFactor = 1.05; factors.push('Proven track record (5+ years)'); }
    qualityScore *= yearsFactor;

    // Management factor
    if (!ownerOperated) {
      qualityScore *= 1.15;
      factors.push('Manager in place - turnkey operation (+15%)');
    }

    // Lease factor
    if (hasLease) {
      if (leaseYears >= 5) {
        qualityScore *= 1.1;
        factors.push(`Strong lease position (${leaseYears} years remaining)`);
      } else if (leaseYears < 2) {
        qualityScore *= 0.85;
        factors.push(`Short lease term (${leaseYears} years) - risk factor`);
        confidenceNotes.push('Short lease term may impact buyer interest');
      }
      
      // Rent as % of revenue (occupancy cost)
      if (rent > 0 && revenue > 0) {
        const annualRent = rent * 12;
        const rentRatio = (annualRent / revenue) * 100;
        if (rentRatio > 15) {
          qualityScore *= 0.95;
          factors.push(`High rent ratio (${rentRatio.toFixed(0)}% of revenue)`);
        } else if (rentRatio < 8) {
          qualityScore *= 1.05;
          factors.push(`Favorable rent ratio (${rentRatio.toFixed(0)}% of revenue)`);
        }
      }
    }

    // Franchise factor
    if (isFranchise) {
      if (franchiseBrand) {
        factors.push(`Franchise: ${franchiseBrand}`);
        // Well-known franchises often command slight premium
        qualityScore *= 1.05;
      }
      if (franchiseFee) {
        const fee = parseFloat(franchiseFee);
        if (fee > profit * 0.1) {
          factors.push('Note: High franchise fees impact net earnings');
        }
      }
    }

    // License premiums
    if (hasLiquorLicense) {
      qualityScore *= 1.1;
      factors.push('Liquor license included (+10%)');
    }
    if (hasGamingLicense) {
      qualityScore *= 1.15;
      factors.push('Gaming license included (+15%)');
    }

    // Staff factor
    const totalStaff = ftEmployees + (ptEmployees * 0.5);
    if (totalStaff > 0) {
      factors.push(`Staff: ${ftEmployees} FT, ${ptEmployees} PT/Casual`);
      // Businesses with good staff levels are easier to run
      if (totalStaff >= 5 && !ownerOperated) {
        factors.push('Established team - reduces buyer workload');
      }
    }

    // Margin factor
    const margin = (profit / revenue) * 100;
    if (margin > 25) {
      qualityScore *= 1.08;
      factors.push(`Excellent profit margins (${margin.toFixed(0)}%)`);
    } else if (margin < 10) {
      qualityScore *= 0.92;
      factors.push(`Below-average margins (${margin.toFixed(0)}%)`);
      confidenceNotes.push('Low margins may limit buyer interest');
    }

    // Reason for sale impact
    if (reasonForSale === 'health' || reasonForSale === 'burnout') {
      factors.push('Motivated seller - potential for negotiation');
    } else if (reasonForSale === 'retirement') {
      factors.push('Retirement sale - typical succession opportunity');
    }

    // Calculate goodwill (price minus tangible assets)
    const goodwillLow = Math.max(0, profit * multiples.ebitdaLow * qualityScore - pe - stock);
    const goodwillHigh = Math.max(0, profit * multiples.ebitdaHigh * qualityScore - pe - stock);

    // Calculate total price
    const baseLow = profit * multiples.ebitdaLow * qualityScore;
    const baseHigh = profit * multiples.ebitdaHigh * qualityScore;
    const baseMid = profit * multiples.ebitdaAvg * qualityScore;

    // Add tangible assets
    const totalLow = Math.round((baseLow + pe + stock) / 5000) * 5000;
    const totalHigh = Math.round((baseHigh + pe + stock) / 5000) * 5000;
    const totalMid = Math.round((baseMid + pe + stock) / 5000) * 5000;

    // Confidence assessment
    let confidence = 'Medium';
    if (years >= 5 && revenue > 500000 && profit > 100000 && leaseYears >= 3) {
      confidence = 'High';
      confidenceNotes.push('Strong fundamentals support this estimate');
    } else if (years < 2 || profit < 50000 || leaseYears < 1) {
      confidence = 'Low';
    }

    const result = {
      priceRange: {
        low: totalLow,
        mid: totalMid,
        high: totalHigh
      },
      assetBreakdown: {
        goodwill: {
          low: Math.round(goodwillLow / 1000) * 1000,
          high: Math.round(goodwillHigh / 1000) * 1000
        },
        plantEquipment: pe,
        stock: stock,
        other: 0
      },
      multiples: {
        base: { low: multiples.ebitdaLow, high: multiples.ebitdaHigh },
        applied: {
          low: Math.round(multiples.ebitdaLow * qualityScore * 100) / 100,
          high: Math.round(multiples.ebitdaHigh * qualityScore * 100) / 100
        }
      },
      confidence,
      confidenceNotes,
      methodology: 'EBITDA Multiple with Asset Adjustment',
      factors,
      industryInsights: `Based on ${industry} market data. Actual sale prices vary based on specific circumstances.`,
      comparableNote: 'For best results, compare with 8-10 similar business sales in your area.',
      inputs: {
        industry,
        annualRevenue: revenue,
        annualProfit: profit,
        yearsOperating: years,
        state: stateKey,
        profitMargin: Math.round(margin * 10) / 10,
        plantEquipment: pe,
        stock: stock,
        isFranchise,
        ownerOperated,
        leaseYearsRemaining: leaseYears,
        hasLiquorLicense,
        hasGamingLicense
      },
      disclaimer: 'This detailed estimate is based on information provided and Australian market transaction data. It is not a formal business valuation. Actual sale prices depend on buyer demand, negotiation, due diligence findings, and market conditions. For significant decisions, consult a qualified business broker or valuator.',
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Detailed price guide error:', error);
    return NextResponse.json(
      { error: 'Failed to generate detailed estimate' },
      { status: 500 }
    );
  }
}
