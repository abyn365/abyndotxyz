import { kv } from "./kv";
import crypto from "crypto";

const WEB_PLAYER_CLIENT_ID = "d8a5ed958d274c2e8ee717e6a4b0971d";
const PATHFINDER_URL = "https://api-partner.spotify.com/pathfinder/v2/query";
const CANVAS_QUERY_HASH = "575138ab27cd5c1b3e54da54d0a7cc8d85485402de26340c2145f0f6bb5e7a9f";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SECRETS_URL = "https://raw.githubusercontent.com/xyloflake/spot-secrets-go/refs/heads/main/secrets/secretDict.json";

interface ClientTokenResponse {
  granted_token?: {
    token: string;
  };
}

// Pure TS TOTP implementation
function generateTOTP(secretHex: string, timeSeconds: number): string {
  const secret = Buffer.from(secretHex, "hex");
  const counter = Math.floor(timeSeconds / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(0, 0);
  counterBuffer.writeUInt32BE(counter, 4);

  const hmac = crypto.createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 1000000).toString().padStart(6, "0");
}

async function getSecretsDict(): Promise<Record<string, number[]>> {
  const cacheKey = "spotify_secrets_dict";
  const cached = await kv.get<Record<string, number[]>>(cacheKey);
  if (cached) return cached;

  console.log("[Canvas In-House] Fetching fresh TOTP secrets from GitHub...");
  const res = await fetch(SECRETS_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch TOTP secrets dict: ${res.status}`);
  }
  const data = await res.json() as Record<string, number[]>;
  await kv.set(cacheKey, data, { ex: 24 * 60 * 60 }); // Cache 24 hours
  return data;
}

async function getServerTimeSeconds(spDc: string): Promise<number> {
  try {
    const res = await fetch("https://open.spotify.com/api/server-time", {
      headers: {
        "User-Agent": USER_AGENT,
        "Cookie": `sp_dc=${spDc}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      const time = Number(data.serverTime);
      if (!isNaN(time)) return time;
    }
  } catch (err) {
    console.warn("[Canvas In-House] Failed to fetch server time, using local clock:", err);
  }
  return Math.floor(Date.now() / 1000);
}

/**
 * Fetches a Web Player Access Token from Spotify using the sp_dc cookie and TOTP authentication.
 */
async function fetchWebPlayerAccessToken(spDc: string): Promise<string> {
  const cacheKey = "spotify_web_player_token";
  const cached = await kv.get<string>(cacheKey);
  if (cached) return cached;

  console.log("[Canvas In-House] Fetching fresh Web Player access token via TOTP /api/token...");
  
  // 1. Get secrets dictionary and determine latest TOTP key
  const secrets = await getSecretsDict();
  const versions = Object.keys(secrets).map(Number);
  const newestVersion = Math.max(...versions).toString();
  const newestData = secrets[newestVersion];
  if (!newestData) {
    throw new Error("Could not find valid TOTP data in secrets dictionary");
  }

  // 2. Decrypt the secret to hex
  const mapped = newestData.map((val, idx) => val ^ ((idx % 33) + 9));
  const secretHex = Buffer.from(mapped.join(""), "utf8").toString("hex");

  // 3. Generate TOTPs for verification
  const localTimeSeconds = Math.floor(Date.now() / 1000);
  const serverTimeSeconds = await getServerTimeSeconds(spDc);

  const totp = generateTOTP(secretHex, localTimeSeconds);
  const totpServer = generateTOTP(secretHex, Math.floor((serverTimeSeconds * 1000) / 30));

  // 4. Request the token
  const url = new URL("https://open.spotify.com/api/token");
  url.searchParams.append("reason", "init");
  url.searchParams.append("productType", "mobile-web-player");
  url.searchParams.append("totp", totp);
  url.searchParams.append("totpVer", newestVersion);
  url.searchParams.append("totpServer", totpServer);

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
      "Cookie": `sp_dc=${spDc}`,
      "Origin": "https://open.spotify.com/",
      "Referer": "https://open.spotify.com/",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get Web Player access token: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const token = data?.accessToken;
  if (!token) {
    throw new Error("No accessToken found in /api/token response");
  }

  // Cache access token for 45 minutes
  await kv.set(cacheKey, token, { ex: 45 * 60 });
  return token;
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
