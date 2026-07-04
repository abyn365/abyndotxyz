import { NextApiRequest, NextApiResponse } from "next";
import { resolveTrackStream } from "../../lib/music/extractor";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, url } = req.query;
  const target = (url as string) || (id as string);

  if (!target) {
    return res.status(400).json({ error: "Missing id or url query parameter" });
  }

  try {
    // Resolve stream URL using our yt-dlp extractor (handles cache lookup/refreshes)
    const track = await resolveTrackStream(target);
    if (!track.streamUrl) {
      return res.status(404).json({ error: "Could not resolve stream URL for track" });
    }

    // Set up request to the stream URL
    const range = req.headers.range;
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    if (range) {
      headers["Range"] = range;
    }

    const response = await fetch(track.streamUrl, { headers });

    // Set status and forward core headers to support range requests and seeking
    res.status(response.status);
    
    // Core headers for media streaming
    const forwardHeaders = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control"
    ];

    for (const header of forwardHeaders) {
      const val = response.headers.get(header);
      if (val) {
        res.setHeader(header, val);
      }
    }

    // Pipe the body chunks
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    
    res.end();
  } catch (err) {
    console.error("[API Stream Error]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream audio" });
    }
  }
}
