import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useMemo, useState, type PointerEvent } from "react";
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

type Slide = {
  key: string;
  icon: JSX.Element;
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: string;
  image: string | null;
  href?: string;
  accent: string;
  surface: string;
};

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ isPlaying: false });
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [pointerStartX, setPointerStartX] = useState<number | null>(null);

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

  const slides = useMemo<Slide[]>(() => {
    return [
      {
        key: 'discord',
        icon: <FiActivity className="h-3.5 w-3.5 text-indigo-300" />,
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
        accent: 'border-l-indigo-400/60',
        surface: 'bg-indigo-400/12'
      },
      {
        key: 'spotify',
        icon: <FiMusic className="h-3.5 w-3.5 text-emerald-300" />,
        eyebrow: 'Now Playing',
        title: nowPlaying.isPlaying ? nowPlaying.title || 'Unknown track' : 'Nothing playing',
        subtitle: nowPlaying.isPlaying
          ? nowPlaying.artist || 'Unknown artist'
          : 'Spotify is currently idle',
        meta: nowPlaying.isPlaying ? nowPlaying.album || 'Unknown album' : 'Check back in a bit',
        image: nowPlaying.isPlaying ? nowPlaying.albumImageUrl || null : null,
        href: nowPlaying.isPlaying ? nowPlaying.songUrl : undefined,
        accent: 'border-l-emerald-400/60',
        surface: 'bg-emerald-400/12'
      }
    ];
  }, [status, nowPlaying]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setPointerStartX(event.clientX);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartX === null) return;
    const deltaX = event.clientX - pointerStartX;

    if (deltaX > 40) {
      setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
    } else if (deltaX < -40) {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }

    setPointerStartX(null);
  };

  if (loading) return null;

  return (
    <div className="w-full">
      <div
        className="relative mx-auto w-full max-w-4xl select-none overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/90 shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide) => {
            const content = (
              <div className={`relative min-w-full select-none border-l-2 ${slide.accent} ${slide.surface} p-2.5 sm:p-3`}>

                <div className="relative flex items-start gap-2">
                  {slide.image ? (
                    <Image
                      src={slide.image}
                      width={72}
                      height={72}
                      alt={slide.title}
                      className="h-14 w-14 rounded-md border border-zinc-700/50 object-cover sm:h-16 sm:w-16"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-800 sm:h-16 sm:w-16">
                      <FiDisc className="h-7 w-7 text-zinc-500" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      {slide.icon}
                      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                        {slide.eyebrow}
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold text-white sm:text-base">{slide.title}</p>
                    <p className="truncate text-xs text-zinc-300 sm:text-sm">{slide.subtitle}</p>
                    <p className="truncate pt-0.5 text-[11px] text-zinc-500 sm:text-xs">{slide.meta}</p>
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

        <div className="relative z-10 border-t border-zinc-800/70 bg-zinc-900/90 px-3 py-0.5 sm:px-4">
          <div className="flex items-center justify-between text-[9px] text-zinc-500">
            <span className="select-none text-zinc-500">Swipe / drag to change</span>
            <div className="flex items-center gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  onClick={() => setActiveSlide(index)}
                  className={`h-1 rounded-full transition-all ${
                    activeSlide === index ? 'w-3.5 bg-zinc-400' : 'w-1 bg-zinc-600'
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
