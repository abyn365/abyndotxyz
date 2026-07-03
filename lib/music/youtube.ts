/**
 * music/youtube.ts
 * YouTube IFrame API wrapper with Invidious-based video search.
 * Manages a single player instance; switching tracks reuses it.
 */

import { cacheGet, cacheSet, ytCacheKey, YT_TTL } from "./cache";

// ---------------------------------------------------------------------------
// Invidious instance fallback list (ordered by preference)
// ---------------------------------------------------------------------------
const INVIDIOUS_INSTANCES = [
  "https://yt.chocolatemoo53.com",
  "https://invidious.tiekoetter.com",
  "https://invidious.f5.si",
  "https://inv.zoomerville.com",
];

// inv.nadeko.net uses CAPTCHA — skip for API calls
// We keep it out of the list above; add it as last resort only if needed.

export interface YTSearchResult {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
}

type SearchResultRaw = {
  videoId?: string;
  title?: string;
  author?: string;
  lengthSeconds?: number;
  type?: string;
};

// ---------------------------------------------------------------------------
// Search helper — tries instances in order, returns first success
// ---------------------------------------------------------------------------
export async function searchYouTube(
  title: string,
  artist: string,
  signal?: AbortSignal,
  excludeVideoIds: string[] = [],
  isServerSide = false
): Promise<YTSearchResult | null> {
  // Direct client-side calls to Invidious block due to CORS. 
  // We proxy client searches through our server-side API route.
  if (typeof window !== "undefined" && !isServerSide) {
    try {
      const excludeParam = excludeVideoIds.length > 0 ? `&exclude=${encodeURIComponent(excludeVideoIds.join(","))}` : "";
      const url = `/api/youtube-search?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}${excludeParam}`;
      const res = await fetch(url, { signal });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("[YouTube Search Proxy Failed]", err);
      return null;
    }
  }

  const cacheKey = ytCacheKey(artist, title);
  if (excludeVideoIds.length === 0) {
    const cached = cacheGet<YTSearchResult>(cacheKey);
    if (cached) return cached;
  }

  // Clean the search query:
  // - Replace '#' with a space (to prevent search engines treating it as a hashtag)
  // - Collapse multiple spaces
  const cleanTitle = title.replace(/#/g, " ").replace(/\s+/g, " ").trim();
  const cleanArtist = artist.replace(/#/g, " ").replace(/\s+/g, " ").trim();

  // Search for "Title Artist" without appending "official audio" as it restricts searches too much
  // and breaks results for indie/international artists. The scoring logic in pickBestResult
  // will rank the official/Topic videos appropriately.
  const query = encodeURIComponent(`${cleanTitle} ${cleanArtist}`);

  for (const instance of INVIDIOUS_INSTANCES) {
    if (signal?.aborted) return null;
    try {
      const url = `${instance}/api/v1/search?q=${query}&type=video&fields=videoId,title,author,lengthSeconds&page=1`;
      const res = await fetch(url, { signal, cache: "no-store" });
      if (!res.ok) continue;

      const results: SearchResultRaw[] = await res.json();
      if (!Array.isArray(results) || results.length === 0) continue;

      // Pick best match: prefer "official audio/video" or first result
      const best = pickBestResult(results, title, artist, excludeVideoIds);
      if (!best) continue;

      const result: YTSearchResult = {
        videoId: best.videoId!,
        title: best.title ?? title,
        author: best.author ?? artist,
        lengthSeconds: best.lengthSeconds ?? 0,
      };

      if (excludeVideoIds.length === 0) {
        cacheSet(cacheKey, result, YT_TTL);
      }
      return result;
    } catch {
      // Try next instance
      continue;
    }
  }

  return null;
}

/**
 * Silently pre-fetch the video ID for a track into the in-memory cache.
 * Call this when the user is about to switch tracks (e.g., on queue advance).
 * Safe to call multiple times — no-ops if already cached.
 */
export async function preloadSearch(title: string, artist: string): Promise<void> {
  try {
    await searchYouTube(title, artist);
  } catch {
    // Silently ignore — this is best-effort preloading
  }
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/#/g, " ")
    .replace(/[^\w\s]/g, "") // remove other punctuation
    .replace(/\s+/g, " ")
    .trim();
}

export function pickBestResult(
  results: SearchResultRaw[],
  title: string,
  artist: string,
  excludeVideoIds: string[] = []
): SearchResultRaw | null {
  const validResults = results.filter(
    (r) => r.type === "video" || !r.type
  ).filter((r) => !!r.videoId && !excludeVideoIds.includes(r.videoId));

  if (!validResults.length) return null;

  const normTitle = normalizeString(title);
  const normArtist = normalizeString(artist);

  // Score each result
  const scored = validResults.map((r) => {
    let score = 0;
    const t = (r.title ?? "").toLowerCase();
    const a = (r.author ?? "").toLowerCase();

    const normT = normalizeString(r.title ?? "");
    const normA = normalizeString(r.author ?? "");

    if (normT.includes(normTitle)) score += 3;
    if (normA.includes(normArtist) || normT.includes(normArtist)) score += 3;
    if (normT.includes("official")) score += 2;
    if (normT.includes("audio")) score += 1;
    if (normT.includes("lyrics")) score += 1;
    if (normA.includes("topic")) score += 2; // Artist - Topic channels are usually clean (Topic is in the author/channel name)
    // Penalize covers and remixes
    if (normT.includes("cover")) score -= 2;
    if (normT.includes("remix")) score -= 1;
    if (normT.includes("live")) score -= 1;
    if (normT.includes("karaoke")) score -= 3;

    return { r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].r;
}

// ---------------------------------------------------------------------------
// YouTube IFrame API types (minimal)
// ---------------------------------------------------------------------------
export type YTPlayerState = "unstarted" | "ended" | "playing" | "paused" | "buffering" | "cued";

export interface YTPlayerCallbacks {
  onReady?: () => void;
  onStateChange?: (state: YTPlayerState) => void;
  onError?: (code: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

// Map YT numeric states
const STATE_MAP: Record<number, YTPlayerState> = {
  [-1]: "unstarted",
  [0]: "ended",
  [1]: "playing",
  [2]: "paused",
  [3]: "buffering",
  [5]: "cued",
};

// ---------------------------------------------------------------------------
// MusicYouTubePlayer — singleton class
// ---------------------------------------------------------------------------
export class MusicYouTubePlayer {
  private static instance: MusicYouTubePlayer | null = null;

  private player: YT.Player | null = null;
  private containerId = "yt-player-iframe-container";
  private isApiReady = false;
  private isPlayerReady = false;
  private pendingLoad: { videoId: string; seekTo?: number } | null = null;
  private callbacks: YTPlayerCallbacks = {};
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private currentState: YTPlayerState = "unstarted";

  static getInstance(): MusicYouTubePlayer {
    if (!MusicYouTubePlayer.instance) {
      MusicYouTubePlayer.instance = new MusicYouTubePlayer();
    }
    return MusicYouTubePlayer.instance;
  }

  // Call once to bootstrap the IFrame API
  init(callbacks: YTPlayerCallbacks = {}) {
    this.callbacks = callbacks;

    if (typeof window === "undefined") return;

    if ((window as any).YT?.Player) {
      this.isApiReady = true;
      this.createPlayer();
      return;
    }

    // Inject script if not already there
    if (!document.getElementById("yt-iframe-script")) {
      const script = document.createElement("script");
      script.id = "yt-iframe-script";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }

    // The API will call window.onYouTubeIframeAPIReady
    (window as any).onYouTubeIframeAPIReady = () => {
      this.isApiReady = true;
      this.createPlayer();
    };
  }

  private ensureContainer(): HTMLElement {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = this.containerId;
      container.style.cssText =
        "position:fixed;bottom:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;opacity:0;";
      document.body.appendChild(container);
    }
    return container;
  }

  private createPlayer() {
    const container = this.ensureContainer();

    this.player = new (window as any).YT.Player(container.id, {
      height: "1",
      width: "1",
      videoId: "",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          this.isPlayerReady = true;
          this.callbacks.onReady?.();
          if (this.pendingLoad) {
            const { videoId, seekTo } = this.pendingLoad;
            this.pendingLoad = null;
            this.load(videoId, seekTo);
          }
        },
        onStateChange: (event: { data: number }) => {
          const state = STATE_MAP[event.data] ?? "unstarted";
          this.currentState = state;
          this.callbacks.onStateChange?.(state);

          if (state === "playing") {
            this.startTimeUpdates();
          } else {
            this.stopTimeUpdates();
          }
        },
        onError: (event: { data: number }) => {
          this.callbacks.onError?.(event.data);
        },
      },
    });
  }

  private startTimeUpdates() {
    this.stopTimeUpdates();
    this.timeUpdateInterval = setInterval(() => {
      if (!this.player || this.currentState !== "playing") return;
      try {
        const currentTime = this.player.getCurrentTime?.() ?? 0;
        const duration = this.player.getDuration?.() ?? 0;
        this.callbacks.onTimeUpdate?.(currentTime, duration);
      } catch {}
    }, 500);
  }

  private stopTimeUpdates() {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  load(videoId: string, seekTo?: number) {
    if (!this.isPlayerReady || !this.player) {
      this.pendingLoad = { videoId, seekTo };
      return;
    }
    try {
      this.player.loadVideoById({
        videoId,
        startSeconds: seekTo ?? 0,
      });
    } catch {}
  }

  /**
   * Queue the next video without starting playback.
   * Warms the YouTube buffer so switching is near-instant.
   */
  cueVideo(videoId: string) {
    if (!this.isPlayerReady || !this.player) return;
    try {
      (this.player as any).cueVideoById?.({
        videoId,
        startSeconds: 0,
      });
    } catch {}
  }

  play() {
    try { this.player?.playVideo(); } catch {}
  }

  pause() {
    try { this.player?.pauseVideo(); } catch {}
  }

  seek(seconds: number) {
    try { this.player?.seekTo(seconds, true); } catch {}
  }

  getTime(): number {
    try { return this.player?.getCurrentTime?.() ?? 0; } catch { return 0; }
  }

  getDuration(): number {
    try { return this.player?.getDuration?.() ?? 0; } catch { return 0; }
  }

  setVolume(v: number) {
    try { this.player?.setVolume(Math.round(v * 100)); } catch {}
  }

  mute() {
    try { this.player?.mute(); } catch {}
  }

  unmute() {
    try { this.player?.unMute(); } catch {}
  }

  isMuted(): boolean {
    try { return this.player?.isMuted?.() ?? false; } catch { return false; }
  }

  getState(): YTPlayerState {
    return this.currentState;
  }

  stop() {
    try { this.player?.stopVideo(); } catch {}
    this.stopTimeUpdates();
  }

  updateCallbacks(callbacks: YTPlayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  destroy() {
    this.stop();
    try { this.player?.destroy(); } catch {}
    this.player = null;
    this.isPlayerReady = false;
    MusicYouTubePlayer.instance = null;
  }
}
