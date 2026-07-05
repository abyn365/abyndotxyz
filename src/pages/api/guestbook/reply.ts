import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../../lib/kv";
import { getVisitorSession, verifyCsrfRequest } from "../../../lib/auth";

interface GuestbookReply {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  likes?: string[];
  replies?: GuestbookReply[];
}

function sanitize(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
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

  // 2. Verify Session (admin fallbacks work dynamically through this)
  const session = await getVisitorSession(req);
  if (!session) {
    return res.status(401).json({ success: false, error: "You must be logged in to reply to entries" });
  }

  const { messageId, message } = req.body;
  if (!messageId || !message) {
    return res.status(400).json({ success: false, error: "messageId and message are required" });
  }

  const cleanMessage = sanitize(message);
  if (!cleanMessage) {
    return res.status(400).json({ success: false, error: "Reply message cannot be empty" });
  }

  if (cleanMessage.length > 200) {
    return res.status(400).json({ success: false, error: "Reply must be under 200 characters" });
  }

  // 2.5 Blocked words validation
  try {
    const blockedWords = (await kv.get<string[]>("admin:blocked_words")) || [];
    const messageLower = cleanMessage.toLowerCase();
    const hasBlockedWord = blockedWords.some((word) => messageLower.includes(word));
    if (hasBlockedWord) {
      return res.status(400).json({ success: false, error: "Your reply contains prohibited terms." });
    }
  } catch (e) {
    console.warn("Blocked words validation warning:", e);
  }

  try {
    const current = (await kv.get<GuestbookEntry[]>("guestbook")) || [];
    const entryIndex = current.findIndex((entry) => entry.id === messageId);

    if (entryIndex === -1) {
      return res.status(404).json({ success: false, error: "Guestbook entry not found" });
    }

    const entry = current[entryIndex];
    const replies = entry.replies || [];

    const newReply: GuestbookReply = {
      id: Math.random().toString(36).substring(2, 11),
      username: session.username,
      message: cleanMessage,
      timestamp: Date.now(),
    };

    replies.push(newReply);
    entry.replies = replies;
    current[entryIndex] = entry;

    await kv.set("guestbook", current);

    // Send Discord Webhook notification
    try {
      const { sendDiscordWebhook } = await import("../../../lib/discord");
      await sendDiscordWebhook({
        title: "✉️ New Guestbook Reply",
        color: 15844367, // #F1C40F
        description: cleanMessage,
        fields: [
          { name: "Author", value: session.username, inline: true },
          { name: "Parent Message ID", value: messageId, inline: true },
          { name: "Timestamp", value: new Date().toLocaleString(), inline: true }
        ]
      });
    } catch (whErr) {
      console.error("Failed to send guestbook reply webhook:", whErr);
    }

    return res.status(200).json({ success: true, reply: newReply });
  } catch (error) {
    console.error("Guestbook reply API error:", error);
    return res.status(500).json({ success: false, error: "Database write failed" });
  }
}
