import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

interface VideoMeta {
  url: string;
  embedUrl: string;
  platform: "youtube" | "vimeo" | "mp4";
  title: string;
  addedAt: string;
}

function parseVideoUrl(url: string): { embedUrl: string; platform: "youtube" | "vimeo" | "mp4" } | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1`,
      platform: "youtube",
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      platform: "vimeo",
    };
  }

  // Direct MP4
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return {
      embedUrl: url,
      platform: "mp4",
    };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { businessId, action, videoUrl, title, videos } = await req.json();

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get or create video section
    let section = await prisma.iMSection.findFirst({
      where: { businessId, sectionType: "videos" },
    });

    if (!section) {
      section = await prisma.iMSection.create({
        data: {
          businessId,
          sectionType: "videos",
          title: "Videos",
          content: JSON.stringify({ videos: [] }),
          order: 9, // After gallery (8)
          mediaUrls: [],
          isVisible: true,
        },
      });
    }

    let currentVideos: VideoMeta[] = [];
    try {
      const parsed = JSON.parse(section.content || "{}");
      currentVideos = parsed.videos || [];
    } catch {
      currentVideos = [];
    }

    if (action === "add") {
      const parsed = parseVideoUrl(videoUrl);
      if (!parsed) {
        return NextResponse.json({ error: "Unsupported video URL. Please use YouTube, Vimeo, or a direct MP4 link." }, { status: 400 });
      }

      const newVideo: VideoMeta = {
        url: videoUrl,
        embedUrl: parsed.embedUrl,
        platform: parsed.platform,
        title: title || "",
        addedAt: new Date().toISOString(),
      };

      currentVideos.push(newVideo);
    } else if (action === "remove") {
      currentVideos = currentVideos.filter((v) => v.url !== videoUrl);
    } else if (action === "reorder") {
      // videos is the full reordered array
      if (Array.isArray(videos)) {
        currentVideos = videos;
      }
    } else if (action === "update") {
      // Update title of a specific video
      currentVideos = currentVideos.map((v) =>
        v.url === videoUrl ? { ...v, title: title || v.title } : v
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.iMSection.update({
      where: { id: section.id },
      data: {
        content: JSON.stringify({ videos: currentVideos }),
        mediaUrls: currentVideos.map((v) => v.url),
      },
    });

    return NextResponse.json({ section: updated, videos: currentVideos });
  } catch (error) {
    console.error("Video API error:", error);
    return NextResponse.json({ error: "Failed to manage videos" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get("businessId");
    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const section = await prisma.iMSection.findFirst({
      where: { businessId, sectionType: "videos" },
    });

    if (!section) {
      return NextResponse.json({ videos: [] });
    }

    let videos: VideoMeta[] = [];
    try {
      const parsed = JSON.parse(section.content || "{}");
      videos = parsed.videos || [];
    } catch {
      videos = [];
    }

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Video GET error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
