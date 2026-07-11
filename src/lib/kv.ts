import { Database } from "bun:sqlite";
import path from "path";

// Initialize local SQLite database for KV storage
// Store it in the project root or standalone directory
const DB_PATH = process.env.KV_DATABASE_PATH || path.join(process.cwd(), "kv.sqlite");

const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA busy_timeout = 5000;");


// Create table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at INTEGER
  )
`).run();

// Clean up expired keys on startup
db.query("DELETE FROM kv WHERE expires_at IS NOT NULL AND expires_at < ?").run(Date.now());

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    const row = db.query("SELECT value, expires_at FROM kv WHERE key = ?").get(key) as {
      value: string;
      expires_at: number | null;
    } | null;

    if (!row) return null;

    // Check expiration
    if (row.expires_at && Date.now() > row.expires_at) {
      db.query("DELETE FROM kv WHERE key = ?").run(key);
      return null;
    }

    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  },

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;

    db.query("INSERT OR REPLACE INTO kv (key, value, expires_at) VALUES (?, ?, ?)").run(
      key,
      serialized,
      expiresAt
    );
  },

  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    const stmt = db.prepare("DELETE FROM kv WHERE key = ?");
    for (const k of keys) {
      stmt.run(k);
    }
  },
};
