import { NextApiRequest, NextApiResponse } from "next";
import { searchTrack } from "../../lib/music/extractor";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, artist, album, quality } = req.query;
  const qHint = quality === "low" ? "low" : "high";

  const tStr = typeof title === "string" ? title.trim() : "";
  const aStr = typeof artist === "string" ? artist.trim() : "";
  const alStr = typeof album === "string" ? album.trim() : "";

  if (!tStr || !aStr || tStr === "undefined" || tStr === "null" || aStr === "undefined" || aStr === "null") {
    return res.status(400).json({ error: "Missing or invalid title or artist query parameters" });
  }

  try {
    const searchQuery = alStr && alStr !== "undefined" && alStr !== "null"
      ? `${tStr} ${aStr} ${alStr}`
      : `${tStr} ${aStr}`;
    const result = await searchTrack(searchQuery, undefined, qHint);

    if (!result) {
      return res.status(404).json({ error: "No track resolved from any source" });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("[API Resolve Track Error]", err);
    return res.status(500).json({ error: "Failed to resolve playback track" });
  }
}
