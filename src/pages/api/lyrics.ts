import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";

const LYRICS_API_BASE = "https://wilooper-lyrica.hf.space";

export interface LyricsLine {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface LyricsMetadata {
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  durationMs?: number;
  source?: string;
}

export interface LyricsResult {
  lines: LyricsLine[];
  hasTimestamps: boolean;
  plainLyrics?: string;
  metadata: LyricsMetadata;
  error?: string;
}

interface ApiTimedLyric {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
}

interface ApiResponse {
  data?: {
    lyrics?: string;
    timed_lyrics?: ApiTimedLyric[];
    hasTimestamps?: boolean;
    title?: string;
    artist?: string;
    album?: string;
  };
  metadata?: {
    album_art?: string;
    duration?: {
      ms?: number;
    };
    title?: string;
    artist?: string;
    album?: string;
  };
  status?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { artist, song, album, duration } = req.query;

  if (!artist || typeof artist !== "string" || !song || typeof song !== "string") {
    return res.status(400).json({ error: "Missing or invalid artist or song parameters" });
  }

  const cleanArtist = artist.trim();
  const cleanSong = song.trim();
  const cacheKey = `lyrics:${cleanArtist.toLowerCase()}:${cleanSong.toLowerCase()}`;

  const emptyResult: LyricsResult = {
    lines: [],
    hasTimestamps: false,
    metadata: {},
    error: "No lyrics found",
  };

