import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";

export interface Badge {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  size: "88x31" | "80x15";
  order: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const badges = (await kv.get<Badge[]>("web_badges")) || [];
    // Ensure they are sorted by order
    const sortedBadges = [...badges].sort((a, b) => (a.order || 0) - (b.order || 0));

    return res.status(200).json({
      success: true,
      badges: sortedBadges,
    });
  } catch (e: any) {
    console.error("Failed to fetch web badges:", e);
    return res.status(500).json({ success: false, error: "Failed to fetch web badges" });
  }
}
