import { spawn } from "child_process";
import { kv } from "../kv";

const PAXSENIX_KEY = process.env.PAXSENIX_API_KEY as string;

async function fetchPaxsenix(url: string, signal?: AbortSignal) {
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${PAXSENIX_KEY}`,
      "Content-Type": "application/json"
    },
    signal
  });
  if (!res.ok) throw new Error(`Paxsenix API error: ${res.status}`);
  return res.json();
}

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
const activePromises = new Map<string, Promise<ExtractedTrack>>();

function getExpirationFromUrl(url: string): number {
  try {
    const urlObj = new URL(url);
    const expire = urlObj.searchParams.get("expire");
    if (expire) {
      return parseInt(expire, 10) * 1000 - 15 * 60 * 1000;
    }
  } catch {}
  return Date.now() + 4 * 60 * 60 * 1000;
}

async function runYtDlp(args: string[], signal?: AbortSignal): Promise<string> {
  const ytDlpPath = process.env.YT_DLP_PATH || "yt-dlp";
  const extraArgsString = process.env.YT_DLP_EXTRA_ARGS || "";
  const extraArgs = extraArgsString ? extraArgsString.split(/\s+/).filter(Boolean) : [];
  const allArgs = [...extraArgs, ...args];

  if (typeof Bun !== "undefined") {
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
  } else {
    return new Promise((resolve, reject) => {
      const child = spawn(ytDlpPath, allArgs, { signal });
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim()}`));
        } else {
          resolve(stdout);
        }
      });

      child.on("error", (err) => {
        reject(err);
      });
    });
  }
}

