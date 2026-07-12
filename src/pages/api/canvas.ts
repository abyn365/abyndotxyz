import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";
import { getAccessToken } from "../../lib/spotify";
import { getCanvasInHouse } from "../../lib/spotify-canvas";

async function fetchCanvasUrl(artist: string, title: string): Promise<string> {
  const cacheKey = `canvas_by_search:${artist.toLowerCase()}:${title.toLowerCase()}`;
  try {
    const cached = await kv.get<string>(cacheKey);
    if (cached !== null) return cached;

    // 1. Get Spotify access token
    const { access_token } = await getAccessToken();

    // 2. Search track on Spotify to get track ID
    const query = `${title} ${artist}`;
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!searchRes.ok) {
      console.warn(`[Canvas API] Spotify search returned status ${searchRes.status}`);
      return "";
    }

    const searchData = await searchRes.json();
    const trackId = searchData?.tracks?.items?.[0]?.id;
    if (!trackId) {
      await kv.set(cacheKey, "", { ex: 10 * 60 }); // Cache empty for 10 minutes only
      return "";
    }

    // 3. Try In-House Solution first (if SPOTIFY_SP_DC is configured)
    const spDc = process.env.SPOTIFY_SP_DC;
    if (spDc) {
      console.log(`[Canvas API] Resolving canvas in-house for track: ${trackId}`);
      const inHouseUrl = await getCanvasInHouse(trackId, spDc);
      if (inHouseUrl) {
        await kv.set(cacheKey, inHouseUrl, { ex: 7 * 24 * 60 * 60 }); // Cache 7 days
        return inHouseUrl;
      }
      console.warn(`[Canvas API] In-house resolution returned empty. Falling back to Paxsenix...`);
    } else {
      console.info(`[Canvas API] SPOTIFY_SP_DC not configured. Falling back to Paxsenix...`);
    }

    // 4. Fetch canvas from Paxsenix using trackId (Fallback)
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

    await kv.set(cacheKey, "", { ex: 10 * 60 }); // Cache empty for 10 minutes only
    return "";
  } catch (err) {
    console.error("[Canvas API] Failed to fetch Spotify canvas:", err);
    return "";
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { artist, title } = req.query;

  if (!artist || typeof artist !== "string" || !title || typeof title !== "string") {
    return res.status(400).json({ error: "Missing or invalid artist or title parameters" });
  }

  try {
    const canvasUrl = await fetchCanvasUrl(artist.trim(), title.trim());
    return res.status(200).json({ canvasUrl });
  } catch (err) {
    console.error("[Canvas API Error]", err);
    return res.status(500).json({ error: "Failed to fetch canvas" });
  }
}
