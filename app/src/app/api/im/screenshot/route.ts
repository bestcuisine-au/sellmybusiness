import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
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

    const puppeteer = require('puppeteer-core');
    
    // Use snap-installed chromium
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
    const desktopScreenshot = await page.screenshot({ 
      encoding: 'base64', 
      type: 'jpeg', 
      quality: 80 
    });
    
    // Extract social media links from the page
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
    const mobileScreenshot = await page.screenshot({ 
      encoding: 'base64', 
      type: 'jpeg', 
      quality: 80 
    });

    // Screenshot each social media profile
    const socialScreenshots: Record<string, string> = {};
    for (const [platform, socialUrl] of Object.entries(socialLinks)) {
      try {
        await page.setViewport({ width: 1280, height: 900 });
        await page.goto(socialUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000)); // Wait for dynamic content
        const screenshot = await page.screenshot({ 
          encoding: 'base64', 
          type: 'jpeg', 
          quality: 80 
        });
        socialScreenshots[platform] = screenshot;
      } catch (e) {
        console.error(`Failed to screenshot ${platform}:`, e);
      }
    }

    await browser.close();

    return NextResponse.json({
      desktopScreenshot,
      mobileScreenshot,
      socialLinks,
      socialScreenshots,
    });
  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json({ error: error.message || 'Failed to capture screenshots' }, { status: 500 });
  }
}