function parseYtDlpJson(jsonStr: string): ExtractedTrack {
  const data = JSON.parse(jsonStr);
  const streamUrl = data.url || "";
  const expiresAt = streamUrl ? getExpirationFromUrl(streamUrl) : undefined;
  
  let provider: "youtube" | "youtube-music" | "soundcloud" = "youtube";
  if (data.webpage_url?.includes("music.youtube.com")) {
    provider = "youtube-music";
  } else if (data.webpage_url?.includes("soundcloud.com")) {
    provider = "soundcloud";
  }

  let artworkUrl = data.thumbnail || undefined;
  if (data.thumbnails && data.thumbnails.length > 0) {
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

export async function searchTrack(query: string, signal?: AbortSignal): Promise<ExtractedTrack> {
  const cacheKey = `search:${query.toLowerCase()}`;
  
  if (activePromises.has(cacheKey)) {
    return activePromises.get(cacheKey)!;
  }

  const promise = (async () => {
    const cached = trackCache.get(cacheKey);
    if (cached && cached.expiresAt && Date.now() < cached.expiresAt) {
      return cached;
    }

    try {
      const cachedKv = await kv.get<ExtractedTrack>(cacheKey);
      if (cachedKv && cachedKv.expiresAt && Date.now() < cachedKv.expiresAt) {
        trackCache.set(cacheKey, cachedKv);
        return cachedKv;
      }
    } catch (err) {
      console.error("[Extractor] Failed to get from SQLite KV:", err);
    }

    let track: ExtractedTrack;
    try {
      const paxRes = await fetchPaxsenix(`https://api.paxsenix.org/yt/search?q=${encodeURIComponent(query)}`, signal);
      if (paxRes?.ok && paxRes?.results?.length > 0) {
        const top = paxRes.results[0];
        track = {
          id: top.videoId,
          title: top.title,
          artist: top.channelName || "Unknown Artist",
          duration: top.duration ? top.duration.split(':').reduce((acc: number, time: string) => (60 * acc) + +time, 0) : 0,
          artworkUrl: top.thumbnails?.[top.thumbnails.length - 1]?.url,
          provider: "youtube",
          expiresAt: Date.now() + 4 * 60 * 60 * 1000 // 4 hours arbitrary cache
        };
      } else {
        throw new Error("No results from Paxsenix");
      }
    } catch (err) {
      console.warn("[Extractor] Paxsenix search failed, falling back to yt-dlp:", err);
      const stdout = await runYtDlp(
        ["--dump-json", "--no-playlist", "-f", "ba", `ytsearch1:${query}`],
        signal
      );
      track = parseYtDlpJson(stdout);
    }
    
    if (track.expiresAt) {
      trackCache.set(cacheKey, track);
      trackCache.set(`id:${track.id}`, track);

      const ttlSeconds = 30 * 24 * 60 * 60;
      const searchResult = { ...track, streamUrl: undefined, expiresAt: Date.now() + ttlSeconds * 1000 };
      try {
        await kv.set(cacheKey, searchResult, { ex: ttlSeconds });
        await kv.set(`id:${track.id}`, searchResult, { ex: ttlSeconds });
      } catch (err) {}
    }
    return track;
  })();

  activePromises.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    activePromises.delete(cacheKey);
  }
}

export async function resolveTrackStream(urlOrId: string, signal?: AbortSignal, forceRefresh = false): Promise<ExtractedTrack> {
  const isUrl = urlOrId.startsWith("http://") || urlOrId.startsWith("https://");
  const cacheKey = isUrl ? `url:${urlOrId}` : `id:${urlOrId}`;
  
  if (!forceRefresh && activePromises.has(cacheKey)) {
    return activePromises.get(cacheKey)!;
  }

  const promise = (async () => {
    if (!forceRefresh) {
      const cached = trackCache.get(cacheKey);
      if (cached && cached.streamUrl && cached.expiresAt && Date.now() < cached.expiresAt) {
        return cached;
      }
      try {
        const cachedKv = await kv.get<ExtractedTrack>(cacheKey);
        if (cachedKv && cachedKv.streamUrl && cachedKv.expiresAt && Date.now() < cachedKv.expiresAt) {
          trackCache.set(cacheKey, cachedKv);
          return cachedKv;
        }
      } catch (err) {}
    } else {
      trackCache.delete(cacheKey);
      try { await kv.del(cacheKey); } catch {}
      if (!isUrl) {
        const target = `https://www.youtube.com/watch?v=${urlOrId}`;
        trackCache.delete(`url:${target}`);
        try { await kv.del(`url:${target}`); } catch {}
      }
    }

    const target = isUrl ? urlOrId : `https://www.youtube.com/watch?v=${urlOrId}`;
    
    let track: ExtractedTrack;
    try {
      const paxRes = await fetchPaxsenix(`https://api.paxsenix.org/yt/ytaudio?url=${encodeURIComponent(target)}`, signal);
      if (paxRes?.ok && (paxRes?.directLink || paxRes?.downloads)) {
        track = {
          id: paxRes.videoId || urlOrId,
          title: paxRes.title || "Unknown Title",
          artist: "Unknown Artist", // Paxsenix ytaudio might not return artist
          duration: 0,
          streamUrl: paxRes.directLink || paxRes.downloads,
          provider: "youtube",
          expiresAt: Date.now() + 2 * 60 * 60 * 1000,
        };
      } else {
        throw new Error("Paxsenix ytaudio failed");
      }
    } catch (err) {
      console.warn("[Extractor] Paxsenix ytaudio failed, falling back to yt-dlp:", err);
      const stdout = await runYtDlp(
        ["--dump-json", "--no-playlist", "-f", "ba", target],
        signal
      );
      track = parseYtDlpJson(stdout);
    }

    if (track.expiresAt) {
      trackCache.set(cacheKey, track);
      
      const ttlSeconds = Math.max(Math.floor((track.expiresAt - Date.now()) / 1000), 60);
      try { await kv.set(cacheKey, track, { ex: ttlSeconds }); } catch {}

      if (!isUrl) {
        const urlKey = `url:${target}`;
        trackCache.set(urlKey, track);
        try { await kv.set(urlKey, track, { ex: ttlSeconds }); } catch {}
      } else {
        const idKey = `id:${track.id}`;
        trackCache.set(idKey, track);
        try { await kv.set(idKey, track, { ex: ttlSeconds }); } catch {}
      }
    }

    return track;
  })();

  if (!forceRefresh) {
    activePromises.set(cacheKey, promise);
  }
  
  try {
    return await promise;
  } finally {
    if (!forceRefresh) {
      activePromises.delete(cacheKey);
    }
  }
}

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

