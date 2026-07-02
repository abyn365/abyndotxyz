import { AnimatePresence, motion } from "framer-motion";
import { NextSeo } from "next-seo";
import {
  ArrowLeft,
  ArrowRight,
  Headphones,
  Radio,
  Sparkles,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import useSWR from "swr";
import MusicArtwork from "../components/music/MusicArtwork";
import MusicPeriodTabs from "../components/music/MusicPeriodTabs";
import MusicTrackSkeleton from "../components/music/MusicTrackSkeleton";
import { useTopTracks } from "../hooks/useTopTracks";
import { fetcher } from "../lib/fetcher";
import {
  DEFAULT_MUSIC_PERIOD,
  MUSIC_PERIODS,
  formatPlaycount,
  type MusicDashboardStats,
  type MusicPeriod,
} from "../lib/music";
import { PageFooter } from "./index";

const formatHour = (hour: number) => `${hour.toString().padStart(2, "0")}:00`;
const formatSeconds = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function StatCard({
  label,
  value,
  detail,
  delay = 0,
}: {
  label: string;
  value: string;
  detail?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.32, delay }}
      className="rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        borderColor: "var(--card-border)",
        background: "var(--card-bg)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-[var(--text-primary)] sm:text-3xl">
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p>
      )}
    </motion.div>
  );
}

