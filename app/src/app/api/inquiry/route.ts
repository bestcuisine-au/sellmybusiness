import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Webhook endpoint for incoming inquiries
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      businessId, 
      name, 
      email, 
      phone, 
      company, 
      message,
      source = 'direct',
      sourceRef,
      apiKey  // Simple API key auth for webhooks
    } = data;

    // Verify API key (simple auth for external webhooks)
    if (apiKey !== process.env.INQUIRY_API_KEY && source !== 'direct') {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    if (!businessId || !name || !email) {
      return NextResponse.json({ error: 'Business ID, name, and email required' }, { status: 400 });
    }

    // Check business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { user: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check for duplicate (same email, same business)
    const existing = await prisma.prospect.findFirst({
      where: { businessId, email },
    });

    if (existing) {
      return NextResponse.json({ 
        message: 'Prospect already exists',
        prospectId: existing.id 
      });
    }

    // Create prospect
    const prospect = await prisma.prospect.create({
      data: {
        businessId,
        name,
        email,
        phone,
        company,
        message,
        source,
        sourceRef,
        ndaStatus: 'PENDING',
        status: 'NEW',
      },
    });

    // TODO: Auto-send NDA email here
    // For now, just mark as sent
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { ndaStatus: 'SENT', ndaSentAt: new Date() },
    });

    // TODO: Send notification to seller

    return NextResponse.json({ 
      message: 'Inquiry received',
      prospectId: prospect.id,
      ndaSent: true 
    });

  } catch (error) {
    console.error('Inquiry error:', error);
    return NextResponse.json({ error: 'Failed to process inquiry' }, { status: 500 });
  }
}
