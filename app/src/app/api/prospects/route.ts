import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all prospects for seller's businesses
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    const prospects = await prisma.prospect.findMany({
      where: {
        business: { user: { email: session.user.email } },
        ...(businessId && { businessId }),
      },
      include: {
        business: { select: { name: true } },
        memoAccess: { select: { tier: true, viewCount: true } },
        notes_list: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ prospects });
  } catch (error) {
    console.error('Get prospects error:', error);
    return NextResponse.json({ error: 'Failed to get prospects' }, { status: 500 });
  }
}

// Update prospect 
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prospectId, status, ndaStatus, mobile, address, phone, name, email, company } = await req.json();

    // Verify ownership
    const prospect = await prisma.prospect.findFirst({
      where: {
        id: prospectId,
        business: { user: { email: session.user.email } },
      },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const updated = await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        ...(status && { status }),
        ...(mobile !== undefined && { mobile }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(company !== undefined && { company }),
        ...(ndaStatus && { 
          ndaStatus,
          ...(ndaStatus === 'SIGNED' && { ndaSignedAt: new Date() }),
        }),
      },
    });

    return NextResponse.json({ message: 'Prospect updated', prospect: updated });
  } catch (error) {
    console.error('Update prospect error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// Add a note to a prospect
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prospectId, content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Note content required' }, { status: 400 });
    }

    // Verify ownership
    const prospect = await prisma.prospect.findFirst({
      where: {
        id: prospectId,
        business: { user: { email: session.user.email } },
      },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const note = await prisma.prospectNote.create({
      data: {
        prospectId,
        content: content.trim(),
      },
    });

    return NextResponse.json({ message: 'Note added', note });
  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
