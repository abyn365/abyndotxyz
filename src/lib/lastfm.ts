import { getAccessToken } from "./spotify";
import { kv } from "./kv";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY as string;
const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0";
const LASTFM_PLACEHOLDER_SIGNATURES = [
  "2a96cbd8b46e442fc41c2b86b821562f",
] as const;

export interface LastFmImage {
  "#text": string;
  size: "small" | "medium" | "large" | "extralarge";
}

export interface LastFmTrack {
  name: string;
  playcount: string;
  duration: string;
  url: string;
  mbid: string;
  artist: {
    name: string;
    mbid: string;
    url: string;
  };
  image: LastFmImage[];
  "@attr": {
    rank: string;
  };
}

export interface TopItem {
  name: string;
  playcount: string;
  duration?: string;
  url?: string;
  artist?: { name: string } | string;
  image?: LastFmImage[];
}

export interface RecentTrack extends TopItem {
  date?: { uts: string; "#text": string };
  "@attr"?: { nowplaying?: string };
}

export interface WeeklyChart {
  from: string;
  to: string;
}


type LastFmTrackInfoResponse = {
  track?: {
    album?: {
      image?: LastFmImage[];
    };
  };
  error?: number;
  message?: string;
};

function isLastFmPlaceholderImage(url: string): boolean {
  if (!url) return true;

  return LASTFM_PLACEHOLDER_SIGNATURES.some((signature) =>
    url.includes(signature)
  );
}

export function isUsableCoverImage(url: string): boolean {
  return Boolean(url) && !isLastFmPlaceholderImage(url);
}

async function fetchLastFm<T>(params: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams({
    ...params,
    api_key: LASTFM_API_KEY,
    format: "json",
  });

  const res = await fetch(`${LASTFM_BASE_URL}?${searchParams}`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`Last.fm API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as T & { error?: number; message?: string };

  if (data.error) {
    throw new Error(`Last.fm API error ${data.error}: ${data.message}`);
  }

  return data;
}

export function getLastFmImage(
  images: LastFmImage[],
  preferredSize: "extralarge" | "large" | "medium" | "small" = "extralarge"
): string {
  const sizeOrder = ["extralarge", "large", "medium", "small"] as const;
  const startIndex = sizeOrder.indexOf(preferredSize);

  for (let i = startIndex; i < sizeOrder.length; i++) {
    const match = images.find((image) => image.size === sizeOrder[i]);
    const url = match?.["#text"] ?? "";

    if (isUsableCoverImage(url)) return url;
  }

  for (let i = startIndex - 1; i >= 0; i--) {
    const match = images.find((image) => image.size === sizeOrder[i]);
    const url = match?.["#text"] ?? "";

    if (isUsableCoverImage(url)) return url;
  }

  return "";
}

export async function fetchTopTracks(
  username: string,
  period: string,
  limit = 50
): Promise<LastFmTrack[]> {
  const data = await fetchLastFm<{ toptracks?: { track?: LastFmTrack[] } }>({
    method: "user.getTopTracks",
    user: username,
    period,
    limit: limit.toString(),
  });

  return data.toptracks?.track ?? [];
}

async function fetchTrackInfoCoverArt(
  artist: string,
  track: string,
  username?: string
): Promise<string> {
  try {
    const data = await fetchLastFm<LastFmTrackInfoResponse>({
      method: "track.getInfo",
      artist,
      track,
      autocorrect: "1",
      ...(username ? { username } : {}),
    });

    return getLastFmImage(data.track?.album?.image ?? []);
  } catch {
    return "";
  }
}

export function cleanTrackTitleForCoverSearch(title: string): string {
  return title
    // Remove featured artists: (feat. ...), [ft. ...], featuring ...
    .replace(/\s*[\[(](?:feat\.?|ft\.?|with|featuring)\s[^\])\]]*[\])]/gi, "")
    .replace(/\s*\b(?:feat\.?|ft\.?)\s+[^()\[\],]+/gi, "")
    // Remove slowed/sped up/reverb/remix/edit suffixes:
    // e.g. "solo - Slowed" -> "solo"
    // e.g. "worry - ultra slowed" -> "worry"
    .replace(/\s*-\s*(?:slowed|sped\s*up|reverb|remix|edit|ultra\s*slowed|super\s*slowed|slow)\b.*/gi, "")
    // Remove any standalone parenthetical slowed/sped up tags
    .replace(/\s*[\[(](?:slowed|sped\s*up|reverb|remix|edit|ultra\s*slowed|super\s*slowed|slow)[\])]/gi, "")
    // Remove hashtags: e.g. "#back2basics"
    .replace(/#\w+/g, "")
    // Clean multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}

async function runWithConcurrencyLimit<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit = 5
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

export async function getItunesCoverArt(
  artist: string,
  track: string
): Promise<string> {
  const cleanTrack = cleanTrackTitleForCoverSearch(track);
  const cleanArtist = artist.replace(/&.*$/, "").trim(); // take first artist only
  const cacheKey = `cover-art-v2:${cleanArtist.toLowerCase()}:${cleanTrack.toLowerCase()}`;

  try {
    const cached = await kv.get<string>(cacheKey);
    if (cached) return cached;
  } catch {}

  try {
    const query = encodeURIComponent(`${cleanArtist} ${cleanTrack}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=5&country=US`,
      { signal: AbortSignal.timeout(4000) }
    );

    if (!res.ok) return "";

    const data = await res.json();
    const results = (data.results ?? []) as Array<{
      artistName?: string;
      trackName?: string;
      artworkUrl100?: string;
    }>;

    if (!results.length) return "";

    const normArtist = cleanArtist.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Prefer a result where the artist name matches
    const best =
      results.find((r) => {
        const rArtist = (r.artistName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return rArtist.includes(normArtist) || normArtist.includes(rArtist);
      }) ?? results[0];

    const artworkUrl = best?.artworkUrl100;
    if (!artworkUrl) return "";

    // Upscale from 100x100 to 600x600
    const finalUrl = artworkUrl.replace(/\/[0-9]+x[0-9]+bb\./, "/600x600bb.");

    try {
      await kv.set(cacheKey, finalUrl, { ex: 30 * 24 * 60 * 60 });
    } catch {}

    return finalUrl;
  } catch {
    return "";
  }
}

export async function getSpotifyCoverArt(
  artist: string,
  track: string
): Promise<string> {
  const cleanTrack = cleanTrackTitleForCoverSearch(track);
  const cacheKey = `cover-art-v2:${artist.toLowerCase()}:${cleanTrack.toLowerCase()}`;

  try {
    const cached = await kv.get<string>(cacheKey);
    if (cached) return cached;
  } catch {}

  try {
    const { access_token } = await getAccessToken();
    const query = `${artist} ${cleanTrack}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return "";

    const data = await res.json();
    const coverUrl = data.tracks?.items?.[0]?.album?.images?.[0]?.url;
    if (coverUrl) {
      try {
        await kv.set(cacheKey, coverUrl, { ex: 30 * 24 * 60 * 60 });
      } catch {}
      return coverUrl;
    }
    return "";
  } catch (err) {
    console.error("[Spotify Cover Art Lookup failed]", err);
    return "";
  }
}

