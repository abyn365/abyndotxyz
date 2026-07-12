import { kv } from "./kv";
import crypto from "crypto";

const WEB_PLAYER_CLIENT_ID = "d8a5ed958d274c2e8ee717e6a4b0971d";
const PATHFINDER_URL = "https://api-partner.spotify.com/pathfinder/v2/query";
const CANVAS_QUERY_HASH = "575138ab27cd5c1b3e54da54d0a7cc8d85485402de26340c2145f0f6bb5e7a9f";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface WebPlayerTokenResponse {
  accessToken: string;
  accessTokenExpirationTimestampMs: number;
}

interface ClientTokenResponse {
  granted_token?: {
    token: string;
  };
}

/**
 * Fetches a Web Player Access Token from Spotify using the sp_dc cookie.
 */
async function fetchWebPlayerAccessToken(spDc: string): Promise<string> {
  const cacheKey = "spotify_web_player_token";
  const cached = await kv.get<string>(cacheKey);
  if (cached) return cached;

  console.log("[Canvas In-House] Fetching fresh Web Player access token using sp_dc...");
  const res = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
    headers: {
      "User-Agent": USER_AGENT,
      "Cookie": `sp_dc=${spDc}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get Web Player access token: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as WebPlayerTokenResponse;
  if (!data.accessToken) {
    throw new Error("No accessToken found in get_access_token response");
  }

  // Calculate TTL in seconds (expire 5 minutes early to be safe)
  const expiresAt = data.accessTokenExpirationTimestampMs;
  const ttl = Math.max(60, Math.floor((expiresAt - Date.now()) / 1000) - 300);

  await kv.set(cacheKey, data.accessToken, { ex: ttl });
  return data.accessToken;
}

/**
 * Fetches a Client Token from Spotify using the official Web Player Client ID.
 */
async function fetchClientToken(): Promise<string> {
  const cacheKey = "spotify_client_token";
  const cached = await kv.get<string>(cacheKey);
  if (cached) return cached;

  console.log("[Canvas In-House] Fetching fresh client-token...");
  const deviceId = crypto.randomUUID();
  const res = await fetch("https://clienttoken.spotify.com/v1/clienttoken", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      client_data: {
        client_version: "1.2.13.477.ga4363038",
        client_id: WEB_PLAYER_CLIENT_ID,
        js_sdk_data: {
          device_brand: "unknown",
          device_model: "unknown",
          os: "windows",
          os_version: "NT 10.0",
          device_id: deviceId,
          device_type: "computer",
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get client-token: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as ClientTokenResponse;
  const token = data?.granted_token?.token;
  if (!token) {
    throw new Error("No token found in clienttoken response");
  }

  // Cache client token for 1 hour
  await kv.set(cacheKey, token, { ex: 60 * 60 });
  return token;
}

/**
 * Resolves a Spotify Canvas URL for a track using internal partner GraphQL API.
 */
export async function getCanvasInHouse(trackId: string, spDc: string): Promise<string> {
  try {
    const webPlayerToken = await fetchWebPlayerAccessToken(spDc);
    const clientToken = await fetchClientToken();

    const trackUri = `spotify:track:${trackId}`;
    const res = await fetch(PATHFINDER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${webPlayerToken}`,
        "client-token": clientToken,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        operationName: "canvas",
        variables: {
          trackUri,
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: CANVAS_QUERY_HASH,
          },
        },
      }),
    });

    if (!res.ok) {
      console.warn(`[Canvas In-House] Pathfinder query failed with status ${res.status}`);
      return "";
    }

    const body = await res.json();
    const canvasUrl = body?.data?.trackUnion?.canvas?.url || "";
    return canvasUrl;
  } catch (err) {
    console.error("[Canvas In-House Error] Failed to fetch canvas:", err);
    return "";
  }
}
