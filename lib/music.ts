export type MusicTrack = {
  artist: string;
  title: string;
  songUrl: string;
  cover: string;
  playcount: number;
  rank: number;
  duration?: number;
};

export type MusicDashboardStats = {
  profile: {
    username: string;
    url: string;
    playcount: number;
    artistCount: number;
    albumCount: number;
    trackCount: number;
    registeredAt: number | null;
  };
  totals: {
    streams: number;
    minutes: number;
    hours: number;
    averagePlaysPerDay: number;
    accountAgeDays: number;
    averageTrackLength: number;
    averageAlbumPlays: number;
    averageArtistPlays: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
  current: {
    isPlaying: boolean;
    track?: string;
    artist?: string;
    url?: string;
  };
  insights: {
    longestListeningStreak: number;
    mostActiveListeningDay: string;
    favoriteListeningPeriod: string;
    peakHour: number;
    quietHour: number;
    artistDiversity: number;
    albumDiversity: number;
  };
  charts: {
    listeningClock: { hour: number; plays: number }[];
    weeklyActivity: { day: string; plays: number }[];
    listeningHistory: { label: string; plays: number }[];
    topArtists: { name: string; plays: number; share: number }[];
    topAlbums: { name: string; artist: string; plays: number; share: number; coverUrl?: string; url?: string; year?: string }[];
    topTracks: { name: string; artist: string; plays: number; share: number }[];
  };
};

export type MusicPeriod = "week" | "short" | "medium" | "long";

export const MUSIC_PERIODS: {
  value: MusicPeriod;
  label: string;
  description: string;
}[] = [
  { value: "week", label: "7D", description: "Last 7 days" },
  { value: "short", label: "1M", description: "Last month" },
  { value: "medium", label: "6M", description: "Last 6 months" },
  { value: "long", label: "1Y", description: "Last 12 months" },
];

export const DEFAULT_MUSIC_PERIOD: MusicPeriod = "short";

export function formatPlaycount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}
