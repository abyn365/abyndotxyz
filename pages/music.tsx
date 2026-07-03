import { AnimatePresence, motion } from "framer-motion";
import { NextSeo } from "next-seo";
import { ArrowLeft, ArrowRight, Radio, Sparkles, Play, Pause } from "lucide-react";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import MusicArtwork from "../components/music/MusicArtwork";
import MusicPeriodTabs from "../components/music/MusicPeriodTabs";
import MusicTrackSkeleton from "../components/music/MusicTrackSkeleton";
import MusicTrackCard from "../components/music/MusicTrackCard";
import MusicVisualizer from "../components/music/MusicVisualizer";
import AlbumCarousel from "../components/music/AlbumCarousel";
import { useMusicPlayer } from "../components/music/MusicPlayerContext";
import { useTopTracks } from "../hooks/useTopTracks";
import { useDragScroll } from "../hooks/useDragScroll";
import { fetcher } from "../lib/fetcher";
import {
  DEFAULT_MUSIC_PERIOD,
  MUSIC_PERIODS,
  formatPlaycount,
  type MusicDashboardStats,
  type MusicPeriod,
} from "../lib/music";
import { type TrackMetadata } from "../lib/music/metadata";
import { PageFooter } from "./index";

ChartJS.register(ArcElement, ChartTooltip, Legend);

const DISCORD_ID = "877018055815868426";

