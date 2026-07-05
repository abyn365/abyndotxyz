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

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required" });
  }

  // Sanitize and validate username
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.length > 25) {
    return res.status(400).json({ success: false, error: "Username must be between 3 and 25 characters" });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    return res.status(400).json({ success: false, error: "Username can only contain alphanumeric characters, underscores, and hyphens" });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
  }

  try {
    // 1.5 Validate against moderation blocklists
    const blockedUsernames = (await kv.get<string[]>("admin:blocked_usernames")) || [
      "admin",
      "administrator",
      "moderator",
      "owner",
      "staff",
      "support",
      "system"
    ];
    const blockedWords = (await kv.get<string[]>("admin:blocked_words")) || [];

    const isBlockedName = blockedUsernames.includes(cleanUsername);
    const containsBlockedWord = blockedWords.some((word) => cleanUsername.includes(word));

    if (isBlockedName || containsBlockedWord) {
      return res.status(400).json({ success: false, error: "This username is reserved or contains blocked terms." });
    }
    // 2. Check if username exists
    const userExists = await kv.get<{ username: string; hash: string }>(`visitor:user:${cleanUsername}`);
    if (userExists) {
      return res.status(400).json({ success: false, error: "Username is already taken" });
    }

    // 3. Hash password using Argon2id
    let passwordHash = "";
    if (typeof Bun !== "undefined" && Bun.password) {
      passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
    } else {
      // Fallback
      passwordHash = password;
    }

    // 4. Save to database
    await kv.set(`visitor:user:${cleanUsername}`, {
      username: cleanUsername,
      hash: passwordHash,
      createdAt: Date.now(),
    });

    // 5. Establish Session
    await createVisitorSession(res, cleanUsername);
    return res.status(200).json({ success: true, user: { username: cleanUsername } });
  } catch (error) {
    console.error("Visitor registration error:", error);
    return res.status(500).json({ success: false, error: "Failed to create visitor account" });
  }
}