  try {
    // 1. Check SQLite KV Cache
    const cached = await kv.get<LyricsResult>(cacheKey);
    if (cached !== null) {
      return res.status(200).json(cached);
    }

    let result: LyricsResult | null = null;

    // 2. Fetch from wilooper-lyrica API
    try {
      const params = new URLSearchParams({
        artist: cleanArtist,
        song: cleanSong,
        timestamps: "true",
        fast: "true",
        metadata: "true",
      });

      const response = await fetch(`${LYRICS_API_BASE}/lyrics/?${params}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.ok) {
        const json: ApiResponse = await response.json();
        if (json.status === "success" && json.data) {
          const { data, metadata } = json;
          const hasTimed = data.hasTimestamps && Array.isArray(data.timed_lyrics) && data.timed_lyrics.length > 0;

          let lines: LyricsLine[] = [];
          if (hasTimed && data.timed_lyrics) {
            lines = data.timed_lyrics
              .filter((l) => l.text.trim() !== "")
              .map((l) => ({
                id: l.id,
                startMs: l.start_time,
                endMs: l.end_time,
                text: l.text,
              }));
          }

          if (lines.length > 0 || (data.lyrics && data.lyrics.trim() !== "")) {
            result = {
              lines,
              hasTimestamps: hasTimed,
              plainLyrics: data.lyrics,
              metadata: {
                title: metadata?.title ?? data.title,
                artist: metadata?.artist ?? data.artist,
                album: metadata?.album ?? data.album,
                albumArt: metadata?.album_art,
                durationMs: metadata?.duration?.ms,
                source: "lyrica"
              },
            };
          }
        }
      }
    } catch (err) {
      console.warn("[Lyrica primary fetch failed, falling back to LRCLIB]", err);
    }

    // 3. Fallback to lrclib.net if Lyrica failed or returned empty
    if (!result) {
      result = await fetchLrcLib(
        cleanArtist,
        cleanSong,
        typeof album === "string" ? album : undefined,
        duration ? Number(duration) : undefined
      );
    }

    // 4. If still no lyrics, use emptyResult
    if (!result) {
      result = emptyResult;
    }

    // Cache successful/failed results: 7 days for success, 6 hours for failure
    const isSuccess = result.lines.length > 0 || !!result.plainLyrics;
    const ttl = isSuccess ? 7 * 24 * 60 * 60 : 6 * 60 * 60;
    await kv.set(cacheKey, result, { ex: ttl });

    return res.status(200).json(result);
  } catch (err) {
    console.error("[API Lyrics Error]", err);
    return res.status(500).json({ error: "Failed to fetch or parse lyrics" });
  }
}

// ── LRCLIB FALLBACK HELPERS ──

async function fetchLrcLib(
  artist: string,
  title: string,
  album?: string,
  duration?: number
): Promise<LyricsResult | null> {
  const headers = {
    "User-Agent": "abyn.xyz v3.0.0 (https://github.com/abyn365/abyndotxyz)",
    Accept: "application/json"
  };

  try {
    let url = "";
    if (duration && duration > 0) {
      const params = new URLSearchParams({
        artist_name: artist,
        track_name: title,
        album_name: album || "",
        duration: Math.round(duration).toString(),
      });
      url = `https://lrclib.net/api/get?${params.toString()}`;
    } else {
      const params = new URLSearchParams({
        artist_name: artist,
        track_name: title,
      });
      url = `https://lrclib.net/api/search?${params.toString()}`;
    }

    let response = await fetch(url, { headers, cache: "no-store" });
    
    // If exact signature fetch with duration failed with 404, try searching as fallback
    if (!response.ok && duration && duration > 0 && response.status === 404) {
      const searchParams = new URLSearchParams({
        artist_name: artist,
        track_name: title,
      });
      response = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`, { headers, cache: "no-store" });
    }

    if (!response.ok) return null;

    const data = await response.json();
    
    if (Array.isArray(data)) {
      if (data.length === 0) return null;
      
      // If we have duration, try to match the closest duration within 10s
      let best = data[0];
      if (duration && duration > 0) {
        const diffs = data.map((item: any) => Math.abs(item.duration - duration));
        const minDiffIdx = diffs.indexOf(Math.min(...diffs));
        if (minDiffIdx !== -1 && diffs[minDiffIdx] <= 10) {
          best = data[minDiffIdx];
        }
      }
      return processLrcLibItem(best);
    }

    return processLrcLibItem(data);
  } catch (err) {
    console.error("[LRCLIB fetch error]", err);
    return null;
  }
}

function processLrcLibItem(item: any): LyricsResult {
  const hasTimestamps = !!item.syncedLyrics && item.syncedLyrics.trim() !== "";
  const lines = hasTimestamps ? parseLrc(item.syncedLyrics) : [];

  return {
    lines,
    hasTimestamps,
    plainLyrics: item.plainLyrics || undefined,
    metadata: {
      title: item.trackName,
      artist: item.artistName,
      album: item.albumName,
      durationMs: item.duration * 1000,
      source: "lrclib",
    },
  };
}

function parseLrc(lrcText: string): LyricsLine[] {
  const lines = lrcText.split("\n");
  const parsedLines: LyricsLine[] = [];
  const timeRegex = /^\[(\d+):(\d+)(?:[.:](\d+))?\](.*)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let ms = 0;
      if (match[3]) {
        const fractionStr = match[3];
        if (fractionStr.length === 2) {
          ms = parseInt(fractionStr, 10) * 10;
        } else if (fractionStr.length === 3) {
          ms = parseInt(fractionStr, 10);
        } else {
          ms = parseInt(fractionStr, 10) * Math.pow(10, 3 - fractionStr.length);
        }
      }

      const startMs = (minutes * 60 + seconds) * 1000 + ms;
      const text = match[4].trim();

      parsedLines.push({
        id: `lrc-${parsedLines.length}`,
        startMs,
        endMs: 0,
        text,
      });
    }
  }

  // Second pass: fill in endMs based on the start of the next line
  for (let i = 0; i < parsedLines.length; i++) {
    if (i < parsedLines.length - 1) {
      parsedLines[i].endMs = parsedLines[i + 1].startMs;
    } else {
      parsedLines[i].endMs = parsedLines[i].startMs + 8000;
    }
  }

  return parsedLines;
}
