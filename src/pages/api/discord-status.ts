import type { NextApiRequest, NextApiResponse } from "next";
import {
  DISCORD_ID,
  getActiveDevice,
  transformPresence,
} from "../../lib/discord";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(
      `https://api.lanyard.rest/v1/users/${DISCORD_ID}`
    );

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch Discord status" });
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return res.status(400).json({ error: "Failed to fetch Discord status" });
    }

    const presence = data.data;
    const activeDevice = getActiveDevice(presence);
    const transformed = transformPresence(presence);

    return res.status(200).json({
      status: presence.discord_status,
      activeDevice,
      isOnline: Boolean(activeDevice),
      isActive: Boolean(transformed.activity),
      activity: transformed.activity,
      spotify: transformed.spotify,
    });
  } catch (error) {
    console.error("Discord status error:", error);
    return res.status(500).json({ error: "Failed to fetch Discord status" });
  }
}
