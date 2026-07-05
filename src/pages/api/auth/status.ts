import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession, generateCsrfToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getAdminSession(req);
    const csrfToken = await generateCsrfToken(req);

    if (!session) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
        csrfToken,
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: { username: session.username },
      csrfToken,
    });
  } catch (error) {
    console.error("Auth status check failed:", error);
    return res.status(500).json({ success: false, error: "Failed to check authentication status" });
  }
}
