import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
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

type Slide = {
  key: string;
  icon: JSX.Element;
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: string;
  image: string | null;
  href?: string;
  accentColor: string;
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const Visualizer = ({ isPlaying, barCount = 4, className = '' }: { isPlaying: boolean; barCount?: number; className?: string }) => {
  const [barHeights, setBarHeights] = useState<number[]>(Array(barCount).fill(30));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setBarHeights(
          Array(barCount).fill(0).map(() => Math.random() * 70 + 30)
        );
      }, 150);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBarHeights(Array(barCount).fill(30));
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, barCount]);

  return (
    <div className={`flex items-end h-3 gap-[1px] ${className}`}>
      {barHeights.map((height, index) => (
        <motion.div
          key={index}
          className={`w-[2px] rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-transparent'}`}
          animate={{ height: `${height}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

const ActivityCard = ({ slide, spotify, songProgress }: { slide: Slide; spotify?: StatusData['spotify'] | null; songProgress: number }) => {
  const handleClick = () => {
    if (slide.href) {
      window.open(slide.href, '_blank', 'noopener,noreferrer');
    }
  };
  const spotifyProgress = useMemo(() => {
    if (!spotify?.timestamps?.start) return '';
    const elapsed = Math.max(songProgress, 0);
    const total = spotify.timestamps.end ? Math.max(spotify.timestamps.end - spotify.timestamps.start, 0) : 0;
    return total ? `${formatTime(elapsed)} / ${formatTime(total)}` : formatTime(elapsed);
  }, [spotify, songProgress]);

  return (
    <motion.div
      className={`rounded-xl border overflow-hidden transition-shadow duration-300 ${slide.href ? 'cursor-pointer' : ''}`}
      style={{
        borderColor: 'var(--card-border)',
        background: 'var(--card-bg)',
        boxShadow: 'var(--card-shadow)',
      }}
      onClick={slide.href ? handleClick : undefined}
      whileTap={slide.href ? { scale: 0.98 } : undefined}
    >
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="relative flex-shrink-0">
            {slide.image ? (
              <Image
                src={slide.image}
                width={36}
                height={36}
                alt={slide.title}
                className="h-9 w-9 rounded-lg border border-[var(--card-border)] object-cover"
                unoptimized
                draggable={false}
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border"
                style={{
                  background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <FiDisc className={`h-4 w-4 ${slide.accentColor}`} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 select-none">
            <div className="flex items-center gap-1 h-3.5">
              <span className={`${slide.accentColor} flex-shrink-0`}>{slide.icon}</span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                {slide.eyebrow}
              </span>
              <Visualizer isPlaying={Boolean(spotify) || slide.key === 'spotify'} />
            </div>

            <p className="truncate text-xs font-medium text-[var(--text-primary)] leading-tight mt-0.5">
              {slide.title}
            </p>

            <p className="truncate text-[10px] text-[var(--text-secondary)] mt-0.5">
              {slide.subtitle}
            </p>
          </div>
        </div>

        <p className="mt-1.5 truncate text-[10px] text-[var(--text-secondary)]">
          {slide.meta}
        </p>

        {spotify ? (
          <div className="mt-3 rounded-lg border p-2.5" style={{ borderColor: 'color-mix(in srgb, var(--card-border) 70%, transparent)' }}>
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-[var(--card-border)]">
                {spotify.albumArtUrl ? (
                  <Image
                    src={spotify.albumArtUrl}
                    alt={spotify.song}
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)' }}>
                    <FiMusic className="h-4 w-4 text-emerald-400" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <FiMusic className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                  <p className="truncate text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Spotify</p>
                </div>
                <p className="truncate text-xs font-medium text-[var(--text-primary)]">{spotify.song}</p>
                <p className="truncate text-[10px] text-[var(--text-secondary)]">{spotify.artist}</p>
              </div>

              {spotify.songUrl ? (
                <a
                  href={spotify.songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  Open <FiExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate text-[10px] text-[var(--text-secondary)]">
                {spotify.album}
              </p>
              <p className="shrink-0 text-[10px] text-[var(--text-secondary)] tabular-nums">
                {spotifyProgress}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
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

  const mainSlide = useMemo<Slide>(() => {
    if (status?.activity) {
      return {
        key: 'discord',
        icon: <FiActivity className="h-3 w-3" />,
        eyebrow: 'Discord Activity',
        title: status.activity.name || 'Not Active',
        subtitle: status.activity.details || 'Not doing anything right now',
        meta:
          status.activity.name === 'YouTube' && status.activity.state
            ? status.activity.state
            : status?.activeDevice
              ? `Active on ${status.activeDevice}`
              : 'Currently idle',
        image: status.activity.image || null,
        accentColor: 'text-indigo-400',
      };
    }

    if (status?.spotify) {
      const progressText = status.spotify.timestamps?.start
        ? (() => {
            const elapsed = Math.max(songProgress, 0);
            const total = status.spotify?.timestamps?.end
              ? Math.max(status.spotify.timestamps.end - status.spotify.timestamps.start, 0)
              : 0;
            return total ? `${formatTime(elapsed)} / ${formatTime(total)}` : formatTime(elapsed);
          })()
        : '';

      return {
        key: 'spotify',
        icon: <FiMusic className="h-3 w-3" />,
        eyebrow: 'Spotify',
        title: status.spotify.song || 'Unknown track',
        subtitle: status.spotify.artist || 'Unknown artist',
        meta: [status.spotify.album, progressText].filter(Boolean).join(' • ') || 'Listening now',
        image: status.spotify.albumArtUrl || null,
        href: status.spotify.songUrl || (status.spotify.trackId ? `https://open.spotify.com/track/${status.spotify.trackId}` : undefined),
        accentColor: 'text-emerald-400',
      };
    }

    return {
      key: 'discord',
      icon: <FiActivity className="h-3 w-3" />,
      eyebrow: 'Discord Activity',
      title: 'Not Active',
      subtitle: 'Not doing anything right now',
      meta: status?.activeDevice ? `Active on ${status.activeDevice}` : 'Currently idle',
      image: null,
      accentColor: 'text-indigo-400',
    };
  }, [status, songProgress]);

  const spotify = status?.activity ? status?.spotify || null : null;

  if (loading) return null;

  return (
    <div className="w-full" style={{ perspective: '1000px' }}>
      <ActivityCard slide={mainSlide} spotify={spotify} songProgress={songProgress} />
    </div>
  );
};

export default DiscordStatus;
