import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      // Contact info
      name,
      email,
      phone,
      businessName,
      // Business details
      industry,
      state,
      annualRevenue,
      annualProfit,
      yearsOperating,
      ownerOperated,
      // Price guide result
      priceGuideResult,
      // Tracking
      source = 'price_guide',
      utmSource,
      utmMedium,
      utmCampaign
    } = data;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check for existing lead with same email
    const existingLead = await prisma.lead.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    if (existingLead) {
      // Update existing lead with new data
      const lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name,
          phone,
          businessName,
          industry,
          state,
          annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
          annualProfit: annualProfit ? parseFloat(annualProfit) : null,
          yearsOperating: yearsOperating ? parseInt(yearsOperating) : null,
          ownerOperated,
          priceGuideResult,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        message: 'Lead updated',
        leadId: lead.id,
        isNew: false
      });
    }

    // Create new lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        businessName,
        industry,
        state,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        annualProfit: annualProfit ? parseFloat(annualProfit) : null,
        yearsOperating: yearsOperating ? parseInt(yearsOperating) : null,
        ownerOperated,
        priceGuideResult,
        source,
        utmSource,
        utmMedium,
        utmCampaign
      }
    });

    return NextResponse.json({
      message: 'Lead captured',
      leadId: lead.id,
      isNew: true
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}

// Get leads (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const leads = await prisma.lead.findMany({
      where: source ? { source } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ leads, count: leads.length });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: 'Failed to get leads' },
      { status: 500 }
    );
  }
}
