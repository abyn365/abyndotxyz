import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession, verifyCsrfRequest } from "../../../lib/auth";
import { getPosts, savePost, BlogPost } from "../../../lib/blog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  if (method === "GET") {
    try {
      const posts = await getPosts();
      const adminSession = await getAdminSession(req);

      // If admin is logged in, show all posts. Otherwise, show only published posts
      const filtered = adminSession
        ? posts
        : posts.filter((p) => p.published);

      return res.status(200).json({ success: true, posts: filtered });
    } catch (error) {
      console.error("Failed to list blog posts:", error);
      return res.status(500).json({ success: false, error: "Failed to load posts" });
    }
  }

  if (method === "POST") {
    // 1. Verify CSRF
    const isCsrfValid = await verifyCsrfRequest(req);
    if (!isCsrfValid) {
      return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
    }

    // 2. Verify Admin Session
    const adminSession = await getAdminSession(req);
    if (!adminSession) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { slug, title, description, content, coverImage, published } = req.body;

    // Validation
    if (!slug || !title || !content) {
      return res.status(400).json({ success: false, error: "Slug, title, and content are required" });
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      return res.status(400).json({ success: false, error: "Slug must contain only lowercase letters, numbers, and hyphens" });
    }

    try {
      // Check if post already exists
      const posts = await getPosts();
      if (posts.some((p) => p.slug === cleanSlug)) {
        return res.status(400).json({ success: false, error: "A blog post with this slug already exists" });
      }

      const newPost: BlogPost = {
        slug: cleanSlug,
        title: title.trim(),
        description: (description || "").trim(),
        content: content.trim(),
        coverImage: coverImage || "",
        published: !!published,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await savePost(newPost);
      return res.status(200).json({ success: true, post: newPost });
    } catch (error) {
      console.error("Failed to create blog post:", error);
      return res.status(500).json({ success: false, error: "Failed to save post to storage" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
