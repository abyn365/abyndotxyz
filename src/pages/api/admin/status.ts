import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession } from "../../../lib/auth";
import { kv } from "../../../lib/kv";
import { isS3Enabled, getS3Client } from "../../../lib/s3";

// Helper to run a fetch with a timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Verify Admin Session
  const adminSession = await getAdminSession(req);
  if (!adminSession) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const status: Record<string, { status: "online" | "offline" | "disabled" | "warning"; latency?: number; details?: string }> = {};

  // Run checks in parallel
  const checks = [
    // Database Check
    (async () => {
      const start = Date.now();
      try {
        await kv.set("health_check_key", "ok");
        const val = await kv.get("health_check_key");
        if (val === "ok") {
          status.database = { status: "online", latency: Date.now() - start, details: "SQLite DB writable" };
        } else {
          status.database = { status: "warning", details: "SQLite DB read mismatch" };
        }
      } catch (err: any) {
        status.database = { status: "offline", details: err.message || "SQLite connection failed" };
      }
    })(),

    // S3 Cloud Storage Check
    (async () => {
      const start = Date.now();
      if (!isS3Enabled()) {
        status.s3 = { status: "disabled", details: "Credentials not configured in .env" };
        return;
      }

      try {
        const s3 = getS3Client();
        // Check if we can instantiate and list
        const fileRef = s3.file("blog/health.txt");
        const { write } = require("bun");
        await write(fileRef, "ok");
        const text = await fileRef.text();
        if (text === "ok") {
          status.s3 = { status: "online", latency: Date.now() - start, details: "S3-compatible R2 Bucket writable" };
        } else {
          status.s3 = { status: "warning", details: "R2 Bucket write/read verification mismatch" };
        }
      } catch (err: any) {
        let details = err.message || "Failed S3 write test";
        if (details.includes("Unauthorized") || details.includes("401") || details.includes("bucket cannot be viewed") || details.includes("S3Error")) {
          details = "Unauthorized (401). Ensure S3_ENDPOINT is your Cloudflare R2 API URL, not your public custom domain (s3.abyn.xyz).";
        }
        status.s3 = { status: "offline", details };
      }
    })(),

    // Lanyard (Discord Status) Check
    (async () => {
      const start = Date.now();
      const discordId = process.env.DISCORD_ID || process.env.NEXT_PUBLIC_DISCORD_ID || "1036069904797827173"; // fallback or default
      try {
        const response = await fetchWithTimeout(`https://api.lanyard.rest/v1/users/${discordId}`);
        if (response.ok) {
          status.lanyard = { status: "online", latency: Date.now() - start, details: "Lanyard REST API reachable" };
        } else {
          status.lanyard = { status: "warning", details: `Lanyard returned HTTP ${response.status}` };
        }
      } catch (err: any) {
        status.lanyard = { status: "offline", details: "Lanyard REST API connection timeout" };
      }
    })(),

    // Last.fm Check
    (async () => {
      const start = Date.now();
      const apiKey = process.env.LASTFM_API_KEY;
      if (!apiKey) {
        status.lastfm = { status: "disabled", details: "LASTFM_API_KEY missing in .env" };
        return;
      }
      try {
        const response = await fetchWithTimeout(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${process.env.LASTFM_USERNAME || "abynb"}&api_key=${apiKey}&format=json`);
        if (response.ok) {
          status.lastfm = { status: "online", latency: Date.now() - start, details: "Last.fm API online" };
        } else {
          status.lastfm = { status: "warning", details: `Last.fm returned HTTP ${response.status}` };
        }
      } catch (err: any) {
        status.lastfm = { status: "offline", details: "Last.fm connection timeout" };
      }
    })(),

    // Spotify Check
    (async () => {
      const start = Date.now();
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
      
      if (!clientId || !clientSecret || !refreshToken) {
        status.spotify = { status: "disabled", details: "Spotify credentials missing in .env" };
        return;
      }

      try {
        // Run a quick token request test
        const response = await fetchWithTimeout("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
          body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        });

        if (response.ok) {
          status.spotify = { status: "online", latency: Date.now() - start, details: "Spotify Auth Token verified" };
        } else {
          status.spotify = { status: "warning", details: `Spotify returned HTTP ${response.status} (bad credentials)` };
        }
      } catch (err: any) {
        status.spotify = { status: "offline", details: "Spotify accounts endpoint timeout" };
      }
    })(),

    // Paxsenix (Audio Extractor) Check
    (async () => {
      const start = Date.now();
      const apiKey = process.env.PAXSENIX_API_KEY;
      if (!apiKey) {
        status.paxsenix = { status: "disabled", details: "PAXSENIX_API_KEY missing in .env" };
        return;
      }
      try {
        // Try requesting a public/ping endpoint or resolve track (we can do a HEAD request or ping)
        const response = await fetchWithTimeout("https://api.paxsenix.org/tools/idonthavespotify?url=https://open.spotify.com/track/4PTG3Z6ehGkBF3zI7Y1rqy", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          }
        });
        if (response.ok) {
          status.paxsenix = { status: "online", latency: Date.now() - start, details: "Paxsenix Resolver online" };
        } else {
          status.paxsenix = { status: "warning", details: `Paxsenix endpoint (/tools/idonthavespotify) returned HTTP ${response.status}` };
        }
      } catch (err: any) {
        status.paxsenix = { status: "offline", details: "Paxsenix API connection timeout" };
      }
    })()
  ];

  try {
    await Promise.all(checks);
    return res.status(200).json({ success: true, status });
  } catch (error) {
    console.error("Health checks run error:", error);
    return res.status(500).json({ success: false, error: "Health check routine failed" });
  }
}
