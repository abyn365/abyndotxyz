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
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const buildSpotifyTrackUrl = (trackId?: string | null) => {
  if (!trackId) return null;
  return `https://open.spotify.com/track/${trackId}`;
};

const Visualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const [barHeights, setBarHeights] = useState<number[]>([38, 64, 48, 72, 54]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setBarHeights([0, 0, 0, 0, 0].map(() => Math.random() * 70 + 30));
      }, 140);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBarHeights([38, 64, 48, 72, 54]);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex h-4 items-end gap-[2px]" aria-hidden="true">
      {barHeights.map((height, index) => (
        <motion.span
          key={index}
          className={`w-[2px] rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-[var(--card-border)]'}`}
          animate={{ height: `${height}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const safeTotal = Math.max(total, 1);
  const percent = Math.min(Math.max((current / safeTotal) * 100, 0), 100);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

const ActivityPanel = ({
  activity,
  activeDevice,
}: {
  activity: NonNullable<StatusData['activity']>;
  activeDevice: string | null | undefined;
}) => {
  const title = activity.name || 'Not Active';
  const subtitle = activity.details || 'Not doing anything right now';
  const meta = activity.name === 'YouTube' && activity.state
    ? activity.state
    : activeDevice
      ? `Active on ${activeDevice}`
      : 'Currently idle';

  return (
    <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_30%)]" />
      <div className="relative flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="absolute -inset-2 rounded-[1.15rem] bg-[color-mix(in_srgb,var(--text-primary)_7%,transparent)] blur-md" />
          {activity.image ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-[1.15rem] border border-[var(--card-border)] shadow-lg sm:h-28 sm:w-28">
              <Image
                src={activity.image}
                fill
                sizes="(max-width: 640px) 96px, 112px"
                alt={title}
                className="object-cover"
                unoptimized
                draggable={false}
              />
            </div>
          ) : (
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.15rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)] shadow-lg sm:h-28 sm:w-28">
              <FiDisc className="h-10 w-10 text-indigo-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]" style={{ borderColor: 'var(--card-border)', background: 'color-mix(in srgb, var(--text-primary) 4%, transparent)' }}>
              <FiActivity className="h-3 w-3 text-indigo-400" />
              Discord activity
            </span>
            {activeDevice ? (
              <span className="rounded-full border px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]" style={{ borderColor: 'var(--card-border)' }}>
                {activeDevice}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 truncate text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
            {subtitle}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)]">
            <span className="rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--card-border)' }}>
              {meta}
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
  spotify: NonNullable<StatusData['spotify']>;
  songProgress: number;
}) => {
  const spotifyUrl = spotify.songUrl || buildSpotifyTrackUrl(spotify.trackId);
  const progressText = useMemo(() => {
    if (!spotify.timestamps?.start) return '';
    const elapsed = Math.max(songProgress, 0);
    const total = spotify.timestamps.end ? Math.max(spotify.timestamps.end - spotify.timestamps.start, 0) : 0;
    return total ? `${formatTime(elapsed)} / ${formatTime(total)}` : formatTime(elapsed);
  }, [songProgress, spotify.timestamps]);

  return (
    <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_34%)]" />
      <div className="relative flex flex-col gap-4 sm:flex-row">
        <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-[1.15rem] border border-[var(--card-border)] shadow-lg sm:mx-0 sm:h-28 sm:w-28">
          {spotify.albumArtUrl ? (
            <Image
              src={spotify.albumArtUrl}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              alt={spotify.song}
              className="object-cover"
              unoptimized
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]">
              <FiMusic className="h-10 w-10 text-emerald-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]" style={{ borderColor: 'var(--card-border)', background: 'color-mix(in srgb, var(--text-primary) 4%, transparent)' }}>
              <FiMusic className="h-3 w-3 text-emerald-400" />
              Spotify
            </span>
            {spotify.trackId ? (
              <span className="rounded-full border px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)]" style={{ borderColor: 'var(--card-border)' }}>
                {spotify.trackId}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 truncate text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            {spotify.song || 'Unknown track'}
          </h3>
          <p className="mt-1 truncate text-sm text-[var(--text-secondary)] sm:text-[15px]">
            {spotify.artist || 'Unknown artist'}
          </p>
          <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {spotify.album || 'Listening now'}
          </p>

          <div className="mt-4 space-y-2">
            <ProgressBar
              current={Math.max(songProgress, 0)}
              total={spotify.timestamps?.end && spotify.timestamps.start
                ? Math.max(spotify.timestamps.end - spotify.timestamps.start, 1)
                : 1000}
            />
            <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--text-secondary)]">
              <Visualizer isPlaying={true} />
              <span className="shrink-0 tabular-nums">{progressText || 'Playing now'}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {spotifyUrl ? (
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
                style={{ borderColor: 'var(--card-border)' }}
              >
                Open track
                <FiExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
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
        const statusRes = await fetch('/api/discord-status');
        const statusData = await statusRes.json();
        setStatus(statusData);
        if (statusData.spotify?.timestamps?.start) {
          setSongProgress(Math.max(Date.now() - statusData.spotify.timestamps.start, 0));
        } else {
          setSongProgress(0);
        }
      } catch (error) {
        console.error('Failed to fetch activity data:', error);
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
    <div className="w-full" style={{ perspective: '1000px' }}>
      <motion.div
        className={hasActivity && hasSpotify ? 'grid gap-3 lg:grid-cols-2' : 'grid gap-3'}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {hasActivity ? (
          <ActivityPanel activity={status!.activity!} activeDevice={status?.activeDevice} />
        ) : null}

        {hasSpotify ? (
          <SpotifyPanel spotify={status!.spotify!} songProgress={songProgress} />
        ) : null}

        {!hasActivity && !hasSpotify ? (
          <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <FiActivity className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium">Discord activity</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Not doing anything right now.</p>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default DiscordStatus;
