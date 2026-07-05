import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "./kv";
import { getSecret } from "./secrets";

// Cookie configuration helper
const serializeCookie = (name: string, value: string, maxAge: number) => {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${
    process.env.NODE_ENV === "production" ? "Secure;" : ""
  }`;
};

// Parse cookies manually from request headers
export function parseCookies(req: NextApiRequest): Record<string, string> {
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    return req.cookies as Record<string, string>;
  }
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts.shift()!.trim()] = decodeURI(parts.join("="));
  });

  return list;
}

// Keep a cached JWT/CSRF secret in memory, loaded from secrets or kv
let csrfSecret: string | null = null;
async function getCsrfSecret(): Promise<string> {
  if (csrfSecret) return csrfSecret;

  // Try system keychain / env
  const secret = await getSecret("JWT_SECRET");
  if (secret) {
    csrfSecret = secret;
    return secret;
  }

  // Check SQLite KV
  const dbSecret = await kv.get<string>("auth:csrf_secret");
  if (dbSecret) {
    csrfSecret = dbSecret;
    return dbSecret;
  }

  // Generate random secret and save it
  const newSecret = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  await kv.set("auth:csrf_secret", newSecret);
  csrfSecret = newSecret;
  return newSecret;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ADMIN AUTHENTICATION (Dashboard)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export interface AdminSession {
  username: string;
  isAdmin: boolean;
  createdAt: number;
}

export async function createAdminSession(res: NextApiResponse, username: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const sessionData: AdminSession = {
    username,
    isAdmin: true,
    createdAt: Date.now(),
  };

  // Store in SQLite for 1 day
  const maxAge = 60 * 60 * 24; // 24 hours
  await kv.set(`session:admin:${sessionId}`, sessionData, { ex: maxAge });

  // Set Cookie
  res.setHeader("Set-Cookie", serializeCookie("admin_session", sessionId, maxAge));
  return sessionId;
}

export async function getAdminSession(req: NextApiRequest): Promise<AdminSession | null> {
  const cookies = parseCookies(req);
  const sessionId = cookies["admin_session"];
  if (!sessionId) return null;

  return await kv.get<AdminSession>(`session:admin:${sessionId}`);
}

export async function destroyAdminSession(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const cookies = parseCookies(req);
  const sessionId = cookies["admin_session"];
  if (sessionId) {
    await kv.del(`session:admin:${sessionId}`);
  }
  res.setHeader("Set-Cookie", serializeCookie("admin_session", "", -1));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VISITOR AUTHENTICATION (Likes/Comments)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export interface VisitorSession {
  username: string;
  isVisitor: boolean;
  createdAt: number;
}

export async function createVisitorSession(res: NextApiResponse, username: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const sessionData: VisitorSession = {
    username,
    isVisitor: true,
    createdAt: Date.now(),
  };

  // Store in SQLite for 30 days
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  await kv.set(`session:visitor:${sessionId}`, sessionData, { ex: maxAge });

  // Set Cookie
  res.setHeader("Set-Cookie", serializeCookie("visitor_session", sessionId, maxAge));
  return sessionId;
}

export async function getVisitorSession(req: NextApiRequest): Promise<VisitorSession | null> {
  const cookies = parseCookies(req);
  
  // 1. Check visitor session
  const sessionId = cookies["visitor_session"];
  if (sessionId) {
    const session = await kv.get<VisitorSession>(`session:visitor:${sessionId}`);
    if (session) return session;
  }

  // 2. Fallback to admin session so admin can act as a visitor too
  const adminSessionId = cookies["admin_session"];
  if (adminSessionId) {
    const adminSession = await kv.get<AdminSession>(`session:admin:${adminSessionId}`);
    if (adminSession) {
      return {
        username: adminSession.username,
        isVisitor: true,
        createdAt: adminSession.createdAt,
      };
    }
  }

  return null;
}

export async function destroyVisitorSession(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const cookies = parseCookies(req);
  const sessionId = cookies["visitor_session"];
  if (sessionId) {
    await kv.del(`session:visitor:${sessionId}`);
  }
  res.setHeader("Set-Cookie", serializeCookie("visitor_session", "", -1));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CSRF PROTECTION (Bun.CSRF)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export async function generateCsrfToken(req: NextApiRequest): Promise<string> {
  const secret = await getCsrfSecret();

  if (typeof Bun !== "undefined" && Bun.CSRF) {
    return Bun.CSRF.generate(secret, {} as any);
  }

  // Fallback if running on older bun
  const rawToken = `anonymous:${Date.now()}`;
  return Buffer.from(rawToken).toString("base64");
}

export async function verifyCsrfRequest(req: NextApiRequest): Promise<boolean> {
  // Safe methods do not require CSRF protection
  if (["GET", "HEAD", "OPTIONS"].includes(req.method || "")) {
    return true;
  }

  const token = req.headers["x-csrf-token"] as string;
  if (!token) return false;

  const secret = await getCsrfSecret();

  try {
    if (typeof Bun !== "undefined" && Bun.CSRF) {
      return Bun.CSRF.verify(token, { secret } as any);
    }

    // Fallback verification
    const decoded = Buffer.from(token, "base64").toString("ascii");
    const [tokenSessionId, timestampStr] = decoded.split(":");
    const timestamp = parseInt(timestampStr, 10);
    
    // Check if token is under 24 hours old
    const isNotExpired = Date.now() - timestamp < 1000 * 60 * 60 * 24;
    return isNotExpired;
  } catch {
    return false;
  }
}
