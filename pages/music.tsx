import { AnimatePresence, motion } from "framer-motion";
import { NextSeo } from "next-seo";
import { ArrowLeft, ArrowRight, Radio, Sparkles } from "lucide-react";
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
const dayLabels: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

type TooltipState = { title: string; lines: string[]; x: number; y: number };

function Tooltip({ tooltip }: { tooltip: TooltipState | null }) {
  return (
    <AnimatePresence>
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-none fixed z-50 min-w-36 rounded-xl border px-3 py-2 text-xs shadow-2xl"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y + 14,
            borderColor: "var(--card-border)",
            background:
              "color-mix(in srgb, var(--card-bg) 94%, var(--bg-primary))",
            color: "var(--text-primary)",
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
            {tooltip.title}
          </p>
          {tooltip.lines.map((line) => (
            <p
              key={line}
              className="mt-0.5 font-medium text-[var(--text-primary)]"
            >
              {line}
            </p>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`skeleton-pulse rounded-2xl border ${className}`}
      style={{
        borderColor: "var(--card-border)",
        background: "var(--bg-secondary)",
      }}
    />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-[var(--text-secondary)]"
      style={{ borderColor: "var(--card-border)" }}
    >
      {message}
    </div>
  );
}

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay }}
      className="group flex min-h-28 flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderColor: "var(--card-border)",
        background: "var(--card-bg)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
        {label}
      </p>
      <div>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-black tabular-nums tracking-tight text-[var(--text-primary)] sm:text-3xl"
        >
          {value}
        </motion.p>
        {detail && (
          <p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">
            {detail}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      className={`rounded-2xl border p-4 ${className}`}
      style={{
        borderColor: "var(--card-border)",
        background: "var(--card-bg)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
        {title}
      </p>
      {children}
    </motion.div>
  );
}

function DonutChart({
  data,
  label,
  emptyText,
}: {
  data: { name: string; plays: number; share: number }[];
  label: string;
  emptyText: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const total = data.reduce((sum, item) => sum + item.plays, 0) || 1;
  let offset = 25;
  return (
    <ChartCard title={label} className="min-h-[190px]">
      <Tooltip tooltip={tooltip} />
      {!data.length ? (
        <div className="mt-4">
          <EmptyState message={emptyText} />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-[136px_1fr] sm:items-center">
          <svg
            viewBox="0 0 42 42"
            className="mx-auto h-32 w-32 -rotate-90"
            role="img"
            aria-label={`${label} distribution`}
          >
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="var(--bg-secondary)"
              strokeWidth="7"
            />
            {data.slice(0, 6).map((item, index) => {
              const dash = (item.plays / total) * 100;
              const current = offset;
              offset += dash;
              return (
                <motion.circle
                  key={item.name}
                  initial={{ strokeDasharray: `0 100` }}
                  animate={{ strokeDasharray: `${dash} ${100 - dash}` }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={`color-mix(in srgb, var(--text-primary) ${
                    92 - index * 10
                  }%, var(--bg-secondary))`}
                  strokeWidth="7"
                  strokeDashoffset={100 - current}
                  strokeLinecap="round"
                  className="cursor-pointer transition-opacity hover:opacity-70"
                  onMouseMove={(event) =>
                    setTooltip({
                      title: item.name,
                      lines: [
                        `${formatPlaycount(item.plays)} plays`,
                        `${item.share}%`,
                      ],
                      x: event.clientX,
                      y: event.clientY,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </svg>
          <div className="space-y-1.5">
            {data.slice(0, 6).map((item) => (
              <button
                key={item.name}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm transition-colors hover:bg-[var(--bg-secondary)]"
                onMouseMove={(event) =>
                  setTooltip({
                    title: item.name,
                    lines: [
                      `${formatPlaycount(item.plays)} plays`,
                      `${item.share}%`,
                    ],
                    x: event.clientX,
                    y: event.clientY,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              >
                <span className="truncate text-[var(--text-primary)]">
                  {item.name}
                </span>
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  {item.share}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
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
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const max = Math.max(...data.map((d) => d.plays), 1);
  return (
    <ChartCard title="Listening clock" className="h-full min-h-[260px]">
      <Tooltip tooltip={tooltip} />
      <div className="mt-1 flex items-start justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          24-hour rhythm
        </h2>
        <p className="text-right font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)]">
          Peak {formatHour(peakHour)}
          <br />
          Quiet {formatHour(quietHour)}
        </p>
      </div>
      {!data.some((item) => item.plays) ? (
        <div className="mt-4">
          <EmptyState message="No listening history for this period." />
        </div>
      ) : (
        <div
          className="mt-5 grid gap-1"
          style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
          role="img"
          aria-label="Hourly listening activity chart"
        >
          {data.map((item) => {
            const isPeak = item.hour === peakHour;
            const isQuiet = item.hour === quietHour;
            return (
              <button
                key={item.hour}
                type="button"
                aria-label={`${formatHour(item.hour)} ${item.plays} scrobbles`}
                className="group flex h-32 items-end justify-center rounded-full bg-[var(--bg-secondary)] p-0.5 transition-transform duration-200 hover:-translate-y-1"
                onMouseMove={(event) =>
                  setTooltip({
                    title: formatHour(item.hour),
                    lines: [
                      `${formatPlaycount(item.plays)} scrobbles`,
                      isPeak
                        ? "Peak listening hour"
                        : isQuiet
                        ? "Quiet hour"
                        : "Listening activity",
                    ],
                    x: event.clientX,
                    y: event.clientY,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              >
                <motion.span
                  key={`${item.hour}-${item.plays}`}
                  initial={{ height: 0 }}
                  whileInView={{
                    height: `${Math.max(8, (item.plays / max) * 100)}%`,
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="w-full rounded-full transition-colors duration-200 group-hover:bg-[var(--accent)]"
                  style={{
                    background: isPeak
                      ? "var(--accent)"
                      : "color-mix(in srgb, var(--text-primary) 42%, transparent)",
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-2 flex justify-between font-mono text-[9px] text-[var(--text-secondary)]">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </ChartCard>
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
      left: dir * Math.min(460, ref.current.clientWidth * 0.9),
      behavior: "smooth",
    });
  return (
    <section className="overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Top Tracks
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Swipe through the tracks defining this range.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Previous top tracks"
            onClick={() => scroll(-1)}
            className="rounded-full border p-2 transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ borderColor: "var(--card-border)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next top tracks"
            onClick={() => scroll(1)}
            className="rounded-full border p-2 transition-colors hover:bg-[var(--bg-secondary)]"
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
        className="music-carousel -mx-4 flex max-w-[100vw] snap-x gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-3 sm:-mx-6 sm:px-6"
        aria-label="Scrollable top tracks"
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-[76vw] max-w-[286px] shrink-0 snap-start rounded-2xl border p-3 sm:w-64"
              style={{ borderColor: "var(--card-border)" }}
            >
              <MusicTrackSkeleton index={i} />
            </div>
          ))
        ) : tracks.length ? (
          tracks.map((track) => (
            <a
              key={`${track.songUrl}-${track.rank}`}
              href={track.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-[76vw] max-w-[286px] shrink-0 snap-start rounded-2xl border p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:w-64"
              style={{
                borderColor: "var(--card-border)",
                background: "var(--card-bg)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <div
                className="relative aspect-square overflow-hidden rounded-xl border"
                style={{ borderColor: "var(--card-border)" }}
              >
                <MusicArtwork
                  src={track.cover}
                  alt={`${track.title} cover`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] transition-opacity duration-200 group-hover:opacity-70">
                #{track.rank} · {formatPlaycount(track.playcount)} plays
              </p>
              <h3 className="mt-1 truncate font-display text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                {track.title}
              </h3>
              <p className="truncate text-sm text-[var(--text-secondary)]">
                {track.artist}
              </p>
            </a>
          ))
        ) : (
          <div className="w-full">
            <EmptyState message="No tracks found for this period." />
          </div>
        )}
      </div>
    </section>
  );
}

function ListeningHistory({
  data,
}: {
  data: { label: string; plays: number }[];
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const max = Math.max(...data.map((x) => x.plays), 1);
  return (
    <ChartCard
      title="Listening history"
      className="min-h-[240px] lg:col-span-3"
    >
      <Tooltip tooltip={tooltip} />
      {!data.length ? (
        <div className="mt-4">
          <EmptyState message="No listening history for this period." />
        </div>
      ) : (
        <div className="mt-5 flex h-36 items-end gap-2">
          {data.map((d) => (
            <button
              key={d.label}
              type="button"
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
              onMouseMove={(event) =>
                setTooltip({
                  title: d.label,
                  lines: [`${formatPlaycount(d.plays)} scrobbles`],
                  x: event.clientX,
                  y: event.clientY,
                })
              }
              onMouseLeave={() => setTooltip(null)}
            >
              <motion.span
                key={`${d.label}-${d.plays}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(6, (d.plays / max) * 100)}%` }}
                transition={{ duration: 0.35 }}
                className="w-full rounded-t-lg bg-[var(--accent)] opacity-70 transition-all duration-200 group-hover:opacity-100"
              />
              <span className="font-mono text-[9px] text-[var(--text-secondary)]">
                {d.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function WeeklyHeatmap({ data }: { data: { day: string; plays: number }[] }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const max = Math.max(...data.map((x) => x.plays), 1);
  const active = data.reduce(
    (best, item) => (item.plays > best.plays ? item : best),
    data[0] ?? { day: "", plays: 0 }
  );
  return (
    <ChartCard title="Weekly heatmap" className="min-h-[240px] lg:col-span-2">
      <Tooltip tooltip={tooltip} />
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>Selected range</span>
        <span className="font-mono">Peak {active?.day || "—"}</span>
      </div>
      {!data.some((d) => d.plays) ? (
        <div className="mt-4">
          <EmptyState message="No weekly activity for this period." />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-7 gap-2">
          {data.map((d) => {
            const intensity = Math.round(18 + (d.plays / max) * 62);
            return (
              <button
                key={d.day}
                type="button"
                className="rounded-xl p-3 text-center transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: `color-mix(in srgb, var(--accent) ${intensity}%, var(--bg-secondary))`,
                  outline:
                    d.day === active.day ? "1px solid var(--accent)" : "none",
                }}
                onMouseMove={(event) =>
                  setTooltip({
                    title: dayLabels[d.day] ?? d.day,
                    lines: [`${formatPlaycount(d.plays)} plays`],
                    x: event.clientX,
                    y: event.clientY,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              >
                <p className="font-mono text-[9px] text-[var(--accent-text)] opacity-80">
                  {d.day}
                </p>
                <motion.p
                  key={d.plays}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 font-display text-lg font-bold text-[var(--accent-text)]"
                >
                  {d.plays}
                </motion.p>
              </button>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

export default function MusicPage() {
  const [period, setPeriod] = useState<MusicPeriod>(DEFAULT_MUSIC_PERIOD);
  const { tracks, isLoading: tracksLoading } = useTopTracks(period);
  const { data: stats, isValidating } = useSWR<MusicDashboardStats>(
    `/api/lastfm-stats?period=${period}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const activePeriod =
    MUSIC_PERIODS.find((p) => p.value === period) ?? MUSIC_PERIODS[0];
  const isStatsLoading = !stats || isValidating;
  const statsCards = useMemo(
    () =>
      stats
        ? [
            [
              "Streams",
              formatPlaycount(stats.totals.streams),
              "Selected range",
            ],
            [
              "Minutes",
              formatPlaycount(stats.totals.minutes),
              `${formatPlaycount(stats.totals.hours)} hours`,
            ],
            [
              "Tracks",
              formatPlaycount(stats.profile.trackCount),
              "Unique top tracks",
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
              "Daily avg",
              formatPlaycount(stats.totals.averagePlaysPerDay),
              "Plays per day",
            ],
            [
              "Streak",
              `${stats.insights.longestListeningStreak}d`,
              "Recent sample",
            ],
            [
              "Track length",
              formatSeconds(stats.totals.averageTrackLength),
              "Estimated avg",
            ],
            [
              "Growth",
              `+${formatPlaycount(stats.totals.weeklyGrowth)}`,
              activePeriod.description,
            ],
            [
              "Recent",
              `+${formatPlaycount(stats.totals.monthlyGrowth)}`,
              "From recent tracks",
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
    [activePeriod.description, stats]
  );

  return (
    <>
      <NextSeo
        title="music — abyn"
        description="A modern Last.fm music analytics dashboard."
        canonical="https://abyn.xyz/music"
      />
      <main className="mx-auto w-full max-w-6xl overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-3xl border p-5 sm:p-7"
          style={{
            borderColor: "var(--card-border)",
            background: "var(--card-bg)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                03 — Music dashboard
              </p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-6xl">
                Last.fm replay
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                <strong className="font-medium text-[var(--text-primary)]">
                  My music history.
                </strong>{" "}
                Every scrobble tells a story.
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-[var(--text-secondary)]">
            {activePeriod.description}
          </p>
          <MusicPeriodTabs active={period} onChange={setPeriod} />
        </div>
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {isStatsLoading && !stats
            ? Array.from({ length: 12 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-28" />
              ))
            : statsCards.map(([label, value, detail], i) => (
                <StatCard
                  key={label}
                  label={label}
                  value={value}
                  detail={detail}
                  delay={i * 0.015}
                />
              ))}
        </div>
        <div className="mb-8">
          <TrackCarousel tracks={tracks} isLoading={tracksLoading} />
        </div>
        {isStatsLoading && !stats ? (
          <div className="grid gap-4 lg:grid-cols-5">
            <SkeletonBlock className="h-64 lg:col-span-3" />
            <SkeletonBlock className="h-64 lg:col-span-2" />
            <SkeletonBlock className="h-56 lg:col-span-3" />
            <SkeletonBlock className="h-56 lg:col-span-2" />
          </div>
        ) : (
          stats && (
            <motion.div
              layout
              className="grid items-stretch gap-4 lg:grid-cols-5"
            >
              <div className="lg:col-span-3">
                <ListeningClock
                  data={stats.charts.listeningClock}
                  peakHour={stats.insights.peakHour}
                  quietHour={stats.insights.quietHour}
                />
              </div>
              <div className="grid gap-4 lg:col-span-2">
                <DonutChart
                  label="Top artists share"
                  data={stats.charts.topArtists}
                  emptyText="No artists available for this period."
                />
                <DonutChart
                  label="Top albums share"
                  data={stats.charts.topAlbums}
                  emptyText="No albums available for this period."
                />
              </div>
              <ListeningHistory data={stats.charts.listeningHistory} />
              <WeeklyHeatmap data={stats.charts.weeklyActivity} />
            </motion.div>
          )
        )}
        <div className="mt-10">
          <PageFooter />
        </div>
      </main>
    </>
  );
}
