"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VideoMeta {
  url: string;
  embedUrl: string;
  platform: "youtube" | "vimeo" | "mp4";
  title: string;
  addedAt: string;
}

interface VideoStats {
  videoUrl: string;
  totalViews: number;
  uniqueViewers: number;
  plays: number;
  completions: number;
  averageWatchTime: number;
}

interface BuyerVideoBreakdown {
  buyerEmail: string;
  videos: Array<{
    videoUrl: string;
    plays: number;
    watchTime: number;
    completed: boolean;
  }>;
}

// ─── Helpers ───
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// ─── Add Video Modal ───
function AddVideoModal({ onAdd, onClose }: { onAdd: (url: string, title: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a video URL");
      return;
    }
    // Basic validation
    const isValid = url.match(/youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|ogg)/i);
    if (!isValid) {
      setError("Please enter a YouTube, Vimeo, or direct MP4 URL");
      return;
    }
    onAdd(url.trim(), title.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🎥 Add Video</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">Supports YouTube, Vimeo, or direct MP4 links</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Business Walkthrough"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2e7847] focus:ring-2 focus:ring-[#2e7847]/20 outline-none text-gray-900"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-[#2e7847] text-white rounded-lg font-medium hover:bg-[#245f39] transition-colors">
              Add Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Video Embed (Buyer View) ───
function VideoEmbed({
  video,
  businessId,
  buyerEmail,
}: {
  video: VideoMeta;
  businessId: string;
  buyerEmail?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackedRef = useRef(false);

  const trackEvent = useCallback((action: string, watchTime?: number, totalLength?: number) => {
    if (!buyerEmail) return;
    fetch("/api/im/video-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        buyerEmail,
        videoUrl: video.url,
        action,
        watchTime: watchTime ? Math.round(watchTime) : undefined,
        totalLength: totalLength ? Math.round(totalLength) : undefined,
      }),
    }).catch(() => {});
  }, [businessId, buyerEmail, video.url]);

  // Track "view" when section scrolls into view
  useEffect(() => {
    if (trackedRef.current || !buyerEmail) return;
    trackedRef.current = true;
    trackEvent("view");
  }, [buyerEmail, trackEvent]);

  // MP4 video event handlers
  useEffect(() => {
    if (video.platform !== "mp4" || !videoRef.current || !buyerEmail) return;
    const el = videoRef.current;

    const onPlay = () => trackEvent("play");
    const onPause = () => trackEvent("pause", el.currentTime, el.duration);
    const onEnded = () => trackEvent("ended", el.duration, el.duration);

    // Periodic time update (every 10 seconds)
    let lastTracked = 0;
    const onTimeUpdate = () => {
      if (el.currentTime - lastTracked >= 10) {
        lastTracked = el.currentTime;
        trackEvent("timeupdate", el.currentTime, el.duration);
      }
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [video.platform, buyerEmail, trackEvent]);

  return (
    <div className="mb-6">
      <div className="relative rounded-xl overflow-hidden shadow-lg bg-black" style={{ aspectRatio: "16/9" }}>
        {video.platform === "mp4" ? (
          <video
            ref={videoRef}
            src={video.embedUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <iframe
            src={video.embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title || "Video"}
          />
        )}
      </div>
      {video.title && (
        <p className="text-gray-700 font-medium mt-3 text-lg">{video.title}</p>
      )}
    </div>
  );
}

// ─── Video Analytics Panel (Owner) ───
function VideoAnalytics({ businessId }: { businessId: string }) {
  const [stats, setStats] = useState<VideoStats[]>([]);
  const [buyers, setBuyers] = useState<BuyerVideoBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (!showAnalytics) return;
    fetch(`/api/im/video-stats/${businessId}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.videoStats || []);
        setBuyers(data.buyerBreakdown || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId, showAnalytics]);

  return (
    <div className="mt-6">
      <button
        onClick={() => setShowAnalytics(!showAnalytics)}
        className="text-sm text-[#2e7847] hover:text-[#245f39] font-medium flex items-center gap-1"
      >
        📊 {showAnalytics ? "Hide" : "View"} Video Analytics
      </button>

      {showAnalytics && (
        <div className="mt-4 bg-gray-50 rounded-xl p-6 border border-gray-100">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading analytics...</p>
          ) : stats.length === 0 ? (
            <p className="text-gray-400 text-sm">No video views yet. Analytics will appear once buyers start watching.</p>
          ) : (
            <>
              {/* Per-video stats */}
              <h4 className="font-bold text-gray-900 mb-4">Video Performance</h4>
              <div className="space-y-3 mb-6">
                {stats.map((s) => (
                  <div key={s.videoUrl} className="bg-white rounded-lg p-4 border border-gray-100">
                    <p className="text-sm font-medium text-gray-700 truncate mb-2">{s.videoUrl}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-400">Total Views</p>
                        <p className="text-lg font-bold text-gray-900">{s.totalViews}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Unique Viewers</p>
                        <p className="text-lg font-bold text-gray-900">{s.uniqueViewers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Plays</p>
                        <p className="text-lg font-bold text-gray-900">{s.plays}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Avg Watch Time</p>
                        <p className="text-lg font-bold text-gray-900">{formatWatchTime(s.averageWatchTime)}</p>
                      </div>
                    </div>
                    {/* Simple retention bar */}
                    {s.plays > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Completion rate:</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2e7847] rounded-full transition-all"
                              style={{ width: `${Math.round((s.completions / s.plays) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {Math.round((s.completions / s.plays) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Buyer breakdown */}
              {buyers.length > 0 && (
                <>
                  <h4 className="font-bold text-gray-900 mb-3">Buyer Activity</h4>
                  <div className="space-y-2">
                    {buyers.map((b) => (
                      <div key={b.buyerEmail} className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-sm font-medium text-gray-800">{b.buyerEmail}</p>
                        <div className="mt-1 space-y-1">
                          {b.videos.map((v) => (
                            <div key={v.videoUrl} className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="truncate flex-1">{v.videoUrl.split("/").pop()}</span>
                              <span>{v.plays} play{v.plays !== 1 ? "s" : ""}</span>
                              {v.watchTime > 0 && <span>• {formatWatchTime(v.watchTime)}</span>}
                              {v.completed && <span className="text-green-600">✓ Completed</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Owner Video Manager ───
export function OwnerVideoSection({
  businessId,
  initialVideos,
}: {
  businessId: string;
  initialVideos: VideoMeta[];
}) {
  const [videos, setVideos] = useState<VideoMeta[]>(initialVideos);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addVideo = async (url: string, title: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/im/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, action: "add", videoUrl: url, title }),
      });
      const data = await res.json();
      if (res.ok) {
        setVideos(data.videos);
        setShowModal(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const removeVideo = async (url: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/im/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, action: "remove", videoUrl: url }),
      });
      const data = await res.json();
      if (res.ok) setVideos(data.videos);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...videos];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setVideos(reordered);
    setDragIdx(null);

    // Save reorder
    try {
      await fetch("/api/im/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, action: "reorder", videos: reordered }),
      });
    } catch {
      // silent
    }
  };

  return (
    <section className="py-10 border-b border-gray-100 last:border-b-0" data-section="videos">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🎥</span>
        <h2 className="text-2xl font-bold text-gray-900">Videos</h2>
        <button
          onClick={() => setShowModal(true)}
          disabled={saving}
          className="ml-auto px-4 py-2 bg-[#2e7847] text-white rounded-lg text-sm font-medium hover:bg-[#245f39] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          + Add Video
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-[#2e7847]/40 transition-colors cursor-pointer" onClick={() => setShowModal(true)}>
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-gray-500 font-medium">Add videos to showcase your business</p>
          <p className="text-gray-400 text-sm mt-1">Business walkthrough, owner interview, team video, and more</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video, idx) => {
            const ytThumb = getYouTubeThumbnail(video.url);
            return (
              <div
                key={video.url}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors group cursor-grab active:cursor-grabbing"
              >
                {/* Drag handle */}
                <div className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                  </svg>
                </div>

                {/* Thumbnail */}
                <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  {ytThumb ? (
                    <img src={ytThumb} alt={video.title || "Video thumbnail"} className="w-full h-full object-cover" />
                  ) : video.platform === "vimeo" ? (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                      <span className="text-2xl">▶️</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {video.title || "Untitled video"}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-1">{video.url}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                    {video.platform}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeVideo(video.url)}
                  disabled={saving}
                  className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Remove video"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Analytics */}
      <VideoAnalytics businessId={businessId} />

      {/* Add Video Modal */}
      {showModal && <AddVideoModal onAdd={addVideo} onClose={() => setShowModal(false)} />}
    </section>
  );
}

// ─── Buyer Video Section ───
export function BuyerVideoSection({
  businessId,
  videos,
  buyerEmail,
}: {
  businessId: string;
  videos: VideoMeta[];
  buyerEmail: string;
}) {
  if (videos.length === 0) return null;

  return (
    <section className="py-10 border-b border-gray-100 last:border-b-0" data-section="videos">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🎥</span>
        <h2 className="text-2xl font-bold text-gray-900">Videos</h2>
      </div>
      <div className="space-y-8">
        {videos.map((video) => (
          <VideoEmbed
            key={video.url}
            video={video}
            businessId={businessId}
            buyerEmail={buyerEmail}
          />
        ))}
      </div>
    </section>
  );
}
