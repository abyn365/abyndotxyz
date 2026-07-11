import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession, verifyCsrfRequest } from "../../lib/auth";
import { getPhotos, savePhoto, deletePhoto, Photo } from "../../lib/photos";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  if (method === "GET") {
    try {
      const photos = await getPhotos();
      return res.status(200).json({ success: true, photos });
    } catch (error) {
      console.error("Failed to list photos:", error);
      return res.status(500).json({ success: false, error: "Failed to load photos" });
    }
  }

  if (method === "POST" || method === "DELETE") {
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

    if (method === "POST") {
      const { id, url, description, aspectRatio, tags } = req.body;

      if (!url) {
        return res.status(400).json({ success: false, error: "Photo URL is required" });
      }

      try {
        const photoId = id || crypto.randomUUID();
        const newPhoto: Photo = {
          id: photoId,
          url: url.trim(),
          description: (description || "").trim(),
          aspectRatio: parseFloat(aspectRatio) || 1.0,
          tags: Array.isArray(tags) ? tags : [],
          createdAt: req.body.createdAt || Date.now(),
        };

        await savePhoto(newPhoto);
        try {
          await res.revalidate("/photos");
        } catch (err) {
          console.error("Failed to revalidate /photos:", err);
        }
        return res.status(200).json({ success: true, photo: newPhoto });
      } catch (error) {
        console.error("Failed to save photo:", error);
        return res.status(500).json({ success: false, error: "Failed to save photo to storage" });
      }
    }

    if (method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: "Photo ID is required for deletion" });
      }

      try {
        await deletePhoto(id);
        try {
          await res.revalidate("/photos");
        } catch (err) {
          console.error("Failed to revalidate /photos:", err);
        }
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error("Failed to delete photo:", error);
        return res.status(500).json({ success: false, error: "Failed to delete photo from storage" });
      }
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
