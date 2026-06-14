import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FiActivity, FiDisc, FiMusic } from "react-icons/fi";

type StatusData = {
  activity?: {
    name: string;
    details?: string;
    state?: string;
    image?: string | null;
  } | null;
  activeDevice?: string | null;
};

type NowPlaying = {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
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
  isPlaying?: boolean;
  progressMs?: number;
  durationMs?: number;
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
          Array(barCount)
            .fill(0)
            .map(() => Math.random() * 70 + 30)
        );
      }, 150);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setBarHeights(Array(barCount).fill(30));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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

const TiltCard = ({ slide }: { slide: Slide }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -8,
      y: (x / (rect.width / 2)) * 8,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const handleClick = useCallback(() => {
    if (slide.href) {
      window.open(slide.href, '_blank', 'noopener,noreferrer');
    }
  }, [slide.href]);

  return (
    <motion.div
      className="flex-1 min-w-0 rounded-xl border overflow-hidden transition-shadow duration-300"
      style={{
        borderColor: 'var(--card-border)',
        background: 'var(--card-bg)',
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hovered ? 'none' : 'transform 0.4s ease-out, box-shadow 0.3s ease',
        boxShadow: hovered
          ? `0 8px 30px color-mix(in srgb, var(--accent) 12%, transparent)`
          : 'none',
        cursor: slide.href ? 'pointer' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileTap={slide.href ? { scale: 0.98 } : undefined}
    >
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Image/Icon container - smaller */}
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

          {/* Text content */}
          <div className="min-w-0 flex-1 select-none">
            {/* Eyebrow with visualizer */}
            <div className="flex items-center gap-1 h-3.5">
              <span className={`${slide.accentColor} flex-shrink-0`}>{slide.icon}</span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                {slide.eyebrow}
              </span>
              <Visualizer isPlaying={slide.key === 'spotify' && !!slide.isPlaying} />
            </div>

            {/* Title */}
            <p className="truncate text-xs font-medium text-[var(--text-primary)] leading-tight mt-0.5">
              {slide.title}
            </p>

            {/* Subtitle with or without progress bar */}
            {slide.key === 'spotify' && slide.isPlaying && slide.durationMs ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="truncate text-[10px] text-[var(--text-secondary)] flex-shrink-0 max-w-[28%]">
                  {slide.subtitle}
                </span>
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <div className="relative h-[3px] flex-1 rounded-full overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 10%, transparent)' }}>
                    <motion.div
                      className="h-full rounded-full progress-active"
                      style={{ backgroundColor: 'var(--accent)', width: `${Math.min(((slide.progressMs || 0) / slide.durationMs) * 100, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-[8px] text-[var(--text-secondary)] tabular-nums flex-shrink-0">
                    {formatTime(slide.progressMs || 0)}/{formatTime(slide.durationMs)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="truncate text-[10px] text-[var(--text-secondary)] mt-0.5">
                {slide.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ isPlaying: false });
  const [loading, setLoading] = useState(true);
  const [songProgress, setSongProgress] = useState(0);
  const songProgressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statusRes, nowRes] = await Promise.all([
          fetch('/api/discord-status'),
          fetch('/api/now-playing')
        ]);

        const statusData = await statusRes.json();
        const nowData = await nowRes.json();

        setStatus(statusData);
        setNowPlaying(nowData);
        if (nowData.progressMs !== undefined) {
          setSongProgress(nowData.progressMs);
        }
      } catch (error) {
        console.error('Failed to fetch activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    const poll = setInterval(fetchAll, 10000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (nowPlaying.isPlaying && nowPlaying.durationMs) {
      songProgressRef.current = setInterval(() => {
        setSongProgress((prev) => {
          if (prev >= nowPlaying.durationMs!) {
            return prev;
          }
          return prev + 1000;
        });
      }, 1000);
    } else {
      if (songProgressRef.current) {
        clearInterval(songProgressRef.current);
      }
    }

    return () => {
      if (songProgressRef.current) {
        clearInterval(songProgressRef.current);
      }
    };
  }, [nowPlaying.isPlaying, nowPlaying.durationMs]);

  const slides = useMemo<Slide[]>(() => {
    return [
      {
        key: 'discord',
        icon: <FiActivity className="h-3 w-3" />,
        eyebrow: 'Discord Activity',
        title: status?.activity?.name || 'Not Active',
        subtitle: status?.activity?.details || 'Not doing anything right now',
        meta:
          status?.activity?.name === 'YouTube' && status?.activity?.state
            ? status.activity.state
            : status?.activeDevice
              ? `Active on ${status.activeDevice}`
              : 'Currently idle',
        image: status?.activity?.image || null,
        accentColor: 'text-indigo-400',
        isPlaying: false,
      },
      {
        key: 'spotify',
        icon: <FiMusic className="h-3 w-3" />,
        eyebrow: 'Now Playing',
        title: nowPlaying.isPlaying ? nowPlaying.title || 'Unknown track' : 'Nothing playing',
        subtitle: nowPlaying.isPlaying
          ? nowPlaying.artist || 'Unknown artist'
          : 'Spotify is currently idle',
        meta: nowPlaying.isPlaying ? nowPlaying.album || 'Unknown album' : 'Check back in a bit',
        image: nowPlaying.isPlaying ? nowPlaying.albumImageUrl || null : null,
        href: nowPlaying.isPlaying ? nowPlaying.songUrl : undefined,
        accentColor: 'text-emerald-400',
        isPlaying: nowPlaying.isPlaying,
        progressMs: songProgress,
        durationMs: nowPlaying.durationMs,
      }
    ];
  }, [status, nowPlaying, songProgress]);

  if (loading) return null;

  return (
    <div className="w-full flex flex-col sm:flex-row gap-3" style={{ perspective: '1000px' }}>
      {slides.map((slide) => (
        <TiltCard key={slide.key} slide={slide} />
      ))}
    </div>
  );
};

export default DiscordStatus;