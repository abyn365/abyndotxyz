import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";
import { getVisitorSession } from "../../lib/auth";
import { getSecret } from "../../lib/secrets";

interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  likes?: string[];
}

const TURNSTILE_SECRET_DEFAULT = "1x0000000000000000000000000000000AA";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const messages = (await kv.get<GuestbookEntry[]>("guestbook")) || [];
      // Sort: newest first
      const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp);
      return res.status(200).json({ success: true, messages: sorted });
    } catch (error) {
      console.error("Guestbook GET error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch messages" });
    }
  }

  if (req.method === "POST") {
    const { name, message, token } = req.body;

    // 1. Resolve Session to check if logged in
    const session = await getVisitorSession(req);

    // 2. Define cleanName: override with session username if logged in
    let cleanName = "";
    if (session) {
      cleanName = session.username;
    } else {
      cleanName = sanitize(name);
    }

    const cleanMessage = sanitize(message);

    if (!cleanName || !cleanMessage) {
      return res.status(400).json({ success: false, error: "Name and message are required" });
    }

    if (cleanName.length > 40) {
      return res.status(400).json({ success: false, error: "Name must be under 40 characters" });
    }

    if (cleanMessage.length > 300) {
      return res.status(400).json({ success: false, error: "Message must be under 300 characters" });
    }

    // 2.5 Blocked words validation
    const blockedWords = (await kv.get<string[]>("admin:blocked_words")) || [];
    const messageLower = cleanMessage.toLowerCase();
    const nameLower = cleanName.toLowerCase();
    const hasBlockedWord = blockedWords.some((word) => 
      messageLower.includes(word) || nameLower.includes(word)
    );

    if (hasBlockedWord) {
      return res.status(400).json({ success: false, error: "Your message or name contains prohibited terms." });
    }

    // 3. Validation for guests (non-logged-in)
    if (!session) {
      const cleanNameLower = cleanName.toLowerCase();

      // Block spoofing admin account
      const adminUser = (await getSecret("ADMIN_USERNAME")) || "abyn";
      if (cleanNameLower === adminUser.toLowerCase()) {
        return res.status(403).json({ success: false, error: "This name is reserved for the administrator. Please log in." });
      }

      // Block spoofing registered visitor accounts
      const exists = await kv.get(`visitor:user:${cleanNameLower}`);
      if (exists) {
        return res.status(403).json({ success: false, error: "This name belongs to a registered account. Please log in." });
      }
    }

    // Verify Cloudflare Turnstile Token
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || TURNSTILE_SECRET_DEFAULT;

    try {
      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(token || "")}`,
        }
      );

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        return res.status(400).json({
          success: false,
          error: "Security verification failed. Please try again.",
        });
      }
    } catch (verifyErr) {
      console.error("Turnstile verification error:", verifyErr);
      return res.status(500).json({
        success: false,
        error: "Failed to verify security token. Please try again later.",
      });
    }

    try {
      // Fetch current, append, save
      const current = (await kv.get<GuestbookEntry[]>("guestbook")) || [];
      const newEntry: GuestbookEntry = {
        id: Math.random().toString(36).substring(2, 11),
        name: cleanName,
        message: cleanMessage,
        timestamp: Date.now(),
        likes: [],
      };

      const updated = [newEntry, ...current];
      // Keep only last 200 entries to maintain performance and scale
      if (updated.length > 200) {
        updated.splice(200);
      }

      await kv.set("guestbook", updated);

      // Send Discord Webhook notification
      try {
        const { sendDiscordWebhook } = await import("../../lib/discord");
        await sendDiscordWebhook({
          title: "📖 New Guestbook Entry",
          color: 16187519, // #F7007F
          description: cleanMessage,
          fields: [
            { name: "Name", value: cleanName, inline: true },
            { name: "Timestamp", value: new Date().toLocaleString(), inline: true }
          ]
        });
      } catch (whErr) {
        console.error("Failed to send guestbook webhook:", whErr);
      }

      return res.status(200).json({ success: true, entry: newEntry });
    } catch (dbErr) {
      console.error("Guestbook POST DB error:", dbErr);
      return res.status(500).json({ success: false, error: "Database save failed" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
