import { kv } from "../kv";

export interface ExtractedTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  artworkUrl?: string;
  streamUrl?: string;
  provider: "youtube" | "youtube-music" | "soundcloud";
  expiresAt?: number;
}

const trackCache = new Map<string, ExtractedTrack>();

function getExpirationFromUrl(url: string): number {
  try {
    const urlObj = new URL(url);
    const expire = urlObj.searchParams.get("expire");
    if (expire) {
      // YouTube links typically expire in 6 hours.
      // Parse the timestamp and subtract a 15-minute buffer.
      return parseInt(expire, 10) * 1000 - 15 * 60 * 1000;
    }
  } catch {}
  // Default fallback of 4 hours
  return Date.now() + 4 * 60 * 60 * 1000;
}

async function runYtDlp(args: string[], signal?: AbortSignal): Promise<string> {
  const ytDlpPath = process.env.YT_DLP_PATH || "yt-dlp";
  const extraArgsString = process.env.YT_DLP_EXTRA_ARGS || "";
  const extraArgs = extraArgsString ? extraArgsString.split(/\s+/).filter(Boolean) : [];
  const allArgs = [...extraArgs, ...args];

  const child = Bun.spawn([ytDlpPath, ...allArgs], {
    stdout: "pipe",
    stderr: "pipe",
    signal,
  });

  const stdoutText = await new Response(child.stdout).text();
  const stderrText = await new Response(child.stderr).text();

  const code = await child.exited;

  if (code !== 0) {
    throw new Error(`yt-dlp exited with code ${code}: ${stderrText.trim()}`);
  }

  return stdoutText;
}

