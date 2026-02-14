import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { businessId, url } = await req.json();
    if (!businessId || !url) {
      return NextResponse.json({ error: 'businessId and url required' }, { status: 400 });
    }

    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Call screenshot endpoint internally
    const screenshotRes = await fetch(`${req.nextUrl.origin}/api/im/screenshot`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({ url }),
    });
    
    const data = await screenshotRes.json();
    if (!screenshotRes.ok) {
      return NextResponse.json({ error: data.error || 'Failed to capture screenshots' }, { status: 500 });
    }

    // Build content for the IM section
    const content = {
      websiteUrl: url,
      desktopScreenshot: data.desktopScreenshot,
      mobileScreenshot: data.mobileScreenshot,
      socialLinks: data.socialLinks,
      socialScreenshots: data.socialScreenshots,
      capturedAt: new Date().toISOString(),
    };

    // Check if digital-presence section exists
    const existing = await prisma.iMSection.findFirst({
      where: { businessId, sectionType: 'digital-presence' },
    });

    const sectionData = {
      title: 'Digital Presence',
      content: JSON.stringify(content),
      order: 10,
      mediaUrls: [],
      isVisible: true,
    };

    let section;
    if (existing) {
      section = await prisma.iMSection.update({
        where: { id: existing.id },
        data: sectionData,
      });
    } else {
      section = await prisma.iMSection.create({
        data: {
          businessId,
          sectionType: 'digital-presence',
          ...sectionData,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      socialLinks: data.socialLinks,
      socialCount: Object.keys(data.socialLinks || {}).length,
      sectionId: section.id,
      message: `Captured digital presence with ${Object.keys(data.socialLinks || {}).length} social media ${Object.keys(data.socialLinks || {}).length === 1 ? 'profile' : 'profiles'}.`
    });
  } catch (error: any) {
    console.error('Digital presence error:', error);
    return NextResponse.json({ error: error.message || 'Failed to capture digital presence' }, { status: 500 });
  }
}
