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

  const { artist, song } = req.query;

  if (!artist || typeof artist !== "string" || !song || typeof song !== "string") {
    return res.status(400).json({ error: "Missing or invalid artist or song parameters" });
  }

  const cleanArtist = artist.trim();
  const cleanSong = song.trim();
  const cacheKey = `lyrics:${cleanArtist.toLowerCase()}:${cleanSong.toLowerCase()}`;

  try {
    // 1. Check SQLite KV Cache
    const cached = await kv.get<LyricsResult>(cacheKey);
    if (cached !== null) {
      return res.status(200).json(cached);
    }

    // 2. Fetch from wilooper-lyrica API
    const params = new URLSearchParams({
      artist: cleanArtist,
      song: cleanSong,
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

    const response = await fetch(`${LYRICS_API_BASE}/lyrics/?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      // Cache failure for 6 hours
      await kv.set(cacheKey, emptyResult, { ex: 6 * 60 * 60 });
      return res.status(200).json(emptyResult);
    }

    const json: ApiResponse = await response.json();

    if (json.status !== "success" || !json.data) {
      // Cache failure for 6 hours
      await kv.set(cacheKey, emptyResult, { ex: 6 * 60 * 60 });
      return res.status(200).json(emptyResult);
    }

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

    // Cache successful lyrics in SQLite KV for 7 days
    await kv.set(cacheKey, result, { ex: 7 * 24 * 60 * 60 });

    return res.status(200).json(result);
  } catch (err) {
    console.error("[API Lyrics Error]", err);
    return res.status(500).json({ error: "Failed to fetch or parse lyrics" });
  }
}
