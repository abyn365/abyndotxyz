import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession, verifyCsrfRequest } from "../../../lib/auth";
import { kv } from "../../../lib/kv";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Verify Admin Session (required for both GET and POST)
  const adminSession = await getAdminSession(req);
  if (!adminSession) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // Handle GET request to load moderation settings
  if (req.method === "GET") {
    try {
      const blockedUsernames = (await kv.get<string[]>("admin:blocked_usernames")) || [
        "admin",
        "administrator",
        "moderator",
        "owner",
        "staff",
        "support",
        "system"
      ];
      const blockedWords = (await kv.get<string[]>("admin:blocked_words")) || [];

      return res.status(200).json({
        success: true,
        blockedUsernames,
        blockedWords
      });
    } catch (e) {
      console.error("Moderation load error:", e);
      return res.status(500).json({ success: false, error: "Failed to load moderation settings" });
    }
  }

  // Handle POST request to update moderation settings
  if (req.method === "POST") {
    // Verify CSRF
    const isCsrfValid = await verifyCsrfRequest(req);
    if (!isCsrfValid) {
      return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
    }

    const { blockedUsernames, blockedWords } = req.body;

    if (!Array.isArray(blockedUsernames) || !Array.isArray(blockedWords)) {
      return res.status(400).json({ success: false, error: "blockedUsernames and blockedWords must be arrays of strings" });
    }

    try {
      // Clean and sanitize lists
      const cleanUsernames = blockedUsernames
        .map((u: string) => u.trim().toLowerCase())
        .filter((u: string) => u.length > 0);
      
      const cleanWords = blockedWords
        .map((w: string) => w.trim().toLowerCase())
        .filter((w: string) => w.length > 0);

      // Save to KV database
      await kv.set("admin:blocked_usernames", cleanUsernames);
      await kv.set("admin:blocked_words", cleanWords);

      return res.status(200).json({
        success: true,
        message: "Moderation settings updated successfully"
      });
    } catch (e) {
      console.error("Moderation save error:", e);
      return res.status(500).json({ success: false, error: "Failed to save moderation settings" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
