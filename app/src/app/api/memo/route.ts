import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = await req.json();

    const business = await prisma.business.findFirst({
      where: { id: businessId, user: { email: session.user.email } },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const prompt = `Create a professional Information Memorandum for this business sale:

Business: ${business.name}
Industry: ${business.industry}
Location: ${business.location}, ${business.state}
Revenue: $${business.annualRevenue?.toNumber().toLocaleString() || 'Not disclosed'}
Profit: $${business.annualProfit?.toNumber().toLocaleString() || 'Not disclosed'}
Employees: ${business.employees || 'Not specified'}
Description: ${business.description || 'Not provided'}
Reason for Sale: ${business.reasonForSale || 'Not specified'}

Create sections:
1. EXECUTIVE SUMMARY
2. BUSINESS OVERVIEW  
3. FINANCIAL PERFORMANCE
4. OPERATIONS & TEAM
5. GROWTH OPPORTUNITIES
6. ASSETS INCLUDED
7. INVESTMENT HIGHLIGHTS

Use markdown formatting. Be professional. Use Australian English.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = completion.choices[0]?.message?.content || '';

    const memo = await prisma.infoMemo.upsert({
      where: { businessId },
      create: { businessId, content, isPublished: true },
      update: { content, updatedAt: new Date() },
    });

    return NextResponse.json({ memo });
  } catch (error) {
    console.error('Memo generation error:', error);
    return NextResponse.json({ error: 'Failed to generate memo' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const memo = await prisma.infoMemo.findFirst({
      where: { 
        businessId,
        business: { user: { email: session.user.email } }
      },
      include: {
        accessCodes: {
          where: { isRevoked: false },
          orderBy: { createdAt: 'desc' },
          include: {
            prospect: {
              include: {
                notes_list: { orderBy: { createdAt: 'desc' } }
              }
            }
          }
        },
      },
    });

    return NextResponse.json({ memo });
  } catch (error) {
    console.error('Get memo error:', error);
    return NextResponse.json({ error: 'Failed to get memo' }, { status: 500 });
  }
}
