/**
 * music/cache.ts
 * In-memory + sessionStorage + localStorage cache for lyrics and YT search results.
 * TTL: 30 minutes for lyrics (session), 24 hours for YouTube video IDs (localStorage).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() > entry.expiresAt;
}

export function cacheGet<T>(key: string): T | null {
  // 1. Check memory first (fastest)
  const mem = memoryCache.get(key);
  if (mem && !isExpired(mem)) {
    return mem.data as T;
  }

  // 2. Try sessionStorage
  try {
    const raw = sessionStorage.getItem(`music_cache:${key}`);
    if (raw) {
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (!isExpired(entry)) {
        memoryCache.set(key, entry as CacheEntry<unknown>);
        return entry.data;
      } else {
        sessionStorage.removeItem(`music_cache:${key}`);
      }
    }
  } catch {
    // sessionStorage may not be available (SSR or quota)
  }

  // 3. Try localStorage (for YouTube IDs persisted across sessions)
  try {
    const raw = localStorage.getItem(`music_cache:${key}`);
    if (raw) {
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (!isExpired(entry)) {
        // Promote to memory for this session
        memoryCache.set(key, entry as CacheEntry<unknown>);
        return entry.data;
      } else {
        localStorage.removeItem(`music_cache:${key}`);
      }
    }
  } catch {
    // localStorage may not be available
  }

  return null;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number = 30 * 60 * 1000, persist = false): void {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };

  memoryCache.set(key, entry as CacheEntry<unknown>);

  try {
    sessionStorage.setItem(`music_cache:${key}`, JSON.stringify(entry));
  } catch {
    // Quota exceeded or unavailable — memory-only is fine
  }

  // For YouTube IDs, also write to localStorage for cross-session speed
  if (persist) {
    try {
      localStorage.setItem(`music_cache:${key}`, JSON.stringify(entry));
    } catch {
      // Quota exceeded — that's okay
    }
  }
}

export function cacheClear(prefix?: string): void {
  if (prefix) {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(`music_cache:${prefix}`)) toRemove.push(k);
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  } else {
    memoryCache.clear();
  }
}

// Cache key helpers
export const lyricsCacheKey = (artist?: string, song?: string) =>
  `lyrics:${(artist ?? "").toLowerCase()}:${(song ?? "").toLowerCase()}`;

export const ytCacheKey = (artist?: string, song?: string) =>
  `yt:${(artist ?? "").toLowerCase()}:${(song ?? "").toLowerCase()}`;

export const LYRICS_TTL = 30 * 60 * 1000;   // 30 min
export const YT_TTL = 24 * 60 * 60 * 1000;  // 24 hours (persisted in localStorage)
