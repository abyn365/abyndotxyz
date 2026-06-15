import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiActivity, FiDisc, FiExternalLink, FiMusic } from "react-icons/fi";

type StatusData = {
  activity?: {
    name: string;
    details?: string;
    state?: string;
    image?: string | null;
  } | null;
  activeDevice?: string | null;
  spotify?: {
    album: string;
    albumArtUrl: string;
    artist: string;
    song: string;
    trackId?: string | null;
    songUrl?: string | null;
    spotifyUrl?: string | null;
    timestamps?: {
      start: number;
      end?: number;
    } | null;
  } | null;
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const buildSpotifyTrackUrl = (trackId?: string | null) => {
  if (!trackId) return null;
  return `https://open.spotify.com/track/${trackId}`;
};

const Visualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const [barHeights, setBarHeights] = useState<number[]>([38, 64, 48]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setBarHeights([0, 0, 0].map(() => Math.random() * 68 + 24));
      }, 160);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBarHeights([38, 64, 48]);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {barHeights.map((height, index) => (
        <motion.span
          key={index}
          className={`w-[2px] rounded-full ${isPlaying ? "bg-emerald-400" : "bg-[var(--card-border)]"}`}
          animate={{ height: `${height}%` }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const safeTotal = Math.max(total, 1);
  const percent = Math.min(Math.max((current / safeTotal) * 100, 0), 100);

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

const ActionChip = ({
  icon,
  children,
  href,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  href?: string | null;
}) => {
  const classes =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} style={{ borderColor: "var(--card-border)" }}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <span className={classes} style={{ borderColor: "var(--card-border)" }}>
      {icon}
      {children}
    </span>
  );
};

const ActivityPanel = ({
  activity,
  activeDevice,
}: {
  activity: NonNullable<StatusData["activity"]>;
  activeDevice: string | null | undefined;
}) => {
  const title = activity.name || "Not Active";
  const subtitle = activity.details || "Not doing anything right now";
  const meta =
    activity.name === "YouTube" && activity.state
      ? activity.state
      : activeDevice
        ? `Active on ${activeDevice}`
        : "Currently idle";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border px-3 py-3 sm:px-4 sm:py-3.5"
      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.06),transparent_32%)]" />
      <div className="relative grid items-center gap-3 [grid-template-columns:auto_minmax(0,1fr)]">
        <div className="relative shrink-0">
          {activity.image ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[var(--card-border)] shadow-md sm:h-[4.5rem] sm:w-[4.5rem]">
              <Image
                src={activity.image}
                fill
                sizes="72px"
                alt={title}
                className="object-cover"
                unoptimized
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)] shadow-md sm:h-[4.5rem] sm:w-[4.5rem]">
              <FiDisc className="h-7 w-7 text-indigo-400" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <ActionChip
              icon={<FiActivity className="h-3 w-3 text-indigo-400" />}
            >
              Discord activity
            </ActionChip>
            {activeDevice ? <ActionChip icon={null}>{activeDevice}</ActionChip> : null}
          </div>

          <div className="mt-2 min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-5 tracking-tight text-[var(--text-primary)] sm:text-base">
              {title}
            </h3>
            <p className="mt-0.5 truncate text-[12px] leading-5 text-[var(--text-secondary)] sm:text-[13px]">
              {subtitle}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[var(--text-secondary)]">
            <span className="truncate">{meta}</span>
            <span className="shrink-0 rounded-full border px-2 py-0.5" style={{ borderColor: "var(--card-border)" }}>
              Live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpotifyPanel = ({
  spotify,
  songProgress,
}: {
  spotify: NonNullable<StatusData["spotify"]>;
  songProgress: number;
}) => {
  const spotifyUrl = spotify.spotifyUrl || spotify.songUrl || buildSpotifyTrackUrl(spotify.trackId);
  const progressText = useMemo(() => {
    if (!spotify.timestamps?.start) return "";
    const elapsed = Math.max(songProgress, 0);
    const total = spotify.timestamps.end ? Math.max(spotify.timestamps.end - spotify.timestamps.start, 0) : 0;
    return total ? `${formatTime(elapsed)} / ${formatTime(total)}` : formatTime(elapsed);
  }, [songProgress, spotify.timestamps]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border px-3 py-3 sm:px-4 sm:py-3.5"
      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_34%)]" />
      <div className="relative grid items-center gap-3 [grid-template-columns:auto_minmax(0,1fr)]">
        <div className="relative shrink-0">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[var(--card-border)] shadow-md sm:h-[4.5rem] sm:w-[4.5rem]">
            {spotify.albumArtUrl ? (
              <Image
                src={spotify.albumArtUrl}
                fill
                sizes="72px"
                alt={spotify.song}
                className="object-cover"
                unoptimized
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]">
                <FiMusic className="h-7 w-7 text-emerald-400" />
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <ActionChip icon={<FiMusic className="h-3 w-3 text-emerald-400" />}>Spotify</ActionChip>
            {spotifyUrl ? (
              <ActionChip icon={<FiExternalLink className="h-3 w-3" />} href={spotifyUrl}>
                Open track
              </ActionChip>
            ) : null}
          </div>

          <div className="mt-2 min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-5 tracking-tight text-[var(--text-primary)] sm:text-base">
              {spotify.song || "Unknown track"}
            </h3>
            <p className="mt-0.5 truncate text-[12px] leading-5 text-[var(--text-secondary)] sm:text-[13px]">
              {spotify.artist || "Unknown artist"} · {spotify.album || "Listening now"}
            </p>
          </div>

          <div className="mt-2 space-y-1.5">
            <ProgressBar
              current={Math.max(songProgress, 0)}
              total={
                spotify.timestamps?.end && spotify.timestamps.start
                  ? Math.max(spotify.timestamps.end - spotify.timestamps.start, 1)
                  : 1000
              }
            />
            <div className="flex items-center justify-between gap-3 text-[10px] text-[var(--text-secondary)]">
              <Visualizer isPlaying={true} />
              <span className="shrink-0 tabular-nums">{progressText || "Playing now"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [songProgress, setSongProgress] = useState(0);
  const songProgressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const statusRes = await fetch("/api/discord-status");
        const statusData = await statusRes.json();
        setStatus(statusData);
        if (statusData.spotify?.timestamps?.start) {
          setSongProgress(Math.max(Date.now() - statusData.spotify.timestamps.start, 0));
        } else {
          setSongProgress(0);
        }
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const poll = setInterval(fetchStatus, 10000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (songProgressRef.current) {
      clearInterval(songProgressRef.current);
      songProgressRef.current = null;
    }

    if (status?.spotify?.timestamps?.start) {
      songProgressRef.current = setInterval(() => {
        setSongProgress((prev) => prev + 1000);
      }, 1000);
    }

    return () => {
      if (songProgressRef.current) {
        clearInterval(songProgressRef.current);
      }
    };
  }, [status?.spotify?.timestamps?.start]);

  if (loading) return null;

  const hasActivity = Boolean(status?.activity);
  const hasSpotify = Boolean(status?.spotify);

  return (
    <div className="w-full" style={{ perspective: "1000px" }}>
      <motion.div
        className={hasActivity && hasSpotify ? "grid gap-2 md:grid-cols-2" : "grid gap-2"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {hasActivity ? <ActivityPanel activity={status!.activity!} activeDevice={status?.activeDevice} /> : null}

        {hasSpotify ? <SpotifyPanel spotify={status!.spotify!} songProgress={songProgress} /> : null}

        {!hasActivity && !hasSpotify ? (
          <div
            className="rounded-2xl border px-3 py-3 sm:px-4 sm:py-3.5"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
          >
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <FiActivity className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium">Discord activity</span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Not doing anything right now.</p>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default DiscordStatus;
