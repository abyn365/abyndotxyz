import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";
import { getAccessToken } from "../../lib/spotify";

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
  canvasUrl?: string;
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

async function fetchCanvasUrl(artist: string, title: string): Promise<string> {
  const cacheKey = `canvas_by_search:${artist.toLowerCase()}:${title.toLowerCase()}`;
  try {
    const cached = await kv.get<string>(cacheKey);
    if (cached !== null) return cached;

    // 1. Get Spotify access token
    const { access_token } = await getAccessToken();

    // 2. Search track on Spotify to get track ID
    const query = `track:${title} artist:${artist}`;
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!searchRes.ok) {
      console.warn(`[Lyrics Canvas] Spotify search returned status ${searchRes.status}`);
      return "";
    }

    const searchData = await searchRes.json();
    const trackId = searchData?.tracks?.items?.[0]?.id;
    if (!trackId) {
      // Cache empty result for 24h to avoid spamming searches
      await kv.set(cacheKey, "", { ex: 24 * 60 * 60 });
      return "";
    }

    // 3. Fetch canvas from Paxsenix using trackId
    const apiKey = process.env.PAXSENIX_API_KEY as string;
    const canvasRes = await fetch(`https://api.paxsenix.org/spotify/canvas?id=${trackId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (canvasRes.ok) {
      const canvasData = await canvasRes.json();
      if (canvasData?.ok && canvasData?.data?.canvasesList?.length > 0) {
        const canvasUrl = canvasData.data.canvasesList[0].canvasUrl || "";
        await kv.set(cacheKey, canvasUrl, { ex: 7 * 24 * 60 * 60 }); // Cache 7 days
        return canvasUrl;
      }
    }

    // Cache empty result for 24h
    await kv.set(cacheKey, "", { ex: 24 * 60 * 60 });
    return "";
  } catch (err) {
    console.error("[Lyrics Canvas] Failed to fetch Spotify canvas:", err);
    return "";
  }
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

    // 2. Fetch from wilooper-lyrica API and Paxsenix Canvas API in parallel
    const params = new URLSearchParams({
      artist: cleanArtist,
      song: cleanSong,
      timestamps: "true",
      fast: "true",
      metadata: "true",
    });

    const lyricsPromise = fetch(`${LYRICS_API_BASE}/lyrics/?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<ApiResponse>;
      })
      .catch((err) => {
        console.error("[API Lyrics Fetch Error]", err);
        return null;
      });

    const canvasPromise = fetchCanvasUrl(cleanArtist, cleanSong);

    const [json, canvasUrl] = await Promise.all([lyricsPromise, canvasPromise]);

    if (!json || json.status !== "success" || !json.data) {
      const emptyResult: LyricsResult = {
        lines: [],
        hasTimestamps: false,
        metadata: {
          title: cleanSong,
          artist: cleanArtist,
          canvasUrl: canvasUrl || undefined,
        },
        error: "No lyrics found",
      };
      // Cache empty result for 6 hours
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
        canvasUrl: canvasUrl || undefined,
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
