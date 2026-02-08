import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateAccessCode(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Grant access to a buyer
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: memoId } = await params;
    const { buyerName, buyerEmail, expiresInDays, mobile, address, company } = await req.json();

    if (!buyerName || !buyerEmail) {
      return NextResponse.json({ error: 'Buyer name and email required' }, { status: 400 });
    }

    const memo = await prisma.infoMemo.findFirst({
      where: { id: memoId, business: { user: { email: session.user.email } } },
      include: { business: true }
    });

    if (!memo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    // Create a prospect for this buyer
    const prospect = await prisma.prospect.create({
      data: {
        businessId: memo.businessId,
        name: buyerName,
        email: buyerEmail,
        mobile: mobile || null,
        address: address || null,
        company: company || null,
        source: 'deal_room',
        status: 'NEW',
      }
    });

    const accessCode = generateAccessCode();
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const access = await prisma.memoAccess.create({
      data: { 
        memoId, 
        buyerName, 
        buyerEmail, 
        accessCode, 
        expiresAt,
        prospectId: prospect.id
      },
    });

    const accessUrl = `${process.env.NEXTAUTH_URL}/memo/${accessCode}`;

    return NextResponse.json({ access, accessUrl, prospect });
  } catch (error) {
    console.error('Grant access error:', error);
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
  }
}

// Get access codes
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: memoId } = await params;

    const accessCodes = await prisma.memoAccess.findMany({
      where: { memoId, memo: { business: { user: { email: session.user.email } } } },
      orderBy: { createdAt: 'desc' },
      include: {
        prospect: {
          include: { notes_list: { orderBy: { createdAt: 'desc' } } }
        }
      }
    });

    return NextResponse.json({ accessCodes });
  } catch (error) {
    console.error('Get access error:', error);
    return NextResponse.json({ error: 'Failed to get access codes' }, { status: 500 });
  }
}

// Revoke access
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: memoId } = await params;
    const { accessId } = await req.json();

    await prisma.memoAccess.updateMany({
      where: { id: accessId, memoId, memo: { business: { user: { email: session.user.email } } } },
      data: { isRevoked: true },
    });

    return NextResponse.json({ message: 'Access revoked' });
  } catch (error) {
    console.error('Revoke access error:', error);
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 });
  }
}

// Update access tier or buyer details
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: memoId } = await params;
    const { accessId, tier, buyerName, buyerEmail, mobile, address, company, noteContent } = await req.json();

    // Verify ownership
    const access = await prisma.memoAccess.findFirst({
      where: { id: accessId, memoId, memo: { business: { user: { email: session.user.email } } } },
      include: { prospect: true }
    });

    if (!access) {
      return NextResponse.json({ error: 'Access not found' }, { status: 404 });
    }

    // Update access tier if provided
    if (tier) {
      await prisma.memoAccess.update({
        where: { id: accessId },
        data: { tier, buyerName: buyerName || access.buyerName, buyerEmail: buyerEmail || access.buyerEmail }
      });
    }

    // Update buyer details on MemoAccess
    if (buyerName || buyerEmail) {
      await prisma.memoAccess.update({
        where: { id: accessId },
        data: { 
          ...(buyerName && { buyerName }),
          ...(buyerEmail && { buyerEmail })
        }
      });
    }

    // Update prospect if linked
    if (access.prospectId) {
      await prisma.prospect.update({
        where: { id: access.prospectId },
        data: {
          ...(buyerName && { name: buyerName }),
          ...(buyerEmail && { email: buyerEmail }),
          ...(mobile !== undefined && { mobile }),
          ...(address !== undefined && { address }),
          ...(company !== undefined && { company }),
        }
      });

      // Add note if provided
      if (noteContent?.trim()) {
        await prisma.prospectNote.create({
          data: {
            prospectId: access.prospectId,
            content: noteContent.trim()
          }
        });
      }
    }

    return NextResponse.json({ message: 'Updated' });
  } catch (error) {
    console.error('Update access error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
