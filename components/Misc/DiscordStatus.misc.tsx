import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
};

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ isPlaying: false });
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 2);
    }, 5500);

    return () => clearInterval(timer);
  }, [isHovered]);

  const slides = useMemo(() => {
    return [
      {
        key: 'discord',
        icon: <FiActivity className="h-3.5 w-3.5 text-indigo-400" />,
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
        accent: 'from-indigo-500/40 via-indigo-500/15 to-transparent',
        surface: 'from-indigo-500/15 via-zinc-900/70 to-zinc-900/80'
      },
      {
        key: 'spotify',
        icon: <FiMusic className="h-3.5 w-3.5 text-[#1DB954]" />,
        eyebrow: 'Now Playing',
        title: nowPlaying.isPlaying ? nowPlaying.title || 'Unknown track' : 'Nothing playing',
        subtitle: nowPlaying.isPlaying
          ? nowPlaying.artist || 'Unknown artist'
          : 'Spotify is currently idle',
        meta: nowPlaying.isPlaying ? nowPlaying.album || 'Unknown album' : 'Check back in a bit',
        image: nowPlaying.isPlaying ? nowPlaying.albumImageUrl || null : null,
        href: nowPlaying.isPlaying ? nowPlaying.songUrl : undefined,
        accent: 'from-emerald-500/45 via-emerald-500/20 to-transparent',
        surface: 'from-emerald-500/15 via-zinc-900/70 to-zinc-900/80'
      }
    ];
  }, [status, nowPlaying]);

  if (loading) return null;

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-900/75 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-700/20 via-transparent to-zinc-700/20" />

        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide) => {
            const content = (
              <div className={`relative min-w-full bg-gradient-to-br ${slide.surface} p-4 sm:p-5 md:p-6`}>
                <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-r ${slide.accent}`} />
                <div className="relative flex items-start gap-3 md:gap-4">
                  {slide.image ? (
                    <Image
                      src={slide.image}
                      width={72}
                      height={72}
                      alt={slide.title}
                      className="h-12 w-12 rounded-lg border border-zinc-700/60 object-cover sm:h-14 sm:w-14 md:h-[72px] md:w-[72px]"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800 sm:h-14 sm:w-14 md:h-[72px] md:w-[72px]">
                      <FiDisc className="h-6 w-6 text-zinc-500" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      {slide.icon}
                      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                        {slide.eyebrow}
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold text-white sm:text-base md:text-lg">{slide.title}</p>
                    <p className="truncate text-xs text-zinc-300 sm:text-sm">{slide.subtitle}</p>
                    <p className="truncate pt-1 text-[11px] text-zinc-500 sm:text-xs">{slide.meta}</p>
                  </div>
                </div>
              </div>
            );

            if (slide.href) {
              return (
                <a
                  key={slide.key}
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-full transition-opacity hover:opacity-95"
                >
                  {content}
                </a>
              );
            }

            return (
              <div key={slide.key} className="min-w-full">
                {content}
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-800/80 px-4 py-2 sm:px-5">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Auto swap every 5.5s</span>
            <div className="flex items-center gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  onClick={() => setActiveSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeSlide === index ? 'w-5 bg-[#ff6347]' : 'w-1.5 bg-zinc-600'
                  }`}
                  aria-label={`Go to ${slide.eyebrow}`}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscordStatus;
