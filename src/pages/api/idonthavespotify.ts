import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid url parameter" });
  }

  try {
    const cacheKey = `idonthavespotify:${url}`;
    const cachedData = await kv.get<any>(cacheKey);
    if (cachedData !== null) {
      return res.status(200).json(cachedData);
    }

    const apiKey = process.env.PAXSENIX_API_KEY as string;
    const response = await fetch(`https://api.paxsenix.org/tools/idonthavespotify?url=${encodeURIComponent(url)}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from Paxsenix API" });
    }

    const data = await response.json();
    
    // Cache the mapping results for 7 days
    await kv.set(cacheKey, data, { ex: 7 * 24 * 60 * 60 });

    return res.status(200).json(data);
  } catch (err) {
    console.error("[API IDonTHaveSpotify Error]", err);
    return res.status(500).json({ error: "Failed to resolve fallback track" });
  }
}
