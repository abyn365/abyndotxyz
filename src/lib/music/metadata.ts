/**
 * music/metadata.ts
 * Normalize and merge track metadata from multiple sources.
 */

export interface TrackMetadata {
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  duration?: number; // seconds
  songUrl?: string;   // Spotify/Last.fm URL for linking
  videoId?: string;   // YouTube video ID (once resolved)
  playcount?: number;
  rank?: number;
  provider?: "youtube" | "youtube-music" | "soundcloud";
  resolvedUrl?: string;
}

/**
 * Merge metadata from the lyrics API response with base track data.
 * Lyrics API metadata takes precedence for albumArt and album name.
 */
export function resolveMetadata(
  base: TrackMetadata,
  lyricsApiMeta: {
    title?: string;
    artist?: string;
    album?: string;
    albumArt?: string;
    durationMs?: number;
  } | undefined
): TrackMetadata {
  if (!lyricsApiMeta) return base;

  return {
    ...base,
    // Prefer lyrics API album art (higher res from Apple Music)
    cover: lyricsApiMeta.albumArt ?? base.cover,
    album: lyricsApiMeta.album ?? base.album,
    // Only override duration if we don't have one
    duration: base.duration ?? (lyricsApiMeta.durationMs ? lyricsApiMeta.durationMs / 1000 : undefined),
  };
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function isSameTrack(
  t1: { title?: string; artist?: string } | null | undefined,
  t2: { title?: string; artist?: string } | null | undefined
): boolean {
  if (!t1 || !t2) return false;

  const normalize = (s?: string) =>
    (s ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

  return normalize(t1.title) === normalize(t2.title) && normalize(t1.artist) === normalize(t2.artist);
}
