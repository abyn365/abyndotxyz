/**
 * music/cache.ts
 * In-memory cache with sessionStorage persistence for lyrics and YT search results.
 * TTL: 30 minutes for lyrics, 60 minutes for YouTube video IDs.
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
  // Check memory first
  const mem = memoryCache.get(key);
  if (mem && !isExpired(mem)) {
    return mem.data as T;
  }

  // Try sessionStorage
  try {
    const raw = sessionStorage.getItem(`music_cache:${key}`);
    if (raw) {
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (!isExpired(entry)) {
        // Promote to memory
        memoryCache.set(key, entry);
        return entry.data;
      } else {
        sessionStorage.removeItem(`music_cache:${key}`);
      }
    }
  } catch {
    // sessionStorage may not be available (SSR)
  }

  return null;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number = 30 * 60 * 1000): void {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };

  memoryCache.set(key, entry as CacheEntry<unknown>);

  try {
    sessionStorage.setItem(`music_cache:${key}`, JSON.stringify(entry));
  } catch {
    // Quota exceeded or unavailable — memory-only is fine
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

export const LYRICS_TTL = 30 * 60 * 1000;  // 30 min
export const YT_TTL = 60 * 60 * 1000;       // 60 min
