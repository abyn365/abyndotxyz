import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "@vercel/kv";

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  payload?: {
    commits?: Array<{ sha: string; message: string }>;
    head?: string;
    ref_type?: string;
    ref?: string;
    action?: string;
    release?: { tag_name: string };
  };
  created_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const username = "abyn365";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/events/public?per_page=15`,
      { headers }
    );
    if (!response.ok) throw new Error(`GitHub responded with ${response.status}`);
    
    const rawEvents: GitHubEvent[] = await response.json();

    // Process and enrich the 5 most recent events
    const enrichedEvents = await Promise.all(
      rawEvents.slice(0, 5).map(async (event) => {
        if (event.type !== "PushEvent") return event;

        const kvKey = `gh-event-msg-v1-${event.id}`;
        
        try {
          // Check if this specific event message is locked into permanent KV cache
          const cachedMsg = await kv.get<string>(kvKey);
          if (cachedMsg) {
            return { ...event, displayMessage: cachedMsg };
          }
        } catch (kvError) {
          console.error("KV Read Error:", kvError);
        }

        // Try extracting directly from payload first
        const commits = event.payload?.commits || [];
        let msg = (commits[commits.length - 1] || commits[0])?.message?.split("\n")[0]?.slice(0, 50)?.trim();

        // If payload commits are empty, fetch the exact commit context securely via head hash
        if (!msg && event.payload?.head) {
          try {
            const commitRes = await fetch(
              `https://api.github.com/repos/${event.repo.name}/commits/${event.payload.head}`,
              { headers }
            );
            if (commitRes.ok) {
              const commitData = await commitRes.json();
              msg = commitData.commit?.message?.split("\n")[0]?.slice(0, 50)?.trim();
            }
          } catch (err) {
            console.error("Error fetching head commit hash:", err);
          }
        }

        // Generic fallback if commit info is entirely processed out
        if (!msg) {
          const repoName = event.repo.name.split("/")[1] || event.repo.name;
          const branch = event.payload?.ref?.replace("refs/heads/", "");
          msg = branch ? `pushed to branch ${branch}` : `updated ${repoName}`;
        }

        // Save into Vercel KV indefinitely (Historical push events never alter retrospectively)
        try {
          await kv.set(kvKey, msg);
        } catch (kvError) {
          console.error("KV Write Error:", kvError);
        }

        return {
          ...event,
          displayMessage: msg,
        };
      })
    );

    res.setHeader("cache-control", "public, max-age=60");
    return res.status(200).json({ events: enrichedEvents });
  } catch (error) {
    console.error("GitHub event engine layer sync failed:", error);
    return res.status(500).json({ error: "Failed to load timeline feed" });
  }
}
