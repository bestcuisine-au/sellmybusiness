import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SECTIONS: Record<string, { title: string; order: number; tier: number; prompt: (data: any) => string }> = {
  executive_summary: {
    title: 'Executive Summary',
    order: 1,
    tier: 1,
    prompt: (d) => `Write a compelling Executive Summary (3-4 paragraphs) for this business sale:
Business: ${d.businessName} (${d.tradingName || 'N/A'})
Industry: ${d.industryCategory || d.industry}
Location: ${d.suburb || d.location}, ${d.state}
Established: ${d.established || 'N/A'}
Asking Price: ${d.askingPrice ? '$' + Number(d.askingPrice).toLocaleString() : 'POA'}
Annual Revenue: ${d.revenueCurrent || d.annualRevenue ? '$' + Number(d.revenueCurrent || d.annualRevenue).toLocaleString() : 'Available under NDA'}
EBITDA: ${d.ebitdaCurrent || d.annualProfit ? '$' + Number(d.ebitdaCurrent || d.annualProfit).toLocaleString() : 'Available under NDA'}
Reason for Sale: ${d.reasonForSale || 'Not specified'}
Write professional, engaging summary. Australian English. Don't invent facts.`
  },
  business_overview: {
    title: 'Business Overview',
    order: 2,
    tier: 1,
    prompt: (d) => `Write a Business Overview section:
Business: ${d.businessName}, ABN: ${d.abn || 'Available on request'}
Entity: ${d.entityType || 'Not specified'}, Established: ${d.established || 'Not specified'}
Industry: ${d.industryCategory || d.industry}
Location: ${d.suburb || d.location}, ${d.state} ${d.postcode || ''}
Location Type: ${d.locationType || 'Not specified'}, Size: ${d.premisesSqm ? d.premisesSqm + ' sqm' : 'Not specified'}
Lease: ${d.leaseRemainingYrs ? d.leaseRemainingYrs + ' years remaining' : 'Not specified'}, Rent: ${d.rentPerAnnum ? '$' + Number(d.rentPerAnnum).toLocaleString() + ' p.a.' : 'Not specified'}
Operating Hours: ${d.operatingHours || 'Not specified'}
Write 2-3 paragraphs. Australian English.`
  },
  financial_performance: {
    title: 'Financial Performance',
    order: 3,
    tier: 2,
    prompt: (d) => `Write a Financial Performance section:
CURRENT: Revenue ${d.revenueCurrent ? '$' + Number(d.revenueCurrent).toLocaleString() : 'N/A'}, EBITDA ${d.ebitdaCurrent ? '$' + Number(d.ebitdaCurrent).toLocaleString() : 'N/A'}
PRIOR: Revenue ${d.revenuePrior ? '$' + Number(d.revenuePrior).toLocaleString() : 'N/A'}, EBITDA ${d.ebitdaPrior ? '$' + Number(d.ebitdaPrior).toLocaleString() : 'N/A'}
Owner Salary: ${d.ownerSalary ? '$' + Number(d.ownerSalary).toLocaleString() : 'N/A'}
Add-backs: ${d.addBacks || 'None noted'}
Adjusted Earnings: ${d.adjustedEarnings ? '$' + Number(d.adjustedEarnings).toLocaleString() : 'N/A'}
Customer concentration: ${d.topCustomerPct ? 'Top customer = ' + d.topCustomerPct + '%' : 'Diversified'}
Write professional analysis. Only use provided numbers. Australian English.`
  },
  operations: {
    title: 'Operations & Systems',
    order: 4,
    tier: 1,
    prompt: (d) => `Write Operations section:
Hours: ${d.operatingHours || 'Not specified'}, Days: ${d.daysPerWeek || 'N/A'}
POS: ${d.posSystem || 'N/A'}, Accounting: ${d.accountingSoftware || 'N/A'}
Key Suppliers: ${d.keySuppliers || 'Not specified'}
Documented processes: ${d.documentedProcesses ? 'Yes' : 'No'}
Write 2 paragraphs. Australian English.`
  },
  team_structure: {
    title: 'Team & Management',
    order: 5,
    tier: 1,
    prompt: (d) => `Write Team section:
Staff: FT ${d.ftEmployees || 0}, PT ${d.ptEmployees || 0}, Casual ${d.casualEmployees || 0}
Key roles: ${d.keyRoles || 'Not specified'}
Owner hours/week: ${d.ownerHoursPerWeek || 'N/A'}
Manager in place: ${d.managerInPlace ? 'Yes - fully managed' : 'No - owner operated'}
Training: ${d.trainingPeriod || 'Negotiable'}
Australian English.`
  },
  assets_included: {
    title: 'Assets Included',
    order: 6,
    tier: 1,
    prompt: (d) => `Write Assets section:
FFE Value: ${d.ffeMktValue ? '$' + Number(d.ffeMktValue).toLocaleString() : 'Included'}
Stock: ${d.stockAtValue ? '$' + Number(d.stockAtValue).toLocaleString() : 'At valuation'}, Included: ${d.stockIncluded ? 'Yes' : 'Additional'}
Vehicles: ${d.vehiclesIncluded || 'None'}
IP: ${d.ipIncluded || 'Business name, goodwill, customer database'}
Licenses: ${d.licensesRequired || 'Standard registrations'}
Australian English.`
  },
  growth_opportunity: {
    title: 'Growth & Opportunity',
    order: 7,
    tier: 1,
    prompt: (d) => `Write Growth section:
Advantages: ${d.competitiveAdvantages || 'Not specified'}
Opportunities: ${d.growthOpportunities || 'Not specified'}
Recent improvements: ${d.recentImprovements || 'N/A'}
Challenges: ${d.challengesToNote || 'None noted'}
Ideal buyer: ${d.idealBuyer || 'Motivated entrepreneur'}
Be positive but honest. Australian English.`
  },
  investment_summary: {
    title: 'Investment Summary',
    order: 8,
    tier: 1,
    prompt: (d) => `Write Investment Summary:
Price: ${d.askingPrice ? '$' + Number(d.askingPrice).toLocaleString() : 'POA'}
Stock included: ${d.priceInclStock ? 'Yes' : 'Additional'}
Training: ${d.trainingPeriod || 'Negotiable'}
Revenue: ${d.revenueCurrent || d.annualRevenue ? '$' + Number(d.revenueCurrent || d.annualRevenue).toLocaleString() : 'Under NDA'}
EBITDA: ${d.ebitdaCurrent || d.annualProfit ? '$' + Number(d.ebitdaCurrent || d.annualProfit).toLocaleString() : 'Under NDA'}
Reason: ${d.reasonForSale || 'Not specified'}
Write compelling closing with call to action. Australian English.`
  }
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { businessId, sectionKey } = await req.json();
    if (!businessId || !sectionKey) return NextResponse.json({ error: 'Business ID and section required' }, { status: 400 });
    const sectionDef = SECTIONS[sectionKey];
    if (!sectionDef) return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    const business = await prisma.business.findUnique({ where: { id: businessId }, include: { memoData: true, infoMemo: true } });
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || business.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = { ...business, ...(business.memoData || {}) };
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert Australian business broker writing Information Memorandums. Professional but engaging. Do not invent facts.' },
        { role: 'user', content: sectionDef.prompt(data) }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('Generation failed');
    let memo = business.infoMemo;
    if (!memo) memo = await prisma.infoMemo.create({ data: { businessId, content: '' } });
    const section = await prisma.infoMemoSection.upsert({
      where: { memoId_sectionKey: { memoId: memo.id, sectionKey } },
      update: { content, generatedAt: new Date(), isLocked: false },
      create: { memoId: memo.id, sectionKey, sectionTitle: sectionDef.title, sortOrder: sectionDef.order, content }
    });
    return NextResponse.json({ section: { id: section.id, sectionKey, title: sectionDef.title, content, tier: sectionDef.tier, isLocked: false }, wordCount: content.split(/\s+/).length });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    const business = await prisma.business.findUnique({ where: { id: businessId }, include: { infoMemo: { include: { sections: { orderBy: { sortOrder: 'asc' } } } } } });
    const existing = business?.infoMemo?.sections || [];
    const sections = Object.entries(SECTIONS).map(([key, def]) => {
      const ex = existing.find((s: any) => s.sectionKey === key);
      return { sectionKey: key, title: def.title, order: def.order, tier: def.tier, content: ex?.content || null, isLocked: ex?.isLocked || false };
    });
    return NextResponse.json({ sections });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