const formatHour12 = (hour: number) => {
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${ampm}`;
};

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

interface LanyardResponse {
  data: {
    discord_status: "online" | "idle" | "dnd" | "offline";
    listening_to_spotify: boolean;
    spotify: {
      track_id: string;
      song: string;
      artist: string;
      album: string;
      album_art_url: string;
    } | null;
  };
  success: boolean;
}

function Tooltip({ tooltip }: { tooltip: TooltipState | null }) {
  return (
    <AnimatePresence>
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="pointer-events-none fixed z-50 min-w-40 rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur-md font-sans"
          style={{
            borderColor: "var(--card-border)",
            background: "color-mix(in srgb, var(--card-bg) 95%, var(--bg-primary))",
            color: "var(--text-primary)",
            left: tooltip.x + 14,
            top: tooltip.y + 14,
          }}
        >
          <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)]">
            {tooltip.title}
          </p>
          {tooltip.lines.map((line, idx) => (
            <p
              key={idx}
              className="mt-0.5 font-medium text-[var(--text-primary)] last:text-[var(--text-secondary)] last:font-normal"
            >
              {line}
            </p>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
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
      layout="position"
      className={`flex flex-col py-6 border-b ${className}`}
      style={{
        borderColor: "var(--card-border)",
        background: "transparent",
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-secondary)] mb-2 shrink-0">
        {title}
      </p>
      <div className="flex-1 flex flex-col justify-between min-h-0 w-full overflow-visible">
        {children}
      </div>
    </motion.div>
  );
}

// ... Rest of your secondary static blocks stay untouched ...
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



function LivePresenceCard() {
  const { data: presence } = useSWR<LanyardResponse>(
    `https://api.lanyard.rest/v1/users/${DISCORD_ID}`,
    fetcher,
    { refreshInterval: 5000 }
  );
  const { playSong, currentTrack, isPlaying } = useMusicPlayer();

  const statusColor = useMemo(() => {
    switch (presence?.data?.discord_status) {
      case "online": return "bg-emerald-500";
      case "idle": return "bg-amber-400";
      case "dnd": return "bg-rose-500";
      default: return "bg-zinc-500";
    }
  }, [presence?.data?.discord_status]);

  const handlePlaySpotify = useCallback(async () => {
    const sp = presence?.data?.spotify;
    if (!sp) return;
    await playSong({
      title: sp.song,
      artist: sp.artist,
      album: sp.album,
      cover: sp.album_art_url,
    });
  }, [presence?.data?.spotify, playSong]);

  if (!presence?.success) {
    return (
      <div className="p-2">
        <Radio className="mb-2 h-4 w-4 text-[var(--text-secondary)] animate-pulse" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">Connecting…</p>
      </div>
    );
  }

  const isSpotify = !!(presence.data.listening_to_spotify && presence.data.spotify);
  const sp = presence.data.spotify;
  const isThisPlaying =
    isSpotify && isPlaying &&
    currentTrack?.title === sp?.song &&
    currentTrack?.artist === sp?.artist;

  return (
    <div
      className="p-2 transition-all duration-300 flex flex-col justify-center"
      style={{ background: "transparent" }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-2 w-2 rounded-full ${statusColor}`} />
        <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
          {isSpotify ? "Live on Spotify" : "Status"}
        </p>
      </div>

      {isSpotify ? (
        <div className="flex items-center gap-3 group min-w-0">
          <button
            onClick={handlePlaySpotify}
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border group/art"
            style={{ borderColor: "var(--card-border)" }}
            aria-label={`Play ${sp?.song}`}
          >
            <img
              src={sp?.album_art_url}
              alt="Album Art"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/art:scale-[1.06]"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/art:opacity-100 transition-opacity duration-200">
              {isThisPlaying ? (
                <Pause className="h-4 w-4 text-white fill-white" />
              ) : (
                <Play className="h-4 w-4 text-white fill-white" />
              )}
            </div>
          </button>
          <div className="min-w-0 flex-1">
            <button
              onClick={handlePlaySpotify}
              className="text-left w-full"
            >
              <p className="truncate text-sm font-bold text-[var(--text-primary)] hover:text-indigo-500 transition-colors">
                {sp?.song}
              </p>
            </button>
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <p className="truncate text-xs text-[var(--text-secondary)] max-w-[80%]">
                {sp?.artist}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {presence.data.discord_status === "offline" ? "Offline" : "Not listening right now"}
          </p>
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {presence.data.discord_status === "offline" ? "Last seen recently" : "Idling on Discord"}
          </p>
        </div>
      )}
    </div>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: "easeOut" }}
      className="flex flex-col justify-between py-3 px-1"
      style={{
        background: "transparent",
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
        {label}
      </p>
      <div>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-black tabular-nums tracking-tight text-[var(--text-primary)] sm:text-3xl"
        >
          {value}
        </motion.p>
        {detail && (
          <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)] font-medium opacity-80">
            {detail}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function DonutChart({
  data,
  label,
  emptyText,
  className = "",
}: {
  data: { name: string; plays: number; share: number }[];
  label: string;
  emptyText: string;
  className?: string;
}) {
  const slicedData = useMemo(() => data.slice(0, 6), [data]);

  const equalSaturationPalette = useMemo(() => [
    "#818CF8", 
    "#60A5FA", 
    "#22D3EE", 
    "#34D399", 
    "#C084FC", 
    "#FB7185" 
  ], []);

  const chartData = useMemo(() => ({
    labels: slicedData.map(d => d.name),
    datasets: [{
      data: slicedData.map(d => d.plays),
      backgroundColor: equalSaturationPalette,
      borderWidth: 0,
      hoverOffset: 6
    }]
  }), [slicedData, equalSaturationPalette]);

  const chartOptions = useMemo(() => ({
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: (context: any) => {
          const { chart, tooltip } = context;
          let tooltipEl = chart.canvas.parentNode.querySelector('.chartjs-custom-tooltip');

          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'chartjs-custom-tooltip';
            tooltipEl.style.background = 'color-mix(in srgb, var(--card-bg) 98%, var(--bg-primary))';
            tooltipEl.style.backdropFilter = 'blur(12px)';
            tooltipEl.style.border = '1px solid var(--card-border)';
            tooltipEl.style.borderRadius = '12px';
            tooltipEl.style.color = 'var(--text-primary)';
            tooltipEl.style.opacity = '1';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.transform = 'translate(-50%, -120%)';
            tooltipEl.style.transition = 'all .12s ease-out';
            tooltipEl.style.zIndex = '100';
            tooltipEl.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)';
            tooltipEl.style.padding = '8px 12px';
            tooltipEl.style.minWidth = '150px';
            tooltipEl.style.fontFamily = 'var(--font-sans), sans-serif';

            chart.canvas.parentNode.appendChild(tooltipEl);
          }

          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
          }

          if (tooltip.body) {
            let innerHtml = '';

            if (context.tooltip.dataPoints && context.tooltip.dataPoints.length) {
              const dataPoint = context.tooltip.dataPoints[0];
              const idx = dataPoint.dataIndex;
              const item = slicedData[idx];
              
              innerHtml += `<div style="font-family: var(--font-mono); font-size: 9px; text-transform: uppercase; tracking: 0.1em; color: var(--text-secondary); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;">${item.name}</div>`;
              const colorMarker = `<span style="background:${dataPoint.dataset.backgroundColor[idx]}; width:8px; height:8px; display:inline-block; border-radius:50%; margin-right:8px; flex-shrink:0;"></span>`;
              innerHtml += `<div style="display:flex; align-items:center; font-size:12px; font-weight:600; color:var(--text-primary); white-space:nowrap;">${colorMarker}${item.plays} plays (${item.share}%)</div>`;
            }

            tooltipEl.innerHTML = innerHtml;
          }

          const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
          tooltipEl.style.opacity = '1';
          tooltipEl.style.left = positionX + tooltip.caretX + 'px';
          tooltipEl.style.top = positionY + tooltip.caretY + 'px';
        }
      }
    },
    cutout: "75%",
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: 4
    }
  }), [slicedData]);

  const isArtist = label.toLowerCase().includes("artist");

  return (
    <ChartCard title={label} className={className}>
      {!data.length ? (
        <EmptyState message={emptyText} />
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4 min-w-0 w-full py-0.5 overflow-visible flex-1">
          <div className="flex flex-col items-center justify-center shrink-0 overflow-visible">
            <div className="h-20 w-20 relative flex items-center justify-center overflow-visible">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
            <div className="mt-1 text-center select-none pointer-events-none">
              <span className="font-display text-[10px] font-black tracking-wider text-[var(--text-primary)] uppercase">
                {isArtist ? "Artists" : "Albums"}
              </span>
              <span className="font-mono text-[9px] text-[var(--text-secondary)] block font-bold leading-none">
                100%
              </span>
            </div>
          </div>
          <div className="space-y-0.5 min-w-0 flex-1 w-full overflow-visible">
            {slicedData.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-0.5 text-xs min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: equalSaturationPalette[idx] }} />
                  <span className="truncate text-[var(--text-primary)] font-semibold dark:text-zinc-100">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono text-xs text-[var(--text-secondary)] shrink-0 font-bold dark:text-zinc-400">
                  {item.share}%
                </span>
              </div>
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
  className = "",
}: {
  data: { hour: number; plays: number }[];
  peakHour: number;
  quietHour: number;
  className?: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.plays), 1);

  // Document click-away capture hook to wipe sticky tooltips on background clicks
  useEffect(() => {
    if (!tooltip) return;
    const dismiss = () => {
      setTooltip(null);
      setHoveredHour(null);
    };
    document.addEventListener("pointerdown", dismiss, { capture: true });
    return () => document.removeEventListener("pointerdown", dismiss, { capture: true });
  }, [tooltip]);

  return (
    <ChartCard title="Listening clock" className={className}>
      <Tooltip tooltip={tooltip} />
      <div className="w-full flex flex-col h-full justify-between flex-1">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 mb-3 shrink-0">
          <h2 className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
            24-hour rhythm
          </h2>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] leading-normal text-left sm:text-right">
            <span className="text-indigo-500 dark:text-indigo-400 font-black">Peak {formatHour12(peakHour)}</span>
            <br className="hidden sm:inline" />
            <span className="inline sm:hidden text-[var(--card-border)] mx-1">·</span>
            <span>Quiet {formatHour12(quietHour)}</span>
          </p>
        </div>
        {!data.some((item) => item.plays) ? (
          <EmptyState message="No listening history for this period." />
        ) : (
          <div
            className="relative grid gap-[4px] px-1 rounded-xl flex-1 items-end mb-1 min-h-[140px]"
            style={{ 
              gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
              backgroundImage: "linear-gradient(to top, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "100% 20px"
            }}
          >
            {data.map((item) => {
              const isPeak = item.hour === peakHour;
              const isHovered = hoveredHour === item.hour;

              return (
                <button
                  key={item.hour}
                  type="button"
                  className="group relative flex h-full items-end justify-center rounded-sm select-none outline-none touch-none"
                  onPointerEnter={(event) => {
                    setHoveredHour(item.hour);
                    setTooltip({
                      title: formatHour12(item.hour),
                      lines: [
                        `${item.plays} plays`,
                        isPeak ? "Peak listening hour" : "Hourly activity",
                      ],
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                  onPointerMove={(event) => {
                    setHoveredHour(item.hour);
                    setTooltip({
                      title: formatHour12(item.hour),
                      lines: [
                        `${item.plays} plays`,
                        isPeak ? "Peak listening hour" : "Hourly activity",
                      ],
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                  onPointerDown={(event) => {
                    setHoveredHour(item.hour);
                    setTooltip({
                      title: formatHour12(item.hour),
                      lines: [
                        `${item.plays} plays`,
                        isPeak ? "Peak listening hour" : "Hourly activity",
                      ],
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                >
                  <motion.span
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(8, (item.plays / max) * 100)}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full rounded-t-[3px] transition-all duration-200"
                    style={{
                      background: isPeak
                        ? "linear-gradient(180deg, #8b5cf6, #6366f1)"
                        : isHovered
                        ? "linear-gradient(180deg, #a5b4fc, #6366f1)"
                        : "linear-gradient(180deg, rgba(99,102,241,0.35), rgba(99,102,241,0.7))",
                      boxShadow: isPeak ? "0 0 18px rgba(99,102,241,0.45)" : "none",
                      opacity: hoveredHour !== null && !isHovered ? 0.65 : 1,
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex justify-between font-mono text-[9px] text-[var(--text-secondary)] border-t pt-2 font-bold shrink-0 w-full" style={{ borderColor: "var(--card-border)" }}>
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11 PM</span>
        </div>
      </div>
    </ChartCard>
  );
}

function ListeningHistory({
  data,
  className = "",
}: {
  data: { label: string; plays: number }[];
  className?: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const max = Math.max(...data.map((x) => x.plays), 1);

  // Document click-away capture hook to wipe sticky tooltips on background clicks
  useEffect(() => {
    if (!tooltip) return;
    const dismiss = () => {
      setTooltip(null);
      setHoveredIdx(null);
    };
    document.addEventListener("pointerdown", dismiss, { capture: true });
    return () => document.removeEventListener("pointerdown", dismiss, { capture: true });
  }, [tooltip]);

  return (
    <ChartCard title="Listening timeline" className={className}>
      <Tooltip tooltip={tooltip} />
      {!data.length ? (
        <EmptyState message="No listening history for this period." />
      ) : (
        <div className="flex items-end gap-2 px-1 flex-1 w-full mt-auto min-h-[140px]">
          {data.map((d, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <button
                key={d.label}
                type="button"
                className="group flex h-full flex-1 flex-col items-center justify-end outline-none select-none touch-none"
                onPointerEnter={(event) => {
                  setHoveredIdx(idx);
                  setTooltip({
                    title: d.label,
                    lines: [`${d.plays} plays`],
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
                onPointerMove={(event) => {
                  setHoveredIdx(idx);
                  setTooltip({
                    title: d.label,
                    lines: [`${d.plays} plays`],
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
                onPointerDown={(event) => {
                  setHoveredIdx(idx);
                  setTooltip({
                    title: d.label,
                    lines: [`${d.plays} plays`],
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              >
                <motion.span
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(8, (d.plays / max) * 100)}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full rounded-t-xl transition-all duration-200"
                  style={{
                    background: isHovered 
                      ? "linear-gradient(180deg, #a5b4fc, #3b82f6)"
                      : `linear-gradient(180deg, rgba(59,130,246,0.35), rgba(59,130,246,0.75))`,
                    opacity: hoveredIdx !== null && !isHovered ? 0.65 : 1,
                  }}
                />
                <span className={`mt-2 font-mono text-[9px] transition-colors duration-200 shrink-0 ${isHovered ? "text-blue-500 font-bold" : "text-[var(--text-secondary)] font-medium"}`}>
                  {d.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

function WeeklyHeatmap({ data, className = "" }: { data: { day: string; plays: number }[]; className?: string }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const max = Math.max(...data.map((x) => x.plays), 1);
  
  const active = useMemo(() => data.reduce(
    (best, item) => (item.plays > best.plays ? item : best),
    data[0] ?? { day: "", plays: 0 }
  ), [data]);

  // Document click-away capture hook to wipe sticky tooltips on background clicks
  useEffect(() => {
    if (!tooltip) return;
    const dismiss = () => {
      setTooltip(null);
      setActiveIdx(null);
    };
    document.addEventListener("pointerdown", dismiss, { capture: true });
    return () => document.removeEventListener("pointerdown", dismiss, { capture: true });
  }, [tooltip]);

  const heatmapColors = useMemo(() => [
    "var(--bg-secondary)", 
    "#312e81", 
    "#4338ca", 
    "#6366f1", 
    "#818cf8"
  ], []);

  return (
    <ChartCard title="Weekly activity heatmap" className={className}>
      <Tooltip tooltip={tooltip} />
      {!data.some((d) => d.plays) ? (
        <EmptyState message="No weekly activity for this period." />
      ) : (
        <div className="flex justify-between items-center gap-2 pt-1 overflow-x-auto pb-1 hide-scrollbar w-full">
          {data.map((d, idx) => {
            const level = d.plays === 0 ? 0 : Math.min(4, Math.max(1, Math.floor((d.plays / max) * 4)));
            const isPeak = d.day === active.day && d.plays > 0;
            const isHovered = activeIdx === idx;

            return (
              <div key={d.day} className="flex flex-col items-center flex-1 min-w-[34px]">
                <button
                  type="button"
                  aria-label={`Activity level for ${d.day}`}
                  className="w-8 h-8 rounded-lg transition-all duration-300 outline-none select-none cursor-default touch-none"
                  style={{
                    background: heatmapColors[level],
                    border: isPeak ? "2px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                    boxShadow: isPeak ? "0 0 20px rgba(99,102,241,0.4)" : "none",
                    opacity: activeIdx !== null && !isHovered ? 0.65 : 1,
                  }}
                  onPointerEnter={(event) => {
                    setActiveIdx(idx);
                    setTooltip({
                      title: dayLabels[d.day] ?? d.day,
                      lines: [
                        `${d.plays} plays`,
                        isPeak ? "Highest activity day" : "Weekly metric"
                      ],
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                  onPointerMove={(event) => {
                    setActiveIdx(idx);
                    setTooltip({
                      title: dayLabels[d.day] ?? d.day,
                      lines: [
                        `${d.plays} plays`,
                        isPeak ? "Highest activity day" : "Weekly metric"
                      ],
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                  onPointerDown={(event) => {
                    setActiveIdx(idx);
                    setTooltip({
                      title: dayLabels[d.day] ?? d.day,
                      lines: [
                        `${d.plays} plays`,
                        isPeak ? "Highest activity day" : "Weekly metric"
                      ],
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                />
                <span className="mt-1 font-mono text-[9px] text-[var(--text-secondary)] font-bold">
                  {d.day}
                </span>
                <span className="font-display text-xs font-black text-[var(--text-primary)] mt-0.5">
                  {d.plays}
                </span>
              </div>
            );
          })}
        </div>
      )}
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
  const { setQueue, currentTrack, isPlaying, accentColor } = useMusicPlayer();

  useDragScroll(ref);

  const accent = accentColor.primary;
  const accentGlow = accentColor.glow;

  const scroll = (dir: number) =>
    ref.current?.scrollBy({
      left: dir * Math.min(460, ref.current.clientWidth * 0.85),
      behavior: "smooth",
    });

  const handlePlay = useCallback(
    (track: TrackMetadata, index: number) => {
      const queue: TrackMetadata[] = tracks.map((t) => ({
        title: t.title,
        artist: t.artist,
        cover: t.cover,
        songUrl: t.songUrl,
        playcount: t.playcount,
        rank: t.rank,
      }));
      setQueue(queue, index);
    },
    [tracks, setQueue]
  );

  return (
    <section className="overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Top Tracks
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            A live rotation of the tracks soundtracking my life right now. Click to play.
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            aria-label="Previous tracks"
            onClick={() => scroll(-1)}
            className="rounded-full border p-2 transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ borderColor: "var(--card-border)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Next tracks"
            onClick={() => scroll(1)}
            className="rounded-full border p-2 transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ borderColor: "var(--card-border)" }}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        tabIndex={0}
        className="music-carousel -mx-4 flex max-w-[100vw] snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 px-4 sm:-mx-6 sm:px-6 scroll-pl-4 sm:scroll-pl-6"
        style={{ scrollbarWidth: "none" }}
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-[72vw] max-w-[240px] shrink-0 snap-start rounded-2xl border p-3 sm:w-56"
              style={{ borderColor: "var(--card-border)" }}
            >
              <MusicTrackSkeleton index={i} />
            </div>
          ))
        ) : tracks.length ? (
          tracks.map((track, idx) => {
            const isThisPlaying =
              isPlaying &&
              currentTrack?.title === track.title &&
              currentTrack?.artist === track.artist;

            return (
              <button
                key={`${track.songUrl}-${track.rank}`}
                onClick={() =>
                  handlePlay(
                    {
                      title: track.title,
                      artist: track.artist,
                      cover: track.cover,
                      songUrl: track.songUrl,
                      playcount: track.playcount,
                      rank: track.rank,
                    },
                    idx
                  )
                }
                className="group w-[72vw] max-w-[240px] shrink-0 snap-start sm:w-56 text-left focus:outline-none"
                style={{
                  background: "transparent",
                }}
              >
                <div
                  className="relative aspect-square overflow-hidden rounded-xl border transition-all duration-500 ease-out group-hover:scale-[1.03]"
                  style={{
                    borderColor: isThisPlaying ? `${accent}80` : "var(--card-border)",
                    boxShadow: isThisPlaying
                      ? `0 12px 30px -5px ${accentGlow}, 0 8px 20px -8px ${accentGlow}`
                      : "var(--card-shadow)",
                  }}
                >
                  <MusicArtwork
                    src={track.cover}
                    alt={`${track.title} cover`}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isThisPlaying ? (
                      <Pause className="h-8 w-8 text-white fill-white drop-shadow-lg scale-105 transition-transform" />
                    ) : (
                      <Play className="h-8 w-8 text-white fill-white drop-shadow-lg hover:scale-105 transition-transform" />
                    )}
                  </div>
                </div>
                <p className="mt-2.5 font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] transition-opacity duration-300 group-hover:opacity-80">
                  #{track.rank} · {formatPlaycount(track.playcount)} plays
                </p>
                <h3
                  className="mt-0.5 truncate font-display text-base font-bold transition-colors duration-300"
                  style={{
                    color: isThisPlaying ? accent : "var(--text-primary)",
                    transition: "color 600ms ease",
                  }}
                >
                  {track.title}
                </h3>
                <p className="truncate text-xs text-[var(--text-secondary)] font-medium">
                  {track.artist}
                </p>
              </button>
            );
          })
        ) : (
          <div className="w-full">
            <EmptyState message="No tracks found for this period." />
          </div>
        )}
      </div>
    </section>
  );
}

export default function MusicPage() {
  const [period, setPeriod] = useState<MusicPeriod>(DEFAULT_MUSIC_PERIOD);
  const { tracks, isLoading: tracksLoading } = useTopTracks(period);
  const { data: stats, isValidating } = useSWR<MusicDashboardStats>(
    `/api/lastfm-stats?period=${period}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  
  const activePeriod = MUSIC_PERIODS.find((p) => p.value === period) ?? MUSIC_PERIODS[0];
  const isStatsLoading = !stats || isValidating;
  
  const statsCards = useMemo(
    () =>
      stats
        ? [
            ["Streams", formatPlaycount(stats.totals.streams), "Selected range"],
            ["Minutes", formatPlaycount(stats.totals.minutes), `${formatPlaycount(stats.totals.hours)} hours`],
            ["Tracks", formatPlaycount(stats.profile.trackCount), "Unique top tracks"],
            ["Albums", formatPlaycount(stats.profile.albumCount), `${formatPlaycount(stats.totals.averageAlbumPlays)} avg plays`],
            ["Artists", formatPlaycount(stats.profile.artistCount), `${formatPlaycount(stats.totals.averageArtistPlays)} avg plays`],
            ["Daily avg", formatPlaycount(stats.totals.averagePlaysPerDay), "Plays per day"],
            ["Streak", `${stats.insights.longestListeningStreak}d`, "Recent sample"],
            ["Track length", formatSeconds(stats.totals.averageTrackLength), "Estimated avg"],
            ["Growth", `+${formatPlaycount(stats.totals.weeklyGrowth)}`, activePeriod.description],
            ["Recent", `+${formatPlaycount(stats.totals.monthlyGrowth)}`, "From recent tracks"],
            ["Account age", `${formatPlaycount(stats.totals.accountAgeDays)}d`, stats.profile.registeredAt ? new Date(stats.profile.registeredAt).toLocaleDateString() : "Registered"],
            ["Active day", stats.insights.mostActiveListeningDay, stats.insights.favoriteListeningPeriod],
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
      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-36 sm:px-6 lg:px-8 lg:py-12">

        {/* ── Hero Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-8 border-b pb-8 relative"
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                03 — Music dashboard
              </p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                Last.fm replay
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
                <strong className="font-semibold text-[var(--text-primary)]">
                  My music history.
                </strong>{" "}
                Every scrobble tells a story — powered by Last.fm analytics.
              </p>
            </div>
            <div className="grid gap-3 sm:min-w-[340px] sm:grid-cols-2">
              <LivePresenceCard />
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.25 }}
                className="p-2 flex flex-col justify-center"
                style={{
                  background: "transparent",
                }}
              >
                <Sparkles className="mb-2 h-4 w-4 text-[var(--text-primary)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Favorite period
                </p>
                <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
                  {stats?.insights.favoriteListeningPeriod ?? "Analyzing…"}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ── Period filter + label ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="font-mono text-xs text-[var(--text-secondary)] font-bold">
            {activePeriod.description}
          </p>
          <MusicPeriodTabs active={period} onChange={setPeriod} />
        </motion.div>

        {/* ── Stats grid ── */}
        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
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
                  delay={i * 0.012}
                />
              ))}
        </div>

        {/* ── Top Tracks carousel ── */}
        <div className="mb-10">
          <TrackCarousel tracks={tracks} isLoading={tracksLoading} />
        </div>

        {/* ── Top Albums carousel ── */}
        <div className="mb-10">
          <AlbumCarousel
            albums={stats?.charts.topAlbums ?? []}
            isLoading={isStatsLoading && !stats}
          />
        </div>

        {/* ── Analytics charts ── */}
        {isStatsLoading && !stats ? (
          <div className="grid gap-4 lg:grid-cols-5 mb-16">
            <div className="space-y-4 lg:col-span-3">
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-56" />
            </div>
            <div className="space-y-4 lg:col-span-2">
              <SkeletonBlock className="h-44" />
              <SkeletonBlock className="h-44" />
              <SkeletonBlock className="h-56" />
            </div>
          </div>
        ) : (
          stats && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid gap-4 lg:grid-cols-5 mb-16 items-stretch"
            >
              {/* Left Column */}
              <div className="lg:col-span-3 flex flex-col gap-4 h-full">
                <ListeningClock
                  data={stats.charts.listeningClock}
                  peakHour={stats.insights.peakHour}
                  quietHour={stats.insights.quietHour}
                  className="flex-auto min-h-[250px]"
                />
                <ListeningHistory
                  data={stats.charts.listeningHistory}
                  className="flex-auto min-h-[210px]"
                />
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-visible">
                <DonutChart
                  label="Top artists share"
                  data={stats.charts.topArtists}
                  emptyText="No artists available for this period."
                  className="flex-auto min-h-[180px]"
                />
                <DonutChart
                  label="Top albums share"
                  data={stats.charts.topAlbums}
                  emptyText="No albums available for this period."
                  className="flex-auto min-h-[180px]"
                />
                <WeeklyHeatmap
                  data={stats.charts.weeklyActivity}
                  className="flex-initial min-h-[130px]"
                />
              </div>
            </motion.div>
          )
        )}

        <PageFooter />
      </main>
    </>
  );
}
