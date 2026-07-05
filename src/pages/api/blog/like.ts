import type { NextApiRequest, NextApiResponse } from "next";
import { getVisitorSession, verifyCsrfRequest } from "../../../lib/auth";
import { getPostBySlug, toggleLike } from "../../../lib/blog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Verify CSRF Token
  const isCsrfValid = await verifyCsrfRequest(req);
  if (!isCsrfValid) {
    return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
  }

  // 2. Verify Visitor Session
  const visitorSession = await getVisitorSession(req);
  if (!visitorSession) {
    return res.status(401).json({ success: false, error: "You must be signed in to like blog posts" });
  }

  const { slug } = req.body;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ success: false, error: "Slug is required" });
  }

  try {
    // Check if post exists
    const post = await getPostBySlug(slug);
    if (!post) {
      return res.status(404).json({ success: false, error: "Blog post not found" });
    }

    // Toggle like
    const likes = await toggleLike(slug, visitorSession.username);
    return res.status(200).json({ success: true, likes });
  } catch (error) {
    console.error(`Error toggling like on post "${slug}":`, error);
    return res.status(500).json({ success: false, error: "Failed to update like status" });
  }
}