function parseYtDlpJson(jsonStr: string): ExtractedTrack {
  const data = JSON.parse(jsonStr);
  const streamUrl = data.url || "";
  const expiresAt = streamUrl ? getExpirationFromUrl(streamUrl) : undefined;
  
  // Detect provider
  let provider: "youtube" | "youtube-music" | "soundcloud" = "youtube";
  if (data.webpage_url?.includes("music.youtube.com")) {
    provider = "youtube-music";
  } else if (data.webpage_url?.includes("soundcloud.com")) {
    provider = "soundcloud";
  }

  // Get artwork
  let artworkUrl = data.thumbnail || undefined;
  if (data.thumbnails && data.thumbnails.length > 0) {
    // Pick the highest resolution thumbnail
    const sorted = [...data.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    artworkUrl = sorted[0].url;
  }

  return {
    id: data.id || "",
    title: data.title || "Unknown Title",
    artist: data.uploader || data.artist || "Unknown Artist",
    duration: Math.round(data.duration || 0),
    artworkUrl,
    streamUrl,
    provider,
    expiresAt,
  };
}

/**
 * Searches for a track on YouTube / YouTube Music.
 */
export async function searchTrack(query: string, signal?: AbortSignal): Promise<ExtractedTrack> {
  const cacheKey = `search:${query.toLowerCase()}`;
  
  // Check in-memory cache
  const cached = trackCache.get(cacheKey);
  if (cached && cached.expiresAt && Date.now() < cached.expiresAt) {
    return cached;
  }

  // Check SQLite KV cache
  try {
    const cachedKv = await kv.get<ExtractedTrack>(cacheKey);
    if (cachedKv && cachedKv.expiresAt && Date.now() < cachedKv.expiresAt) {
      trackCache.set(cacheKey, cachedKv);
      return cachedKv;
    }
  } catch (err) {
    console.error("[Extractor] Failed to get from SQLite KV:", err);
  }

  // Search and extract the best audio format
  const stdout = await runYtDlp(
    ["--dump-json", "--no-playlist", "-f", "ba", `ytsearch1:${query}`],
    signal
  );

  const track = parseYtDlpJson(stdout);
  
  // Cache the result
  if (track.expiresAt) {
    trackCache.set(cacheKey, track);
    trackCache.set(`id:${track.id}`, track);

    // Persist search results in KV for 30 days. Strip streamUrl to avoid caching expired URLs.
    const ttlSeconds = 30 * 24 * 60 * 60; // 30 days
    const searchResult = { ...track, streamUrl: undefined, expiresAt: Date.now() + ttlSeconds * 1000 };
    try {
      await kv.set(cacheKey, searchResult, { ex: ttlSeconds });
      await kv.set(`id:${track.id}`, searchResult, { ex: ttlSeconds });
    } catch (err) {
      console.error("[Extractor] Failed to save search mapping to SQLite KV:", err);
    }
  }

  return track;
}

/**
 * Resolves a track's high-quality stream URL by its video ID or direct URL.
 * Automatically refreshes expired stream URLs.
 */
export async function resolveTrackStream(urlOrId: string, signal?: AbortSignal, forceRefresh = false): Promise<ExtractedTrack> {
  const isUrl = urlOrId.startsWith("http://") || urlOrId.startsWith("https://");
  const cacheKey = isUrl ? `url:${urlOrId}` : `id:${urlOrId}`;
  
  if (!forceRefresh) {
    // Check in-memory
    const cached = trackCache.get(cacheKey);
    if (cached && cached.streamUrl && cached.expiresAt && Date.now() < cached.expiresAt) {
      return cached;
    }

    // Check SQLite KV
    try {
      const cachedKv = await kv.get<ExtractedTrack>(cacheKey);
      if (cachedKv && cachedKv.streamUrl && cachedKv.expiresAt && Date.now() < cachedKv.expiresAt) {
        trackCache.set(cacheKey, cachedKv);
        return cachedKv;
      }
    } catch (err) {
      console.error("[Extractor] Failed to get stream from SQLite KV:", err);
    }
  } else {
    trackCache.delete(cacheKey);
    try {
      await kv.del(cacheKey);
    } catch {}
    if (!isUrl) {
      const target = `https://www.youtube.com/watch?v=${urlOrId}`;
      trackCache.delete(`url:${target}`);
      try {
        await kv.del(`url:${target}`);
      } catch {}
    }
  }

  const target = isUrl ? urlOrId : `https://www.youtube.com/watch?v=${urlOrId}`;
  const stdout = await runYtDlp(
    ["--dump-json", "--no-playlist", "-f", "ba", target],
    signal
  );

  const track = parseYtDlpJson(stdout);

  if (track.expiresAt) {
    trackCache.set(cacheKey, track);
    
    // Save to SQLite KV with TTL matching the URL expiration!
    const ttlSeconds = Math.max(Math.floor((track.expiresAt - Date.now()) / 1000), 60);
    try {
      await kv.set(cacheKey, track, { ex: ttlSeconds });
    } catch (err) {
      console.error("[Extractor] Failed to save stream to SQLite KV:", err);
    }

    if (!isUrl) {
      const urlKey = `url:${target}`;
      trackCache.set(urlKey, track);
      try {
        await kv.set(urlKey, track, { ex: ttlSeconds });
      } catch {}
    } else {
      const idKey = `id:${track.id}`;
      trackCache.set(idKey, track);
      try {
        await kv.set(idKey, track, { ex: ttlSeconds });
      } catch {}
    }
  }

  return track;
}

/**
 * Extracts metadata for all tracks in a playlist (without resolving stream URLs immediately for speed).
 */
export async function extractPlaylist(playlistUrl: string, signal?: AbortSignal): Promise<ExtractedTrack[]> {
  const stdout = await runYtDlp(
    ["--dump-json", "--flat-playlist", playlistUrl],
    signal
  );

  const lines = stdout.trim().split("\n").filter(Boolean);
  return lines.map((line) => {
    const data = JSON.parse(line);
    let provider: "youtube" | "youtube-music" | "soundcloud" = "youtube";
    if (playlistUrl.includes("music.youtube.com")) {
      provider = "youtube-music";
    } else if (playlistUrl.includes("soundcloud.com")) {
      provider = "soundcloud";
    }

    return {
      id: data.id || "",
      title: data.title || "Unknown Title",
      artist: data.uploader || "Unknown Artist",
      duration: Math.round(data.duration || 0),
      provider,
    };
  });
}
