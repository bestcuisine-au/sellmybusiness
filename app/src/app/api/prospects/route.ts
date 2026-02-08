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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ prospects });
  } catch (error) {
    console.error('Get prospects error:', error);
    return NextResponse.json({ error: 'Failed to get prospects' }, { status: 500 });
  }
}

// Update prospect status/notes
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prospectId, status, notes, ndaStatus } = await req.json();

    const updated = await prisma.prospect.updateMany({
      where: {
        id: prospectId,
        business: { user: { email: session.user.email } },
      },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(ndaStatus && { 
          ndaStatus,
          ...(ndaStatus === 'SIGNED' && { ndaSignedAt: new Date() }),
        }),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Prospect updated' });
  } catch (error) {
    console.error('Update prospect error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
