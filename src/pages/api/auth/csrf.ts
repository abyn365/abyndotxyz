import type { NextApiRequest, NextApiResponse } from "next";
import { generateCsrfToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = await generateCsrfToken(req);
    return res.status(200).json({ success: true, csrfToken: token });
  } catch (error) {
    console.error("CSRF generation error:", error);
    return res.status(500).json({ success: false, error: "Failed to generate token" });
  }
}
