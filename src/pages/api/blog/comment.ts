import type { NextApiRequest, NextApiResponse } from "next";
import { getVisitorSession, getAdminSession, verifyCsrfRequest } from "../../../lib/auth";
import { getPostBySlug, getComments, addComment, deleteComment } from "../../../lib/blog";
import { kv } from "../../../lib/kv";

function sanitize(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  if (method === "POST") {
    // 1. Verify CSRF
    const isCsrfValid = await verifyCsrfRequest(req);
    if (!isCsrfValid) {
      return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
    }

    // 2. Verify Visitor Session
    const visitorSession = await getVisitorSession(req);
    if (!visitorSession) {
      return res.status(401).json({ success: false, error: "You must be signed in to post comments" });
    }

    const { slug, content } = req.body;

    if (!slug || !content) {
      return res.status(400).json({ success: false, error: "Slug and content are required" });
    }

    const cleanContent = sanitize(content);
    if (!cleanContent) {
      return res.status(400).json({ success: false, error: "Comment cannot be empty" });
    }

    if (cleanContent.length > 500) {
      return res.status(400).json({ success: false, error: "Comment must be under 500 characters" });
    }

    // 2.5 Blocked words validation
    try {
      const blockedWords = (await kv.get<string[]>("admin:blocked_words")) || [];
      const messageLower = cleanContent.toLowerCase();
      const hasBlockedWord = blockedWords.some((word: string) => messageLower.includes(word));
      if (hasBlockedWord) {
        return res.status(400).json({ success: false, error: "Your comment contains prohibited terms." });
      }
    } catch (e) {
      console.warn("Blocked words validation warning:", e);
    }

    try {
      // Verify post exists
      const post = await getPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ success: false, error: "Blog post not found" });
      }

      // Add comment
      const comment = await addComment(slug, visitorSession.username, cleanContent);
      return res.status(200).json({ success: true, comment });
    } catch (error) {
      console.error(`Error adding comment on post "${slug}":`, error);
      return res.status(500).json({ success: false, error: "Failed to post comment" });
    }
  }

  if (method === "DELETE") {
    // 1. Verify CSRF
    const isCsrfValid = await verifyCsrfRequest(req);
    if (!isCsrfValid) {
      return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
    }

    const { slug, commentId } = req.body;

    if (!slug || !commentId) {
      return res.status(400).json({ success: false, error: "Slug and commentId are required" });
    }

    try {
      const comments = await getComments(slug);
      const comment = comments.find((c) => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ success: false, error: "Comment not found" });
      }

      // Check authorization: must be either Admin or the Comment Author (visitor)
      const adminSession = await getAdminSession(req);
      const visitorSession = await getVisitorSession(req);

      const isAdmin = !!adminSession;
      const isAuthor = visitorSession && visitorSession.username === comment.username;

      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ success: false, error: "You are not authorized to delete this comment" });
      }

      await deleteComment(slug, commentId);
      return res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
      console.error(`Error deleting comment "${commentId}" from post "${slug}":`, error);
      return res.status(500).json({ success: false, error: "Failed to delete comment" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
