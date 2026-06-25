import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "@vercel/kv";

const LASTFM_API_KEY  = process.env.LASTFM_API_KEY  as string;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME as string;

type Stats = { playcount: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Stats | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cacheKey = `lastfm-user-stats-${LASTFM_USERNAME}`;

  try {
    const cached = await kv.get<Stats>(cacheKey);
    if (cached) {
      res.setHeader("x-cache", "HIT");
      return res.status(200).json(cached);
    }
  } catch {}

  try {
    const params = new URLSearchParams({
      method: "user.getInfo",
      user: LASTFM_USERNAME,
      api_key: LASTFM_API_KEY,
      format: "json",
    });

    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?${params}`
    );
    if (!response.ok) throw new Error(`Last.fm ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`);

    const result: Stats = {
      playcount: parseInt(data.user?.playcount ?? "0", 10),
    };

    try {
      await kv.set(cacheKey, result, { ex: 60 * 60 }); // 1 hour TTL
    } catch {}

    res.setHeader("x-cache", "MISS");
    return res.status(200).json(result);
  } catch (err) {
    console.error("lastfm-stats failed:", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
}
