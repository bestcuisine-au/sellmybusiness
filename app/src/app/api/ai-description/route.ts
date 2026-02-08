import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      businessName, 
      industry, 
      location, 
      state,
      annualRevenue, 
      annualProfit, 
      employees,
      yearsOperating,
      highlights,
      reasonForSale 
    } = await req.json();

    if (!businessName || !industry) {
      return NextResponse.json({ error: 'Business name and industry required' }, { status: 400 });
    }

    const prompt = `You are an expert business copywriter specializing in business-for-sale listings in Australia. 
Write a compelling, professional listing description for this business. 

Business Details:
- Name: ${businessName}
- Industry: ${industry}
- Location: ${location}, ${state}
- Annual Revenue: $${annualRevenue?.toLocaleString() || 'Not disclosed'}
- Annual Profit: $${annualProfit?.toLocaleString() || 'Not disclosed'}
- Employees: ${employees || 'Not specified'}
- Years Operating: ${yearsOperating || 'Not specified'}
- Key Highlights: ${highlights || 'None specified'}
- Reason for Sale: ${reasonForSale || 'Not specified'}

Requirements:
1. Write 3-4 paragraphs (200-300 words total)
2. Lead with the strongest selling points
3. Highlight growth opportunities
4. Use professional but engaging language
5. Include a call to action
6. DO NOT make up specific numbers or claims not provided
7. Use Australian English spelling

Return ONLY the description text, no headers or labels.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const description = completion.choices[0]?.message?.content?.trim();

    if (!description) {
      throw new Error('Failed to generate description');
    }

    return NextResponse.json({ 
      description,
      wordCount: description.split(/\s+/).length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Description error:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
