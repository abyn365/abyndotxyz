/**
 * music/lyrics.ts
 * Fetch timestamped lyrics from wilooper-lyrica API.
 * Caches results per artist+song for 30 minutes.
 */

import { cacheGet, cacheSet, lyricsCacheKey, LYRICS_TTL } from "./cache";

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
    instrumental?: boolean;
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

export async function fetchLyrics(
  artist: string,
  song: string,
  signal?: AbortSignal
): Promise<LyricsResult> {
  const key = lyricsCacheKey(artist, song);
  const cached = cacheGet<LyricsResult>(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    artist,
    song,
    timestamps: "true",
    fast: "true",
    metadata: "true",
  });

  const emptyResult: LyricsResult = {
    lines: [],
    hasTimestamps: false,
    metadata: {},
    error: "No lyrics found",
  };

  try {
    const res = await fetch(`${LYRICS_API_BASE}/lyrics/?${params}`, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      cacheSet(key, emptyResult, 5 * 60 * 1000); // cache failures shorter
      return emptyResult;
    }

    const json: ApiResponse = await res.json();

    if (json.status !== "success" || !json.data) {
      cacheSet(key, emptyResult, 5 * 60 * 1000);
      return emptyResult;
    }

    const { data, metadata } = json;

    // Prefer timed lyrics
    const hasTimed = data.hasTimestamps && Array.isArray(data.timed_lyrics) && data.timed_lyrics.length > 0;

    let lines: LyricsLine[] = [];
    if (hasTimed && data.timed_lyrics) {
      lines = data.timed_lyrics
        .filter((l) => l.text.trim() !== "") // drop blank lines
        .map((l) => ({
          id: l.id,
          startMs: l.start_time,
          endMs: l.end_time,
          text: l.text,
        }));
    }

    const result: LyricsResult = {
      lines,
      hasTimestamps: hasTimed,
      plainLyrics: data.lyrics,
      metadata: {
        title: metadata?.title ?? data.title,
        artist: metadata?.artist ?? data.artist,
        album: metadata?.album ?? data.album,
        albumArt: metadata?.album_art,
        durationMs: metadata?.duration?.ms,
      },
    };

    cacheSet(key, result, LYRICS_TTL);
    return result;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return { ...emptyResult, error: "Request cancelled" };
    }
    return { ...emptyResult, error: "Lyrics fetch failed" };
  }
}

/**
 * Given a playback time in milliseconds, returns the index of the
 * currently active lyric line. Returns -1 if before the first line.
 */
export function getActiveLyricIndex(lines: LyricsLine[], currentMs: number): number {
  if (!lines.length) return -1;

  // Binary search for the active line
  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (lines[mid].startMs <= currentMs) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}
