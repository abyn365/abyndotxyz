import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";

export interface ActivityHistoryEntry {
  applicationId?: string;
  name: string;
  details?: string;
  state?: string;
  largeImage?: string;
  smallImage?: string;
  lastSeen: number;
}

const HISTORY_KEY = "discord_activity_history";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const history = await kv.get<ActivityHistoryEntry[]>(HISTORY_KEY) || [];
      // Clean up entries older than 30 days
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = history.filter(item => item.lastSeen > thirtyDaysAgo);
      
      // Sort desc
      filtered.sort((a, b) => b.lastSeen - a.lastSeen);
      
      if (filtered.length !== history.length) {
        await kv.set(HISTORY_KEY, filtered);
      }

      return res.status(200).json({ activities: filtered });
    } catch (err: any) {
      console.error("[discord-activities GET Error]", err);
      return res.status(500).json({ error: "Failed to load activity history" });
    }
  }

  if (req.method === "POST") {
    try {
      const { activities } = req.body;
      if (!Array.isArray(activities)) {
        return res.status(400).json({ error: "Invalid activities format. Expected array." });
      }

      const history = await kv.get<ActivityHistoryEntry[]>(HISTORY_KEY) || [];
      const now = Date.now();
      let updated = false;

      for (const act of activities) {
        // Filter out Spotify, Custom Status (type 4), and PreMiD
        const name = act.name || "";
        const isPreMiD = /pre.?mid/i.test(name) || /pre.?mid/i.test(act.assets?.large_text || "") || /pre.?mid/i.test(act.assets?.small_text || "");
        if (
          name === "Spotify" ||
          act.type === 4 ||
          isPreMiD
        ) {
          continue;
        }

        // We require name to be present
        if (!name.trim()) continue;

        // Try to match existing activity by applicationId or name
        const matchIndex = history.findIndex(
          (item) =>
            (act.application_id && item.applicationId === act.application_id) ||
            (!act.application_id && item.name.toLowerCase() === name.toLowerCase())
        );

        const newEntry: ActivityHistoryEntry = {
          applicationId: act.application_id || undefined,
          name,
          details: act.details || undefined,
          state: act.state || undefined,
          largeImage: act.assets?.large_image || undefined,
          smallImage: act.assets?.small_image || undefined,
          lastSeen: now,
        };

        if (matchIndex > -1) {
          // Update details, state, images and refresh lastSeen
          const existing = history[matchIndex];
          history[matchIndex] = {
            ...existing,
            ...newEntry,
            // Retain original properties if they are undefined in updates
            details: act.details || existing.details,
            state: act.state || existing.state,
            largeImage: act.assets?.large_image || existing.largeImage,
            smallImage: act.assets?.small_image || existing.smallImage,
            lastSeen: now,
          };
        } else {
          history.push(newEntry);
        }
        updated = true;
      }

      if (updated) {
        // Sort and limit to top 30
        const sorted = history
          .filter(item => item.lastSeen > now - 30 * 24 * 60 * 60 * 1000)
          .sort((a, b) => b.lastSeen - a.lastSeen)
          .slice(0, 30);
        await kv.set(HISTORY_KEY, sorted);
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("[discord-activities POST Error]", err);
      return res.status(500).json({ error: "Failed to record activity" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
