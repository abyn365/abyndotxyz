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

export async function getItunesCoverArt(
  artist: string,
  track: string
): Promise<string> {
  try {
    const query = encodeURIComponent(`${artist} ${track}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1&country=US`,
      { signal: AbortSignal.timeout(4000) }
    );

    if (!res.ok) return "";

    const data = await res.json();
    const artworkUrl = data.results?.[0]?.artworkUrl100 as string | undefined;

    if (!artworkUrl) return "";

    return artworkUrl.replace(/\/[0-9]+x[0-9]+bb\./, "/600x600bb.");
  } catch {
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

  return getItunesCoverArt(options.artist, options.track);
}
