import { NextApiRequest, NextApiResponse } from "next";
import { searchYouTube } from "../../lib/music/youtube";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, artist, exclude } = req.query;

  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist query parameters" });
  }

  const excludeList = exclude ? (exclude as string).split(",") : [];

  try {
    const result = await searchYouTube(
      title as string,
      artist as string,
      undefined,
      excludeList,
      true // flag as server-side to execute direct fetch
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("[API YouTube Search Error]", err);
    return res.status(500).json({ error: "YouTube search failed" });
  }
}
