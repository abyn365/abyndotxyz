import { NextApiRequest, NextApiResponse } from "next";
import { searchTrack } from "../../lib/music/extractor";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, artist } = req.query;

  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist query parameters" });
  }

  try {
    const searchQuery = `${title} ${artist}`;
    const result = await searchTrack(searchQuery);

    if (!result) {
      return res.status(404).json({ error: "No track resolved from any source" });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("[API Resolve Track Error]", err);
    return res.status(500).json({ error: "Failed to resolve playback track" });
  }
}
