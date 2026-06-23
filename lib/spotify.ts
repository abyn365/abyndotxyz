import { kv } from "@vercel/kv";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

const getBasicAuthHeader = () => {
  if (!client_id || !client_secret) {
    throw new Error("Spotify client credentials are missing.");
  }

  return Buffer.from(`${client_id}:${client_secret}`).toString("base64");
};

const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const REFRESH_TOKEN_KV_KEY = "spotify_refresh_token";
const ACCESS_TOKEN_KV_KEY = "spotify_access_token";

export const getAccessToken = async (forceRefresh = false): Promise<{ access_token: string }> => {
  if (!forceRefresh) {
    try {
      // 1. Try to fetch cached access token from Vercel KV
      const cachedAccessToken = await kv.get<string>(ACCESS_TOKEN_KV_KEY);
      if (cachedAccessToken) {
        return { access_token: cachedAccessToken };
      }
    } catch (err) {
      console.error("Failed to read access token from KV:", err);
    }
  } else {
    try {
      // Delete cached access token from KV to force a brand new retrieval
      await kv.del(ACCESS_TOKEN_KV_KEY);
    } catch (err) {
      console.error("Failed to delete expired access token from KV:", err);
    }
  }

  // 2. Resolve refresh token to use (KV first, fallback to initial environment variable)
  let currentRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN as string;
  try {
    const kvRefreshToken = await kv.get<string>(REFRESH_TOKEN_KV_KEY);
    if (kvRefreshToken) {
      currentRefreshToken = kvRefreshToken;
    }
  } catch (err) {
    console.error("Failed to read refresh token from KV:", err);
  }

  if (!currentRefreshToken) {
    throw new Error("No Spotify refresh token found in KV or environment variables.");
  }

  // 3. Request a new token from Spotify
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: currentRefreshToken,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const { access_token, expires_in, refresh_token: newRefreshToken } = data;

  if (!access_token) {
    throw new Error("Spotify token refresh response did not include an access token.");
  }

  // 4. Save new refresh token if Spotify rotated it
  if (newRefreshToken && newRefreshToken !== currentRefreshToken) {
    try {
      await kv.set(REFRESH_TOKEN_KV_KEY, newRefreshToken);
      console.log("Spotify refresh token rotated and saved to KV.");
    } catch (err) {
      console.error("Failed to persist rotated refresh token in KV:", err);
    }
  }

  // 5. Cache the new access token
  if (access_token) {
    try {
      // Cache with a buffer (e.g., 5 minutes early expiration) to avoid clock skew issues
      const ttl = expires_in ? Math.max(expires_in - 300, 60) : 3300;
      await kv.set(ACCESS_TOKEN_KV_KEY, access_token, { ex: ttl });
    } catch (err) {
      console.error("Failed to cache access token in KV:", err);
    }
  }

  return { access_token };
};

export const getNowPlaying = async () => {
  let { access_token } = await getAccessToken();

  let response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.status === 401) {
    console.warn("Spotify now-playing returned 401. Force refreshing token...");
    const freshToken = await getAccessToken(true);
    access_token = freshToken.access_token;

    response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  }

  return response;
};

export async function getTopTracks(timeRange = "short_term") {
  let { access_token } = await getAccessToken();

  let response = await fetch(`${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=50`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.status === 401) {
    console.warn("Spotify getTopTracks returned 401. Force refreshing token...");
    const freshToken = await getAccessToken(true);
    access_token = freshToken.access_token;

    response = await fetch(`${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=50`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  }

  return response;
}
