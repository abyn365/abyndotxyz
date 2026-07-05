import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../../lib/kv";
import { getVisitorSession, verifyCsrfRequest } from "../../../lib/auth";

interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  likes?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Verify CSRF Token
  const isCsrfValid = await verifyCsrfRequest(req);
  if (!isCsrfValid) {
    return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
  }

  // 2. Verify Visitor Session
  const visitorSession = await getVisitorSession(req);
  if (!visitorSession) {
    return res.status(401).json({ success: false, error: "You must be signed in to like guestbook messages" });
  }

  const { messageId } = req.body;
  if (!messageId || typeof messageId !== "string") {
    return res.status(400).json({ success: false, error: "messageId is required" });
  }

  try {
    const current = (await kv.get<GuestbookEntry[]>("guestbook")) || [];
    const entryIndex = current.findIndex((entry) => entry.id === messageId);

    if (entryIndex === -1) {
      return res.status(404).json({ success: false, error: "Guestbook message not found" });
    }

    const entry = current[entryIndex];
    const likes = entry.likes || [];
    const username = visitorSession.username;
    
    const likeIndex = likes.indexOf(username);
    if (likeIndex > -1) {
      likes.splice(likeIndex, 1); // Unlike
    } else {
      likes.push(username); // Like
    }

    entry.likes = likes;
    current[entryIndex] = entry;

    await kv.set("guestbook", current);

    return res.status(200).json({ success: true, likes });
  } catch (error) {
    console.error("Guestbook like error:", error);
    return res.status(500).json({ success: false, error: "Failed to update guestbook like status" });
  }
}
