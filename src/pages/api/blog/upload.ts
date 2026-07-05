import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession, verifyCsrfRequest } from "../../../lib/auth";
import { isS3Enabled, uploadFile } from "../../../lib/s3";

// Increase standard body size limit to allow larger uploads (e.g. 50MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Verify CSRF Token
  const isCsrfValid = await verifyCsrfRequest(req);
  if (!isCsrfValid) {
    return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
  }

  // 2. Verify Admin Session
  const adminSession = await getAdminSession(req);
  if (!adminSession) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // Check if S3 is active
  if (!isS3Enabled()) {
    return res.status(400).json({
      success: false,
      error: "S3 storage is not configured. Local file uploads are disabled.",
    });
  }

  const { files, fileName, fileType, fileContent } = req.body;

  try {
    // 3. Handle Bulk Files Upload (if provided)
    if (files && Array.isArray(files)) {
      const uploadPromises = files.map(async (f: any) => {
        if (!f.fileName || !f.fileType || !f.fileContent) {
          throw new Error("Invalid bulk file payload");
        }
        const buffer = Buffer.from(f.fileContent, "base64");
        const cleanName = f.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const s3Path = `blog/assets/${Date.now()}-${cleanName}`;
        const url = await uploadFile(s3Path, buffer, f.fileType);
        return { fileName: f.fileName, url };
      });

      const results = await Promise.all(uploadPromises);
      return res.status(200).json({
        success: true,
        files: results,
      });
    }

    // 4. Single file fallback
    if (!fileName || !fileType || !fileContent) {
      return res.status(400).json({ success: false, error: "fileName, fileType, and fileContent (base64) are required" });
    }

    const buffer = Buffer.from(fileContent, "base64");
    const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const s3Path = `blog/assets/${Date.now()}-${cleanName}`;
    const url = await uploadFile(s3Path, buffer, fileType);

    return res.status(200).json({
      success: true,
      url,
      files: [{ fileName, url }]
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to upload file to S3 cloud storage" });
  }
}
