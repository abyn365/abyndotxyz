import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CACHE_TTL = 5 * 60; // 5 minutes cache

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { guildId } = req.query;
  if (!guildId || typeof guildId !== "string" || !/^\d+$/.test(guildId)) {
    return res.status(400).json({ error: "Missing or invalid guildId" });
  }

  const cacheKey = `guild_profile:${guildId}`;

  try {
    // Check cache
    const cached = await kv.get<any>(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    let rawData: any = null;
    let fetched = false;

    // 1. Try Discord API first if bot token is set
    if (BOT_TOKEN) {
      try {
        const discordRes = await fetch(
          `https://discord.com/api/v9/guilds/${guildId}/profile`,
          {
            headers: {
              Authorization: `Bot ${BOT_TOKEN}`,
              Accept: "application/json",
            },
          }
        );

        if (discordRes.ok) {
          rawData = await discordRes.json();
          fetched = true;
        } else {
          console.warn(
            `[guild-profile] Discord Guild API returned ${discordRes.status} for server ${guildId}, trying fallback.`
          );
        }
      } catch (err) {
        console.warn("[guild-profile] Discord Guild API failed, falling back:", err);
      }
    }

    // 2. Fallback to Dustin API
    if (!fetched) {
      const fallbackUrl = `https://dcdn.dstn.to/guilds/${guildId}`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        rawData = await fallbackRes.json();
        fetched = true;
      } else {
        console.error(
          `[guild-profile] Both Discord and Dustin API failed to fetch guild ${guildId}`
        );
        return res.status(404).json({ error: "Guild not found on any source" });
      }
    }

    // Defensively parse unified structure
    const guild = rawData.guild || rawData;
    const unified = {
      id: guild.id || guildId,
      name: guild.name || "Unknown Server",
      icon: guild.icon || guild.icon_hash || null,
      banner: guild.banner || guild.banner_hash || guild.custom_banner_hash || null,
      description: guild.description || null,
      approximate_member_count: rawData.approximate_member_count ?? guild.approximate_member_count ?? rawData.member_count ?? guild.member_count ?? null,
      approximate_presence_count: rawData.approximate_presence_count ?? guild.approximate_presence_count ?? rawData.online_count ?? guild.online_count ?? null,
      features: guild.features || [],
    };

    // Cache responses
    await kv.set(cacheKey, unified, { ex: CACHE_TTL });

    return res.status(200).json(unified);
  } catch (err: any) {
    console.error("[guild-profile error]", err);
    return res.status(500).json({
      error: "Internal server error fetching guild profile",
      message: err.message || String(err),
    });
  }
}