function DonutChart({
  data,
  label,
}: {
  data: { name: string; plays: number; share: number }[];
  label: string;
}) {
  const total = data.reduce((sum, item) => sum + item.plays, 0) || 1;
  let offset = 25;
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "var(--card-border)",
        background: "var(--card-bg)",
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
        {label}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
        <svg
          viewBox="0 0 42 42"
          className="mx-auto h-36 w-36 -rotate-90"
          role="img"
          aria-label={`${label} distribution`}
        >
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="var(--bg-secondary)"
            strokeWidth="6"
          />
          {data.slice(0, 6).map((item, index) => {
            const dash = (item.plays / total) * 100;
            const current = offset;
            offset += dash;
            return (
              <circle
                key={item.name}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={`color-mix(in srgb, var(--text-primary) ${
                  90 - index * 10
                }%, var(--bg-secondary))`}
                strokeWidth="6"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={100 - current}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="space-y-2">
          {data.slice(0, 6).map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="truncate text-[var(--text-primary)]">
                {item.name}
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {item.share}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ListeningClock({
  data,
  peakHour,
  quietHour,
}: {
  data: { hour: number; plays: number }[];
  peakHour: number;
  quietHour: number;
}) {
  const max = Math.max(...data.map((d) => d.plays), 1);
  return (
    <div
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: "var(--card-border)",
        background: "var(--card-bg)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            Listening clock
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">
            24-hour rhythm
          </h2>
        </div>
        <p className="text-right font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
          Peak {formatHour(peakHour)}
          <br />
          Quiet {formatHour(quietHour)}
        </p>
      </div>
      <div
        className="mt-6 grid gap-1"
        style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
        role="img"
        aria-label="Hourly listening activity chart"
      >
        {data.map((item) => (
          <div
            key={item.hour}
            className="flex h-32 items-end justify-center rounded-full bg-[var(--bg-secondary)] p-0.5"
            title={`${formatHour(item.hour)} · ${item.plays} plays`}
          >
            <motion.div
              initial={{ height: 0 }}
              whileInView={{
                height: `${Math.max(8, (item.plays / max) * 100)}%`,
              }}
              viewport={{ once: true }}
              className="w-full rounded-full"
              style={{
                background:
                  item.hour === peakHour
                    ? "var(--accent)"
                    : "color-mix(in srgb, var(--text-primary) 42%, transparent)",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-[var(--text-secondary)]">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </div>
  );
}

function TrackCarousel({
  tracks,
  isLoading,
}: {
  tracks: ReturnType<typeof useTopTracks>["tracks"];
  isLoading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    ref.current?.scrollBy({
      left: dir * Math.min(420, ref.current.clientWidth * 0.85),
      behavior: "smooth",
    });
  return (
    <section className="overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Top tracks carousel
        </h2>
        <div className="flex gap-2">
          <button
            aria-label="Previous top tracks"
            onClick={() => scroll(-1)}
            className="rounded-full border p-2"
            style={{ borderColor: "var(--card-border)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next top tracks"
            onClick={() => scroll(1)}
            className="rounded-full border p-2"
            style={{ borderColor: "var(--card-border)" }}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") scroll(1);
          if (e.key === "ArrowLeft") scroll(-1);
        }}
        className="music-carousel -mx-4 flex max-w-[100vw] snap-x gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:-mx-6 sm:px-6"
        aria-label="Scrollable top tracks"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[78vw] max-w-[300px] shrink-0 snap-start rounded-2xl border p-4 sm:w-72"
                style={{ borderColor: "var(--card-border)" }}
              >
                <MusicTrackSkeleton index={i} />
              </div>
            ))
          : tracks.map((track) => (
              <a
                key={`${track.songUrl}-${track.rank}`}
                href={track.songUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-[78vw] max-w-[300px] shrink-0 snap-start rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 sm:w-72"
                style={{
                  borderColor: "var(--card-border)",
                  background: "var(--card-bg)",
                  boxShadow: "var(--card-shadow)",
                }}
              >
                <div
                  className="aspect-square overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <MusicArtwork
                    src={track.cover}
                    alt={`${track.title} cover`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                  #{track.rank} · {formatPlaycount(track.playcount)} plays
                </p>
                <h3 className="mt-1 truncate font-display text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                  {track.title}
                </h3>
                <p className="truncate text-sm text-[var(--text-secondary)]">
                  {track.artist}
                </p>
              </a>
            ))}
      </div>
    </section>
  );
}

export default function MusicPage() {
  const [period, setPeriod] = useState<MusicPeriod>(DEFAULT_MUSIC_PERIOD);
  const { tracks, isLoading } = useTopTracks(period);
  const { data: stats } = useSWR<MusicDashboardStats>(
    "/api/lastfm-stats",
    fetcher,
    { revalidateOnFocus: false }
  );
  const activePeriod =
    MUSIC_PERIODS.find((p) => p.value === period) ?? MUSIC_PERIODS[0];
  const statsCards = useMemo(
    () =>
      stats
        ? [
            [
              "Streams",
              formatPlaycount(stats.totals.streams),
              "Total scrobbles",
            ],
            [
              "Minutes listened",
              formatPlaycount(stats.totals.minutes),
              `${formatPlaycount(stats.totals.hours)} hours`,
            ],
            [
              "Tracks",
              formatPlaycount(stats.profile.trackCount),
              "Catalog breadth",
            ],
            [
              "Albums",
              formatPlaycount(stats.profile.albumCount),
              `${formatPlaycount(stats.totals.averageAlbumPlays)} avg plays`,
            ],
            [
              "Artists",
              formatPlaycount(stats.profile.artistCount),
              `${formatPlaycount(stats.totals.averageArtistPlays)} avg plays`,
            ],
            [
              "Daily average",
              formatPlaycount(stats.totals.averagePlaysPerDay),
              "Plays per day",
            ],
            [
              "Longest streak",
              `${stats.insights.longestListeningStreak}d`,
              "Recent history",
            ],
            [
              "Track length",
              formatSeconds(stats.totals.averageTrackLength),
              "Estimated average",
            ],
            [
              "Weekly growth",
              `+${formatPlaycount(stats.totals.weeklyGrowth)}`,
              "This chart week",
            ],
            [
              "Monthly growth",
              `+${formatPlaycount(stats.totals.monthlyGrowth)}`,
              "Recent tracks sample",
            ],
            [
              "Account age",
              `${formatPlaycount(stats.totals.accountAgeDays)}d`,
              stats.profile.registeredAt
                ? new Date(stats.profile.registeredAt).toLocaleDateString()
                : "Registered",
            ],
            [
              "Active day",
              stats.insights.mostActiveListeningDay,
              stats.insights.favoriteListeningPeriod,
            ],
          ]
        : [],
    [stats]
  );
  return (
    <>
      <NextSeo
        title="music — abyn"
        description="A modern Last.fm music analytics dashboard."
        canonical="https://abyn.xyz/music"
      />
      <main className="mx-auto w-full max-w-6xl overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 overflow-hidden rounded-3xl border p-5 sm:p-7"
          style={{
            borderColor: "var(--card-border)",
            background:
              "linear-gradient(135deg, var(--card-bg), color-mix(in srgb, var(--accent) 7%, transparent))",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                03 — Music dashboard
              </p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-6xl">
                Last.fm replay
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                A polished snapshot of listening habits, peak hours, artist
                share, and long-term scrobble momentum via Last.fm.
              </p>
            </div>
            <div className="grid gap-2 sm:min-w-[300px] sm:grid-cols-2">
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--card-border)",
                  background: "var(--social-bg-mix)",
                }}
              >
                <Radio className="mb-2 h-4 w-4 text-[var(--accent)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {stats?.current.isPlaying
                    ? "Currently listening"
                    : "Listening status"}
                </p>
                <p className="truncate text-xs text-[var(--text-secondary)]">
                  {stats?.current.isPlaying
                    ? `${stats.current.track} — ${stats.current.artist}`
                    : "No active scrobble"}
                </p>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--card-border)",
                  background: "var(--social-bg-mix)",
                }}
              >
                <Sparkles className="mb-2 h-4 w-4 text-[var(--accent)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Favorite period
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {stats?.insights.favoriteListeningPeriod ?? "Analyzing…"}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-[var(--text-secondary)]">
            {activePeriod.description}
          </p>
          <MusicPeriodTabs active={period} onChange={setPeriod} />
        </div>
        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {statsCards.map(([label, value, detail], i) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              detail={detail}
              delay={i * 0.02}
            />
          ))}
        </div>
        <div className="mb-10">
          <TrackCarousel tracks={tracks} isLoading={isLoading} />
        </div>
        {stats && (
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ListeningClock
                data={stats.charts.listeningClock}
                peakHour={stats.insights.peakHour}
                quietHour={stats.insights.quietHour}
              />
            </div>
            <div className="space-y-4 lg:col-span-2">
              <DonutChart
                label="Top artists share"
                data={stats.charts.topArtists}
              />
              <DonutChart
                label="Top albums share"
                data={stats.charts.topAlbums}
              />
            </div>
            <div
              className="rounded-2xl border p-4 lg:col-span-3"
              style={{
                borderColor: "var(--card-border)",
                background: "var(--card-bg)",
              }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                Listening history
              </p>
              <div className="mt-5 flex h-40 items-end gap-2">
                {stats.charts.listeningHistory.map((d) => (
                  <div
                    key={d.label}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t-lg bg-[var(--accent)]"
                      style={{
                        height: `${Math.max(
                          8,
                          (d.plays /
                            Math.max(
                              ...stats.charts.listeningHistory.map(
                                (x) => x.plays
                              ),
                              1
                            )) *
                            100
                        )}%`,
                      }}
                    />
                    <span className="font-mono text-[9px] text-[var(--text-secondary)]">
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="rounded-2xl border p-4 lg:col-span-2"
              style={{
                borderColor: "var(--card-border)",
                background: "var(--card-bg)",
              }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                Weekly heatmap
              </p>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {stats.charts.weeklyActivity.map((d) => (
                  <div
                    key={d.day}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: `color-mix(in srgb, var(--accent) ${Math.min(
                        70,
                        12 + d.plays * 4
                      )}%, var(--bg-secondary))`,
                    }}
                  >
                    <p className="font-mono text-[10px] text-[var(--accent-text)]">
                      {d.day}
                    </p>
                    <p className="font-display text-lg font-bold text-[var(--accent-text)]">
                      {d.plays}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-12">
          <PageFooter />
        </div>
      </main>
    </>
  );
}
