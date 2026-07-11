/**
 * music/lyrics.ts
 * Fetch timestamped lyrics from wilooper-lyrica API.
 * Caches results per artist+song for 30 minutes.
 */

import { cacheGet, cacheSet, lyricsCacheKey, LYRICS_TTL } from "./cache";

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
  canvasUrl?: string;
}

export interface LyricsResult {
  lines: LyricsLine[];
  hasTimestamps: boolean;
  plainLyrics?: string;
  metadata: LyricsMetadata;
  error?: string;
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
  });

  const emptyResult: LyricsResult = {
    lines: [],
    hasTimestamps: false,
    metadata: {},
    error: "No lyrics found",
  };

  try {
    const res = await fetch(`/api/lyrics?${params}`, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      cacheSet(key, emptyResult, 5 * 60 * 1000);
      return emptyResult;
    }

    const result: LyricsResult = await res.json();

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
