export interface UpcomingQueueItem {
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  songUrl?: string;
  durationMs: number;
}

export interface NowPlayingSong {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  popularity?: number;
  genre?: string[];
  isArtistGenre?: boolean;
  progressMs?: number;
  durationMs?: number;
  upcomingQueue?: UpcomingQueueItem[];
  error?: string;
}