import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession, verifyCsrfRequest } from "../../../lib/auth";
import { kv } from "../../../lib/kv";
import { Badge } from "../badges";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Verify Admin Session
  const adminSession = await getAdminSession(req);
  if (!adminSession) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // 2. Handle GET request to read current badges list
  if (req.method === "GET") {
    try {
      const badges = (await kv.get<Badge[]>("web_badges")) || [];
      const sortedBadges = [...badges].sort((a, b) => (a.order || 0) - (b.order || 0));
      return res.status(200).json({ success: true, badges: sortedBadges });
    } catch (e: any) {
      console.error("Failed to fetch web badges (admin):", e);
      return res.status(500).json({ success: false, error: "Failed to fetch web badges" });
    }
  }

  // 3. Handle POST request to update badges list
  if (req.method === "POST") {
    // Verify CSRF
    const isCsrfValid = await verifyCsrfRequest(req);
    if (!isCsrfValid) {
      return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
    }

    const { badges } = req.body;

    if (!Array.isArray(badges)) {
      return res.status(400).json({ success: false, error: "Badges must be an array" });
    }

    try {
      // Basic sanitization and structure verification
      const cleanBadges = badges.map((badge: any, index: number) => {
        if (!badge.id || !badge.imageUrl) {
          throw new Error("Invalid badge data format: missing id or imageUrl");
        }
        return {
          id: String(badge.id),
          title: String(badge.title || ""),
          imageUrl: String(badge.imageUrl),
          linkUrl: badge.linkUrl ? String(badge.linkUrl) : undefined,
          size: badge.size === "80x15" ? "80x15" : "88x31",
          order: typeof badge.order === "number" ? badge.order : index,
        };
      });

      // Save to KV database
      await kv.set("web_badges", cleanBadges);

      return res.status(200).json({
        success: true,
        message: "Web badges saved successfully",
      });
    } catch (e: any) {
      console.error("Failed to save web badges:", e);
      return res.status(500).json({ success: false, error: e.message || "Failed to save web badges" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
