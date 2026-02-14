import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
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

    // Validate URL
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json({ error: 'Please enter a valid website URL' }, { status: 400 });
    }

    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Inline Puppeteer screenshot capture
    const puppeteer = require('puppeteer-core');
    const executablePath = '/snap/bin/chromium';
    
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    
    // Desktop screenshot
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const desktopScreenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 });
    
    // Extract social media links
    const socialLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const socials: Record<string, string> = {};
      const patterns: Record<string, RegExp> = {
        facebook: /facebook\.com\//i,
        instagram: /instagram\.com\//i,
        linkedin: /linkedin\.com\//i,
        twitter: /twitter\.com\/|x\.com\//i,
        youtube: /youtube\.com\//i,
        tiktok: /tiktok\.com\//i,
        pinterest: /pinterest\.com\//i,
      };
      links.forEach(link => {
        const href = (link as HTMLAnchorElement).href;
        for (const [platform, regex] of Object.entries(patterns)) {
          if (regex.test(href) && !socials[platform]) {
            socials[platform] = href;
          }
        }
      });
      return socials;
    });

    // Mobile screenshot
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const mobileScreenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 });

    // Screenshot each social media profile
    const socialScreenshots: Record<string, string> = {};
    for (const [platform, socialUrl] of Object.entries(socialLinks)) {
      try {
        await page.setViewport({ width: 1280, height: 900 });
        await page.goto(socialUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 });
        socialScreenshots[platform] = screenshot;
      } catch (e) {
        console.error(`Failed to screenshot ${platform}:`, e);
      }
    }

    await browser.close();

    // Build content for the IM section
    const content = {
      websiteUrl: url,
      desktopScreenshot,
      mobileScreenshot,
      socialLinks,
      socialScreenshots,
      capturedAt: new Date().toISOString(),
    };

    // Upsert IMSection
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
      socialLinks,
      socialCount: Object.keys(socialLinks || {}).length,
      sectionId: section.id,
      message: `Captured digital presence with ${Object.keys(socialLinks || {}).length} social media ${Object.keys(socialLinks || {}).length === 1 ? 'profile' : 'profiles'}.`
    });
  } catch (error: any) {
    console.error('Digital presence error:', error);
    return NextResponse.json({ error: error.message || 'Failed to capture digital presence' }, { status: 500 });
  }
}
