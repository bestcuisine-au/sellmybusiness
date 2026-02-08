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
    const { buyerName, buyerEmail, expiresInDays } = await req.json();

    if (!buyerName || !buyerEmail) {
      return NextResponse.json({ error: 'Buyer name and email required' }, { status: 400 });
    }

    const memo = await prisma.infoMemo.findFirst({
      where: { id: memoId, business: { user: { email: session.user.email } } },
    });

    if (!memo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    const accessCode = generateAccessCode();
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const access = await prisma.memoAccess.create({
      data: { memoId, buyerName, buyerEmail, accessCode, expiresAt },
    });

    const accessUrl = `${process.env.NEXTAUTH_URL}/memo/${accessCode}`;

    return NextResponse.json({ access, accessUrl });
  } catch (error) {
    console.error('Grant access error:', error);
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
  }
}

// Get all access codes for a memo
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

    const access = await prisma.memoAccess.updateMany({
      where: {
        id: accessId,
        memoId,
        memo: { business: { user: { email: session.user.email } } },
      },
      data: { isRevoked: true },
    });

    if (access.count === 0) {
      return NextResponse.json({ error: 'Access not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Access revoked' });
  } catch (error) {
    console.error('Revoke access error:', error);
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 });
  }
}
