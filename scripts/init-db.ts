import { Database } from "bun:sqlite";
import path from "path";

const DB_PATH = process.env.KV_DATABASE_PATH || path.join(process.cwd(), "kv.sqlite");
console.log("[DB Init] Initializing SQLite database at:", DB_PATH);

try {
  const db = new Database(DB_PATH);
  
  // Enable WAL mode and set busy timeout
  console.log("[DB Init] Setting journal_mode to WAL...");
  db.exec("PRAGMA journal_mode = WAL;");
  
  console.log("[DB Init] Setting busy_timeout to 5000ms...");
  db.exec("PRAGMA busy_timeout = 5000;");
  
  // Create table if it doesn't exist
  console.log("[DB Init] Creating table if not exists...");
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expires_at INTEGER
    );
  `);
  
  // Clean up expired keys
  console.log("[DB Init] Cleaning up expired keys...");
  db.query("DELETE FROM kv WHERE expires_at IS NOT NULL AND expires_at < ?").run(Date.now());
  
  db.close();
  console.log("[DB Init] SQLite database initialized successfully.");
} catch (err) {
  console.error("[DB Init] Failed to initialize SQLite database:", err);
  process.exit(1);
}
