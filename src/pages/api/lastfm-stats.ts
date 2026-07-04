import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";
import { type MusicDashboardStats } from "../../lib/music";
import {
  isUsableCoverImage,
  getItunesCoverArt,
  getSpotifyCoverArt,
  getLastFmImage,
  type LastFmImage,
  type TopItem,
  type RecentTrack,
  type WeeklyChart
} from "../../lib/lastfm";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY as string;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME as string;
const BASE = "https://ws.audioscrobbler.com/2.0/";

type Stats = MusicDashboardStats;
type ApiError = { error: string };


async function lastfm<T>(params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({
    ...params,
    api_key: LASTFM_API_KEY,
    format: "json",
  });
  const response = await fetch(`${BASE}?${query}`, {
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error(`Last.fm ${response.status}`);
  const data = (await response.json()) as T & {
    error?: number;
    message?: string;
  };
  if (data.error)
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  return data;
}

const numberOf = (value: unknown) =>
  Number.parseInt(String(value ?? "0"), 10) || 0;
const dayKey = (date: Date) => date.toISOString().slice(0, 10);
const dayName = (date: Date) =>
  new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);

function streakFromDates(dates: string[]) {
  const uniqueDays = [...new Set(dates)].sort();
  let best = 0;
  let current = 0;
  let previous = 0;

  uniqueDays.forEach((key) => {
    const time = new Date(`${key}T00:00:00Z`).getTime();
    current = previous && time - previous === 86_400_000 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = time;
  });

  return best;
}

function listeningPeriod(hour: number) {
  if (hour < 6) return "Late night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

const PERIOD_WINDOWS: Record<string, number> = {
  week: 7,
  short: 30,
  medium: 180,
  long: 365,
};

const TOP_PERIOD_MAP: Record<string, string> = {
  week: "7day",
  short: "1month",
  medium: "6month",
  long: "12month",
};

function rangeParams(period: string): Record<string, string> {
  const days = PERIOD_WINDOWS[period];
  if (!days) return {};

  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 86_400;

  return { from: String(from), to: String(to) };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Stats | ApiError>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const period = (req.query.period as string) || "short";
  const apiPeriod = TOP_PERIOD_MAP[period] ?? TOP_PERIOD_MAP.short;
  const weeklyRange = rangeParams(period);
  const cacheKey = `lastfm-dashboard-v7-${LASTFM_USERNAME}-${period}`;

  try {
    const cached = await kv.get<Stats>(cacheKey);
    if (cached) {
      res.setHeader("x-cache", "HIT");
      return res.status(200).json(cached);
    }
  } catch {}

  try {
    if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
      throw new Error("Missing Last.fm environment variables");
    }

    const [
      info,
      tracks,
      artists,
      albums,
      recent,
      weeklyTracks,
      weeklyArtists,
      weeklyAlbums,
      chartList,
    ] = await Promise.all([
      lastfm<{
        user: {
          name: string;
          url: string;
          playcount: string;
          artist_count?: string;
          album_count?: string;
          track_count?: string;
          registered?: { unixtime: string };
        };
      }>({ method: "user.getInfo", user: LASTFM_USERNAME }),
      lastfm<{ toptracks: { track: TopItem[] } }>({
        method: "user.getTopTracks",
        user: LASTFM_USERNAME,
        period: apiPeriod,
        limit: "25",
      }),
      lastfm<{ topartists: { artist: TopItem[] } }>({
        method: "user.getTopArtists",
        user: LASTFM_USERNAME,
        period: apiPeriod,
        limit: "20",
      }),
      lastfm<{ topalbums: { album: TopItem[] } }>({
        method: "user.getTopAlbums",
        user: LASTFM_USERNAME,
        period: apiPeriod,
        limit: "20",
      }),
      lastfm<{ recenttracks: { track: RecentTrack[] } }>({
        method: "user.getRecentTracks",
        user: LASTFM_USERNAME,
        limit: "200",
      }),
      lastfm<{ weeklytrackchart: { track: TopItem[]; "@attr"?: WeeklyChart } }>(
        {
          method: "user.getWeeklyTrackChart",
          user: LASTFM_USERNAME,
          ...weeklyRange,
        }
      ),
      lastfm<{ weeklyartistchart: { artist: TopItem[] } }>({
        method: "user.getWeeklyArtistChart",
        user: LASTFM_USERNAME,
        ...weeklyRange,
      }),
      lastfm<{ weeklyalbumchart: { album: TopItem[] } }>({
        method: "user.getWeeklyAlbumChart",
        user: LASTFM_USERNAME,
        ...weeklyRange,
      }),
      lastfm<{ weeklychartlist: { chart: WeeklyChart[] } }>({
        method: "user.getWeeklyChartList",
        user: LASTFM_USERNAME,
      }),
    ]);

    const topTracks = tracks.toptracks?.track ?? [];
    const topArtists = artists.topartists?.artist ?? [];
    const topAlbums = albums.topalbums?.album ?? [];
    const recentTracks = recent.recenttracks?.track ?? [];
    const weeklyTrackItems = weeklyTracks.weeklytrackchart?.track ?? [];
    const weeklyArtistItems = weeklyArtists.weeklyartistchart?.artist ?? [];
    const weeklyAlbumItems = weeklyAlbums.weeklyalbumchart?.album ?? [];
    const availableCharts = chartList.weeklychartlist?.chart ?? [];

    const overallScrobbles = numberOf(info.user?.playcount);
    const artistCount = topArtists.length || numberOf(info.user?.artist_count);
    const albumCount = topAlbums.length || numberOf(info.user?.album_count);
    const trackCount = topTracks.length || numberOf(info.user?.track_count);
    const registeredAt = info.user?.registered?.unixtime
      ? numberOf(info.user.registered.unixtime) * 1000
      : null;
    const accountAgeDays = registeredAt
      ? Math.max(1, Math.floor((Date.now() - registeredAt) / 86_400_000))
      : 0;

    const durationSamples = topTracks
      .map((track) => numberOf(track.duration))
      .filter(Boolean);
    const averageTrackLength = durationSamples.length
      ? Math.round(
          durationSamples.reduce((sum, duration) => sum + duration, 0) /
            durationSamples.length
        )
      : 180;
    const rangeFrom = numberOf(weeklyRange.from) * 1000;
    const rangeTo = numberOf(weeklyRange.to) * 1000;

    const datedRecent = recentTracks.filter((track) => {
      if (!track.date?.uts) return false;
      const time = numberOf(track.date.uts) * 1000;
      return (!rangeFrom || time >= rangeFrom) && (!rangeTo || time <= rangeTo);
    });
    const hourCounts = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      plays: 0,
    }));
    const weekdayCounts = new Map<string, number>();
    const history = new Map<string, number>();

    datedRecent.forEach((track) => {
      const date = new Date(numberOf(track.date?.uts) * 1000);
      hourCounts[date.getUTCHours()].plays += 1;
      weekdayCounts.set(
        dayName(date),
        (weekdayCounts.get(dayName(date)) ?? 0) + 1
      );
      history.set(dayKey(date), (history.get(dayKey(date)) ?? 0) + 1);
    });

    const peak = [...hourCounts].sort((a, b) => b.plays - a.plays)[0] ?? {
      hour: 0,
      plays: 0,
    };
    const quiet = [...hourCounts].sort((a, b) => a.plays - b.plays)[0] ?? {
      hour: 0,
      plays: 0,
    };
    const mostActiveDay =
      [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const weeklyGrowth = weeklyTrackItems.reduce(
      (sum, item) => sum + numberOf(item.playcount),
      0
    );
    const monthlyGrowth = datedRecent.filter(
      (track) =>
        Date.now() - numberOf(track.date?.uts) * 1000 <= 30 * 86_400_000
    ).length;
    const chartArtists = weeklyArtistItems.length
      ? weeklyArtistItems
      : topArtists;
    const chartAlbums = weeklyAlbumItems.length ? weeklyAlbumItems : topAlbums;
    const chartTracks = weeklyTrackItems.length ? weeklyTrackItems : topTracks;
    const periodScrobbles =
      chartTracks.reduce((sum, item) => sum + numberOf(item.playcount), 0) ||
      datedRecent.length ||
      overallScrobbles;
    const minutes = Math.round((periodScrobbles * averageTrackLength) / 60);
    const topArtistTotal =
      chartArtists.reduce((sum, item) => sum + numberOf(item.playcount), 0) ||
      1;
    const topAlbumTotal =
      chartAlbums.reduce((sum, item) => sum + numberOf(item.playcount), 0) || 1;
    const topTrackTotal =
      chartTracks.reduce((sum, item) => sum + numberOf(item.playcount), 0) || 1;
    const current = recentTracks.find(
      (track) => track["@attr"]?.nowplaying === "true"
    );

    const result: Stats = {
      profile: {
        username: info.user?.name ?? LASTFM_USERNAME,
        url: info.user?.url ?? `https://www.last.fm/user/${LASTFM_USERNAME}`,
        playcount: overallScrobbles,
        artistCount,
        albumCount,
        trackCount,
        registeredAt,
      },
      totals: {
        streams: periodScrobbles,
        minutes,
        hours: Math.round(minutes / 60),
        averagePlaysPerDay: Math.round(
          periodScrobbles /
            Math.max(PERIOD_WINDOWS[period] ?? accountAgeDays, 1)
        ),
        accountAgeDays,
        averageTrackLength,
        averageAlbumPlays: Math.round(
          periodScrobbles / Math.max(albumCount, 1)
        ),
        averageArtistPlays: Math.round(
          periodScrobbles / Math.max(artistCount, 1)
        ),
        weeklyGrowth,
        monthlyGrowth,
      },
      current: {
        isPlaying: Boolean(current),
        track: current?.name,
        artist:
          typeof current?.artist === "string"
            ? current.artist
            : current?.artist?.name,
        url: current?.url,
      },
      insights: {
        longestListeningStreak: streakFromDates(
          datedRecent.map((track) =>
            dayKey(new Date(numberOf(track.date?.uts) * 1000))
          )
        ),
        mostActiveListeningDay: mostActiveDay,
        favoriteListeningPeriod: listeningPeriod(peak.hour),
        peakHour: peak.hour,
        quietHour: quiet.hour,
        artistDiversity: weeklyArtistItems.length,
        albumDiversity: weeklyAlbumItems.length || availableCharts.length,
      },
      charts: {
        listeningClock: hourCounts,
        weeklyActivity: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
          (day) => ({ day, plays: weekdayCounts.get(day) ?? 0 })
        ),
        listeningHistory: [...history.entries()]
          .sort()
          .slice(-14)
          .map(([label, plays]) => ({ label: label.slice(5), plays })),
        topArtists: chartArtists.slice(0, 8).map((item) => ({
          name: item.name,
          plays: numberOf(item.playcount),
          share: Math.round((numberOf(item.playcount) / topArtistTotal) * 100),
        })),
        topAlbums: await Promise.all(topAlbums.slice(0, 20).map(async (item) => {
          const artist =
            typeof item.artist === "string"
              ? item.artist
              : item.artist?.name ?? "";

          const lastFmCover = getLastFmImage(item.image ?? []);

          // If Last.fm gave us a real image, use it; otherwise fall back to iTunes then Spotify
          let coverUrl = isUsableCoverImage(lastFmCover) ? lastFmCover : "";
          if (!coverUrl) {
            coverUrl = await getItunesCoverArt(artist, item.name).catch(() => "");
          }
          if (!coverUrl) {
            coverUrl = await getSpotifyCoverArt(artist, item.name).catch(() => "");
          }

          return {
            name: item.name,
            artist,
            plays: numberOf(item.playcount),
            share: Math.round((numberOf(item.playcount) / topAlbumTotal) * 100),
            coverUrl: coverUrl || undefined,
            url: item.url ?? undefined,
          };
        })),
        topTracks: chartTracks.slice(0, 8).map((item) => ({
          name: item.name,
          artist:
            typeof item.artist === "string"
              ? item.artist
              : item.artist?.name ?? "",
          plays: numberOf(item.playcount),
          share: Math.round((numberOf(item.playcount) / topTrackTotal) * 100),
        })),
      },
    };

    try {
      await kv.set(cacheKey, result, { ex: 60 * 60 });
    } catch {}

    res.setHeader("x-cache", "MISS");
    return res.status(200).json(result);
  } catch (err) {
    console.error("lastfm-stats failed:", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
}
