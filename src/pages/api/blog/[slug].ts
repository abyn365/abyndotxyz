import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession, verifyCsrfRequest } from "../../../lib/auth";
import { getPostBySlug, savePost, deletePost, getLikes, getComments } from "../../../lib/blog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  const method = req.method;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ success: false, error: "Invalid slug parameter" });
  }

  if (method === "GET") {
    try {
      const post = await getPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ success: false, error: "Blog post not found" });
      }

      // Check if draft and if user is admin
      if (!post.published) {
        const adminSession = await getAdminSession(req);
        if (!adminSession) {
          return res.status(404).json({ success: false, error: "Blog post not found" });
        }
      }

      const likes = await getLikes(slug);
      const comments = await getComments(slug);

      return res.status(200).json({
        success: true,
        post,
        likes,
        comments: comments.sort((a, b) => a.createdAt - b.createdAt), // oldest first for linear comments list
      });
    } catch (error) {
      console.error(`Failed to fetch post "${slug}":`, error);
      return res.status(500).json({ success: false, error: "Failed to load blog post" });
    }
  }

  if (method === "PUT") {
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

    const { title, description, content, coverImage, published } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: "Title and content are required" });
    }

    try {
      const existing = await getPostBySlug(slug);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Blog post not found" });
      }

      const updatedPost = {
        ...existing,
        title: title.trim(),
        description: (description || "").trim(),
        content: content.trim(),
        coverImage: coverImage || "",
        published: !!published,
        updatedAt: Date.now(),
      };

      await savePost(updatedPost);
      return res.status(200).json({ success: true, post: updatedPost });
    } catch (error) {
      console.error(`Failed to update post "${slug}":`, error);
      return res.status(500).json({ success: false, error: "Failed to update blog post" });
    }
  }

  if (method === "DELETE") {
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

    try {
      const existing = await getPostBySlug(slug);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Blog post not found" });
      }

      await deletePost(slug);
      return res.status(200).json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      console.error(`Failed to delete post "${slug}":`, error);
      return res.status(500).json({ success: false, error: "Failed to delete blog post" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
