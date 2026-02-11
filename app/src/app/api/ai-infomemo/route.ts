import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rateLimiter';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limiting: 10 requests per minute per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const rateLimitResult = checkRateLimit(`ai-infomemo:${ip}`, 10, 60000);
    
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
    }

    const data = await req.json();
    const { 
      businessName, 
      industry, 
      location, 
      state,
      annualRevenue, 
      annualProfit, 
      employees,
      yearsOperating,
      description,
      highlights,
      reasonForSale,
      assets,
      leaseDetails,
      operatingHours,
      competitiveAdvantages
    } = data;

    if (!businessName || !industry) {
      return NextResponse.json({ error: 'Business name and industry required' }, { status: 400 });
    }

    const prompt = `You are an expert business broker creating a professional Information Memorandum for a business sale in Australia.

Create a comprehensive Information Memorandum with the following sections:

BUSINESS DETAILS:
- Name: ${businessName}
- Industry: ${industry}
- Location: ${location}, ${state}
- Years Operating: ${yearsOperating || 'Not specified'}
- Employees: ${employees || 'Not specified'}

FINANCIAL SUMMARY:
- Annual Revenue: $${annualRevenue?.toLocaleString() || 'Available on request'}
- Annual Profit (EBITDA): $${annualProfit?.toLocaleString() || 'Available on request'}

ADDITIONAL INFO:
- Description: ${description || 'Not provided'}
- Key Highlights: ${highlights || 'Not provided'}
- Reason for Sale: ${reasonForSale || 'Not provided'}
- Assets Included: ${assets || 'To be confirmed'}
- Lease Details: ${leaseDetails || 'To be confirmed'}
- Operating Hours: ${operatingHours || 'Not specified'}
- Competitive Advantages: ${competitiveAdvantages || 'Not specified'}

Create a professional Information Memorandum with these sections:
1. EXECUTIVE SUMMARY (2-3 paragraphs)
2. BUSINESS OVERVIEW
3. FINANCIAL HIGHLIGHTS (use placeholder text like "[Financial details available under NDA]" if not provided)
4. OPERATIONS
5. GROWTH OPPORTUNITIES
6. REASON FOR SALE
7. THE OPPORTUNITY

Format with clear headings using ## for main sections.
Use Australian English spelling.
Be professional but engaging.
DO NOT invent specific numbers or make claims not supported by the data.
Mark sensitive financial details as "Available under NDA" if specific figures aren't provided.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const memo = completion.choices[0]?.message?.content?.trim();

    if (!memo) {
      throw new Error('Failed to generate info memo');
    }

    return NextResponse.json({ 
      infoMemo: memo,
      sections: memo.split('##').length - 1,
      wordCount: memo.split(/\s+/).length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Info Memo error:', error);
    return NextResponse.json({ error: 'Failed to generate info memo' }, { status: 500 });
  }
}
