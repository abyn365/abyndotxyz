import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiActivity, FiDisc, FiMusic, FiChevronLeft, FiChevronRight } from "react-icons/fi";

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
  accentColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
};

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ isPlaying: false });
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

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

  const slides = useMemo<Slide[]>(() => {
    return [
      {
        key: 'discord',
        icon: <FiActivity className="h-4 w-4" />,
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
        bgColor: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
        borderColor: 'border-indigo-500/30',
        glowColor: 'shadow-indigo-500/10'
      },
      {
        key: 'spotify',
        icon: <FiMusic className="h-4 w-4" />,
        eyebrow: 'Now Playing',
        title: nowPlaying.isPlaying ? nowPlaying.title || 'Unknown track' : 'Nothing playing',
        subtitle: nowPlaying.isPlaying
          ? nowPlaying.artist || 'Unknown artist'
          : 'Spotify is currently idle',
        meta: nowPlaying.isPlaying ? nowPlaying.album || 'Unknown album' : 'Check back in a bit',
        image: nowPlaying.isPlaying ? nowPlaying.albumImageUrl || null : null,
        href: nowPlaying.isPlaying ? nowPlaying.songUrl : undefined,
        accentColor: 'text-emerald-400',
        bgColor: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        borderColor: 'border-emerald-500/30',
        glowColor: 'shadow-emerald-500/10'
      }
    ];
  }, [status, nowPlaying]);

  const AUTOPLAY_INTERVAL = 5000;

  useEffect(() => {
    if (isHovered) {
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setDirection(1);
          setActiveSlide((prevSlide) => (prevSlide + 1) % slides.length);
          return 0;
        }
        return prev + (100 / (AUTOPLAY_INTERVAL / 50));
      });
    }, 50);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isHovered, slides.length]);

  const navigate = (newDirection: number) => {
    setDirection(newDirection);
    setActiveSlide((prev) => (prev + newDirection + slides.length) % slides.length);
    setProgress(0);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    })
  };

  if (loading) return null;

  const currentSlide = slides[activeSlide];

  const SlideContent = ({ slide }: { slide: Slide }) => (
    <div className={`relative bg-gradient-to-br ${slide.bgColor} p-3 sm:p-4`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="relative flex items-start gap-3 sm:gap-4">
        {/* Image/Icon container */}
        <motion.div 
          className="relative flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {slide.image ? (
            <div className="relative">
              <Image
                src={slide.image}
                width={64}
                height={64}
                alt={slide.title}
                className="h-14 w-14 rounded-lg border border-zinc-700/50 object-cover shadow-lg sm:h-16 sm:w-16"
                unoptimized
              />
              <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${slide.bgColor} -z-10 blur-md opacity-50`} />
            </div>
          ) : (
            <div className={`flex h-14 w-14 items-center justify-center rounded-lg border ${slide.borderColor} bg-zinc-800/80 sm:h-16 sm:w-16`}>
              <FiDisc className={`h-6 w-6 ${slide.accentColor}`} />
            </div>
          )}
        </motion.div>

        {/* Text content */}
        <div className="min-w-0 flex-1 py-0.5">
          {/* Eyebrow */}
          <div className="mb-1 flex items-center gap-2">
            <span className={`flex items-center gap-1.5 ${slide.accentColor}`}>
              {slide.icon}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {slide.eyebrow}
            </span>
          </div>

          {/* Title */}
          <p className="truncate text-sm font-semibold text-white sm:text-base leading-tight">
            {slide.title}
          </p>

          {/* Subtitle */}
          <p className="truncate text-xs text-zinc-300 sm:text-sm mt-0.5">
            {slide.subtitle}
          </p>

          {/* Meta */}
          <p className="truncate text-[11px] text-zinc-500 sm:text-xs mt-1">
            {slide.meta}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div
        className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/95 shadow-xl backdrop-blur-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800/80 z-20">
          <motion.div
            className={`h-full ${
              activeSlide === 0 ? 'bg-indigo-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>

        {/* Main content with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait" custom={direction}>
          {currentSlide.href ? (
            <motion.a
              key={currentSlide.key}
              href={currentSlide.href}
              target="_blank"
              rel="noopener noreferrer"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="block"
            >
              <SlideContent slide={currentSlide} />
            </motion.a>
          ) : (
            <motion.div
              key={currentSlide.key}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <SlideContent slide={currentSlide} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation footer */}
        <div className="relative border-t border-zinc-800/70 bg-zinc-900/95 px-3 py-2 sm:px-4">
          <div className="flex items-center justify-between">
            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                aria-label="Previous slide"
                type="button"
              >
                <FiChevronLeft className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(1)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                aria-label="Next slide"
                type="button"
              >
                <FiChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Hint text */}
            <span className="text-[10px] text-zinc-600 hidden sm:block">
              Click arrows or wait for auto-play
            </span>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <motion.button
                  key={slide.key}
                  onClick={() => {
                    setDirection(index > activeSlide ? 1 : -1);
                    setActiveSlide(index);
                    setProgress(0);
                  }}
                  className={`relative h-2 rounded-full transition-all duration-300 ${
                    activeSlide === index 
                      ? 'w-6 bg-gradient-to-r from-zinc-300 to-zinc-400' 
                      : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to ${slide.eyebrow}`}
                  type="button"
                >
                  {activeSlide === index && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscordStatus;
