import type { NextApiRequest, NextApiResponse } from "next";
import { getSecret, setSecret } from "../../../lib/secrets";
import { createAdminSession, verifyCsrfRequest } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Verify CSRF Token
  const isCsrfValid = await verifyCsrfRequest(req);
  if (!isCsrfValid) {
    return res.status(403).json({ success: false, error: "Security validation (CSRF) failed. Please refresh." });
  }

  const { username, password, token } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required" });
  }

  // 1.5 Verify Cloudflare Turnstile Token to prevent brute-forcing
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

  try {
    // 2. Retrieve Admin Credentials (from OS Keychain or env fallback)
    const adminUsername = (await getSecret("ADMIN_USERNAME")) || "admin";
    const adminPassword = (await getSecret("ADMIN_PASSWORD")) || "admin123";

    if (username !== adminUsername) {
      return res.status(401).json({ success: false, error: "Invalid username or password" });
    }

    // 3. Verify password hash or upgrade plaintext password
    const isHash =
      adminPassword.startsWith("$argon2") ||
      adminPassword.startsWith("$2a$") ||
      adminPassword.startsWith("$2b$");
    
    let isValid = false;

    if (isHash) {
      if (typeof Bun !== "undefined" && Bun.password) {
        isValid = await Bun.password.verify(password, adminPassword);
      } else {
        // Simple mock/hash comparison fallback if Bun is not available
        isValid = false;
      }
    } else {
      // Plaintext comparison for local setup/migration
      isValid = password === adminPassword;
      
      // Auto-upgrade plaintext password to Argon2id in OS keychain if correct
      if (isValid && typeof Bun !== "undefined" && Bun.password) {
        try {
          const secureHash = await Bun.password.hash(password, { algorithm: "argon2id" });
          await setSecret("ADMIN_PASSWORD", secureHash);
          console.info("[Auth] Successfully upgraded admin password to Argon2id hash in OS keychain");
        } catch (e) {
          console.warn("[Auth] Failed to write password hash to OS keychain:", e);
        }
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid username or password" });
    }

    // 4. Create Session & Cookie
    await createAdminSession(res, username);
    return res.status(200).json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, error: "Internal server error during authentication" });
  }
}
