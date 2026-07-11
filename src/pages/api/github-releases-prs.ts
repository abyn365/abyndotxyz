import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";

interface GitHubPR {
  id: number;
  title: string;
  url: string;
  repo: string;
  state: string;
  createdAt: string;
}

interface GitHubRelease {
  id: number;
  tagName: string;
  name: string;
  repo: string;
  url: string;
  publishedAt: string;
  body?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cacheKey = "github-releases-prs-v1";
  
  // 1. Try serving from cache first
  try {
    const cachedData = await kv.get<{ prs: GitHubPR[]; releases: GitHubRelease[] }>(cacheKey);
    if (cachedData) {
      res.setHeader("cache-control", "public, max-age=3600");
      return res.status(200).json({ success: true, ...cachedData });
    }
  } catch (err) {
    console.error("KV cache read failure:", err);
  }

  const username = "abyn365";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // 2. Fetch Pull Requests from GitHub search issues API
    const prRes = await fetch(
      `https://api.github.com/search/issues?q=author:${username}+type:pr&sort=created&order=desc&per_page=10`,
      { headers }
    );
    let prs: GitHubPR[] = [];
    if (prRes.ok) {
      const prData = await prRes.json();
      const items = prData.items || [];
      prs = items.map((item: any) => {
        // Extract repo name from repository_url: "https://api.github.com/repos/abyn365/abyndotxyz"
        const repoParts = item.repository_url.split("/");
        const repoName = `${repoParts[repoParts.length - 2]}/${repoParts[repoParts.length - 1]}`;
        return {
          id: item.id,
          title: item.title,
          url: item.html_url,
          repo: repoName,
          state: item.state, // open or closed
          createdAt: item.created_at,
        };
      });
    }

    // 3. Fetch Releases from public events
    const eventRes = await fetch(
      `https://api.github.com/users/${username}/events/public?per_page=30`,
      { headers }
    );
    let releases: GitHubRelease[] = [];
    if (eventRes.ok) {
      const events = await eventRes.json();
      const releaseEvents = Array.isArray(events)
        ? events.filter((e: any) => e.type === "ReleaseEvent")
        : [];
        
      releases = releaseEvents.map((e: any) => {
        const payload = e.payload || {};
        const release = payload.release || {};
        return {
          id: release.id || e.id,
          tagName: release.tag_name || "v1.0.0",
          name: release.name || release.tag_name || "Release",
          repo: e.repo.name,
          url: release.html_url || `https://github.com/${e.repo.name}/releases`,
          publishedAt: release.published_at || e.created_at,
          body: release.body ? release.body.slice(0, 150) + "..." : undefined,
        };
      });
    }

    // Fallback: If no releases were found in recent events, fetch releases for the main portfolio repo
    if (releases.length === 0) {
      try {
        const repoReleaseRes = await fetch(
          `https://api.github.com/repos/${username}/abyndotxyz/releases?per_page=5`,
          { headers }
        );
        if (repoReleaseRes.ok) {
          const repoReleases = await repoReleaseRes.json();
          if (Array.isArray(repoReleases)) {
            releases = repoReleases.map((r: any) => ({
              id: r.id,
              tagName: r.tag_name,
              name: r.name || r.tag_name,
              repo: `${username}/abyndotxyz`,
              url: r.html_url,
              publishedAt: r.published_at,
              body: r.body ? r.body.slice(0, 150) + "..." : undefined,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch repository specific releases:", err);
      }
    }

    const result = { prs, releases };
    
    // Save to KV cache for 1 hour (3600 seconds)
    try {
      await kv.set(cacheKey, result, { ex: 3600 });
    } catch (err) {
      console.error("KV cache write failure:", err);
    }

    res.setHeader("cache-control", "public, max-age=3600");
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to fetch github releases and prs:", error);
    return res.status(500).json({ success: false, error: "Failed to load open-source activities" });
  }
}
