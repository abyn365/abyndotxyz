import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../../../lib/kv";
import { createVisitorSession, verifyCsrfRequest } from "../../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Verify CSRF Token
  const isCsrfValid = await verifyCsrfRequest(req);
  if (!isCsrfValid) {
    return res.status(403).json({ success: false, error: "Security check failed (CSRF). Please refresh." });
  }

  const { username, password, token } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required" });
  }

  // 1.5 Verify Cloudflare Turnstile Token
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";
  try {
    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(token || "")}`,
      }
    );
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return res.status(400).json({ success: false, error: "Security verification (Turnstile) failed. Please try again." });
    }
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return res.status(500).json({ success: false, error: "Failed to verify security token. Please try again later." });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    // 2. Retrieve user
    const user = await kv.get<{ username: string; hash: string }>(`visitor:user:${cleanUsername}`);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid username or password" });
    }

    // 3. Verify password
    let isValid = false;
    if (typeof Bun !== "undefined" && Bun.password) {
      isValid = await Bun.password.verify(password, user.hash);
    } else {
      isValid = password === user.hash;
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid username or password" });
    }

    // 4. Create Session
    await createVisitorSession(res, cleanUsername);
    return res.status(200).json({ success: true, user: { username: cleanUsername } });
  } catch (error) {
    console.error("Visitor login error:", error);
    return res.status(500).json({ success: false, error: "Internal server error during login" });
  }
}
