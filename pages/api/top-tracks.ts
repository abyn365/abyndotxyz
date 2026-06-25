import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "@vercel/kv";
import { type MusicTrack } from "../../lib/music";
import { fetchTopTracks, resolveTrackCoverArt } from "../../lib/lastfm";

const LASTFM_USERNAME = process.env.LASTFM_USERNAME as string;

const PERIOD_MAP: Record<string, string> = {
  week: "7day",
  short: "1month",
  medium: "6month",
  long: "12month",
};

const CACHE_TTL_MAP: Record<string, number> = {
  week: 2 * 60 * 60,
  short: 6 * 60 * 60,
  medium: 24 * 60 * 60,
  long: 7 * 24 * 60 * 60,
};

const CACHE_KEY_PREFIX = "lastfm-top-tracks-v2";

type TopTracksResponse = {
  tracks: MusicTrack[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TopTracksResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const period = (req.query.period as string) || "short";
  const lastfmPeriod = PERIOD_MAP[period] ?? PERIOD_MAP.short;
  const cacheKey = `${CACHE_KEY_PREFIX}-${period}`;
  const cacheTtl = CACHE_TTL_MAP[period] ?? CACHE_TTL_MAP.short;

  try {
    const cached = await kv.get<TopTracksResponse>(cacheKey);
    if (cached) {
      res.setHeader("x-cache", "HIT");
      res.setHeader("cache-control", "public, max-age=300");
      return res.status(200).json(cached);
    }
  } catch (error) {
    console.error("KV read error:", error);
  }

  try {
    if (!LASTFM_USERNAME) {
      throw new Error("LASTFM_USERNAME environment variable is not set");
    }

    const rawTracks = await fetchTopTracks(LASTFM_USERNAME, lastfmPeriod);

    if (!rawTracks.length) {
      const emptyResponse: TopTracksResponse = { tracks: [] };
      try {
        await kv.set(cacheKey, emptyResponse, { ex: 300 });
      } catch {}
      return res.status(200).json(emptyResponse);
    }

    const tracks = await Promise.all(
      rawTracks.map(async (track, index): Promise<MusicTrack> => {
        const cover = await resolveTrackCoverArt({
          artist: track.artist.name,
          track: track.name,
          topTrackImages: track.image,
          username: LASTFM_USERNAME,
        });

        return {
          title: track.name,
          artist: track.artist.name,
          cover,
          songUrl: track.url,
          playcount: Number.parseInt(track.playcount, 10) || 0,
          rank: Number.parseInt(track["@attr"]?.rank, 10) || index + 1,
        };
      })
    );

    const responseData: TopTracksResponse = { tracks };

    try {
      await kv.set(cacheKey, responseData, { ex: cacheTtl });
    } catch (error) {
      console.error("KV write error:", error);
    }

    res.setHeader("x-cache", "MISS");
    res.setHeader("cache-control", "public, max-age=300");
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Last.fm top-tracks fetch failed:", error);

    try {
      const cached = await kv.get<TopTracksResponse>(cacheKey);
      if (cached) {
        res.setHeader("x-cache", "STALE");
        return res.status(200).json(cached);
      }
    } catch {}

    return res.status(500).json({ error: "Failed to fetch top tracks" });
  }
}