export async function resolveTrackCoverArt(options: {
  artist: string;
  track: string;
  topTrackImages: LastFmImage[];
  username?: string;
}): Promise<string> {
  const directLastFmImage = getLastFmImage(options.topTrackImages);
  if (directLastFmImage) return directLastFmImage;

  const trackInfoImage = await fetchTrackInfoCoverArt(
    options.artist,
    options.track,
    options.username
  );
  if (trackInfoImage) return trackInfoImage;

  const itunesImage = await getItunesCoverArt(options.artist, options.track);
  if (itunesImage) return itunesImage;

  return getSpotifyCoverArt(options.artist, options.track);
}

/**
 * Batch-resolves cover art for multiple tracks efficiently.
 * Runs all HTTP lookups in concurrency-controlled chunks of 5 to respect rate limits.
 */
export async function resolveTrackCoverArtBatch(
  tracks: Array<{
    artist: string;
    track: string;
    topTrackImages: LastFmImage[];
    username?: string;
  }>
): Promise<string[]> {
  // Step 1: Check direct Last.fm images (no HTTP — instant)
  const results: (string | null)[] = tracks.map((t) => {
    const img = getLastFmImage(t.topTrackImages);
    return img || null;
  });

  // Step 2: Check KV cache for tracks still missing a cover (in parallel, since KV handles it easily)
  const needsCacheCheck = results
    .map((r, i) => (r === null ? i : -1))
    .filter((i) => i !== -1);

  if (needsCacheCheck.length > 0) {
    try {
      const cachedCovers = await Promise.all(
        needsCacheCheck.map((i) => {
          const cleanTrack = cleanTrackTitleForCoverSearch(tracks[i].track);
          const cacheKey = `cover-art-v2:${tracks[i].artist.toLowerCase()}:${cleanTrack.toLowerCase()}`;
          return kv.get<string>(cacheKey).catch(() => null);
        })
      );

      needsCacheCheck.forEach((trackIdx, arrayIdx) => {
        if (cachedCovers[arrayIdx]) {
          results[trackIdx] = cachedCovers[arrayIdx];
        }
      });
    } catch (err) {
      console.error("KV batch cover-art read failed:", err);
    }
  }

  // Step 3: For those still missing — run track.getInfo in concurrency-limited chunks of 5
  const needsTrackInfo = results
    .map((r, i) => (r === null ? i : -1))
    .filter((i) => i !== -1);

  if (needsTrackInfo.length > 0) {
    const trackInfoResults = await runWithConcurrencyLimit(
      needsTrackInfo,
      (i) => fetchTrackInfoCoverArt(tracks[i].artist, tracks[i].track, tracks[i].username),
      5
    );
    needsTrackInfo.forEach((trackIdx, resultIdx) => {
      if (trackInfoResults[resultIdx]) {
        results[trackIdx] = trackInfoResults[resultIdx];
      }
    });
  }

  // Step 4: For those still missing — run iTunes in concurrency-limited chunks of 5
  const needsItunes = results
    .map((r, i) => (r === null ? i : -1))
    .filter((i) => i !== -1);

  if (needsItunes.length > 0) {
    const itunesResults = await runWithConcurrencyLimit(
      needsItunes,
      (i) => getItunesCoverArt(tracks[i].artist, tracks[i].track),
      5
    );
    needsItunes.forEach((trackIdx, resultIdx) => {
      if (itunesResults[resultIdx]) {
        results[trackIdx] = itunesResults[resultIdx];
      }
    });
  }

  // Step 5: For those still missing — run Spotify in concurrency-limited chunks of 5
  const needsSpotify = results
    .map((r, i) => (r === null ? i : -1))
    .filter((i) => i !== -1);

  if (needsSpotify.length > 0) {
    const spotifyResults = await runWithConcurrencyLimit(
      needsSpotify,
      (i) => getSpotifyCoverArt(tracks[i].artist, tracks[i].track),
      5
    );
    needsSpotify.forEach((trackIdx, resultIdx) => {
      results[trackIdx] = spotifyResults[resultIdx] || null;
    });
  }

  return results.map((r) => r ?? "");
}

