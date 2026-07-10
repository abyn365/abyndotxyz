import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

// Helper to map IGDB platform names to our custom UI platform IDs
const mapIGDBPlatforms = (platforms: any[]): number[] => {
  if (!Array.isArray(platforms)) return [];
  const ids: number[] = [];
  platforms.forEach((p) => {
    const name = p.name?.toLowerCase();
    if (!name) return;
    if (
      name.includes("win") ||
      name.includes("pc") ||
      name.includes("mac") ||
      name.includes("linux")
    ) {
      if (!ids.includes(0)) ids.push(0);
    }
    if (name.includes("xbox")) {
      if (!ids.includes(1)) ids.push(1);
    }
    if (name.includes("playstation") || name.includes("ps")) {
      if (!ids.includes(2)) ids.push(2);
    }
    if (name.includes("ios")) {
      if (!ids.includes(3)) ids.push(3);
    }
    if (name.includes("android")) {
      if (!ids.includes(4)) ids.push(4);
    }
    if (name.includes("switch")) {
      if (!ids.includes(5)) ids.push(5);
    }
  });
  return ids;
};

// Retrieve or refresh Twitch Client Credentials Access Token
async function getTwitchToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const cacheKey = "twitch_oauth_token";
  try {
    const cached = await kv.get<string>(cacheKey);
    if (cached) return cached;
  } catch (err) {
    console.warn("Twitch token cache read failed, fetching fresh:", err);
  }

  try {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!res.ok) {
      console.error("Twitch OAuth token fetch failed:", await res.text());
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      const ttl = Math.max(60, data.expires_in - 60);
      try {
        await kv.set(cacheKey, data.access_token, { ex: ttl });
      } catch (err) {
        console.warn("Twitch token cache write failed:", err);
      }
      return data.access_token;
    }
  } catch (err) {
    console.error("Error fetching Twitch token:", err);
  }
  return null;
}

// Search and retrieve game details from IGDB
async function fetchFromIGDB(gameName: string): Promise<any | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const token = await getTwitchToken();
  if (!clientId || !token) return null;

  try {
    const query = `
      search "${gameName.replace(/"/g, '\\"')}";
      fields name, summary, first_release_date, total_rating, total_rating_count,
             cover.url, screenshots.url, genres.name, platforms.name,
             involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
      limit 1;
    `;

    const res = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: query.trim(),
    });

    if (!res.ok) {
      console.error("IGDB query failed:", await res.text());
      return null;
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
  } catch (err) {
    console.error("Error querying IGDB:", err);
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { gameId, name } = req.query;
  if (!gameId || typeof gameId !== "string" || !/^\d+$/.test(gameId)) {
    return res.status(400).json({ error: "Missing or invalid gameId query parameter" });
  }

  const gameName = typeof name === "string" && name.trim() ? name.trim() : null;
  const cacheKey = `game_profile:${gameId}`;

  try {
    // Check SQLite KV cache first
    const cached = await kv.get<any>(cacheKey);
    const userToken = process.env.DISCORD_USER_TOKEN || process.env.DISCORD_TOKEN;
    if (cached) {
      // If it was cached as a fallback without a user token, but we have a user token now, bypass the cache to re-fetch
      const cacheNeedsReFetch = cached.is_fallback && !cached.has_user_token && userToken;
      if (!cacheNeedsReFetch) {
        return res.status(200).json(cached);
      }
    }

    // 1. Try IGDB first (safer, rich search method using name) if credentials are set
    if (gameName && process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
      const igdbData = await fetchFromIGDB(gameName);
      if (igdbData) {
        const developers = igdbData.involved_companies
          ?.filter((c: any) => c.developer)
          ?.map((c: any) => c.company?.name) || [];
        const publishers = igdbData.involved_companies
          ?.filter((c: any) => c.publisher)
          ?.map((c: any) => c.company?.name) || [];

        const screenshots = igdbData.screenshots
          ?.map((s: any) => s.url ? `https:${s.url.replace("t_thumb", "t_screenshot_big")}` : null)
          ?.filter(Boolean) || [];

        const coverUrl = igdbData.cover?.url
          ? `https:${igdbData.cover.url.replace("t_thumb", "t_cover_big")}`
          : null;

        const formattedData = {
          id: gameId,
          name: igdbData.name || gameName,
          platforms: mapIGDBPlatforms(igdbData.platforms),
          genres: igdbData.genres?.map((g: any) => g.name).filter(Boolean) || [],
          supplemental_game_data: {
            summary: igdbData.summary || null,
            cover_image_url: coverUrl,
            developer_names: developers,
            publisher_names: publishers,
            first_release_date: igdbData.first_release_date ? igdbData.first_release_date * 1000 : null,
            screenshot_urls: screenshots,
            reviews: {
              steam: igdbData.total_rating ? {
                rating: igdbData.total_rating / 100,
                rating_count: igdbData.total_rating_count || 0
              } : null
            },
            websites: []
          }
        };

        await kv.set(cacheKey, formattedData, { ex: CACHE_TTL });
        return res.status(200).json(formattedData);
      }
    }

    // 2. Try Discord Games API (via DISCORD_TOKEN / DISCORD_USER_TOKEN or DISCORD_BOT_TOKEN)
    // Removed duplicate const userToken declaration here since it's already defined above
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const authHeader = userToken ? userToken : botToken ? `Bot ${botToken}` : null;

    if (authHeader) {
      const response = await fetch(
        `https://discord.com/api/v9/games/${gameId}?with_supplemental_data=true`,
        {
          headers: {
            Authorization: authHeader,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        await kv.set(cacheKey, data, { ex: CACHE_TTL });
        return res.status(200).json(data);
      } else {
        const errorText = await response.text();
        console.warn(`Discord Games API returned status ${response.status} for ${gameId}:`, errorText);
      }
    }

    // 3. Final Fallback (Unverified or API failure)
    const fallbackData = {
      id: gameId,
      name: gameName || "Verified Application",
      is_fallback: true,
      has_user_token: !!userToken,
      error_message: "No supplementary details found. Fallback view activated.",
    };

    // Cache fallback data for 1 hour
    await kv.set(cacheKey, fallbackData, { ex: 60 * 60 });
    return res.status(200).json(fallbackData);
  } catch (err: any) {
    console.error("[game-profile API Error]", err);
    return res.status(200).json({
      id: gameId,
      name: gameName || "Verified Application",
      is_fallback: true,
      has_user_token: !!(process.env.DISCORD_USER_TOKEN || process.env.DISCORD_TOKEN),
      error_message: err.message || String(err),
    });
  }
}
