import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
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
};

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ isPlaying: false });
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);

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
        bgColor: 'from-indigo-500/[0.03] via-indigo-500/[0.02] to-transparent',
        borderColor: 'border-indigo-500/20'
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
        bgColor: 'from-emerald-500/[0.03] via-emerald-500/[0.02] to-transparent',
        borderColor: 'border-emerald-500/20'
      }
    ];
  }, [status, nowPlaying]);

  const AUTOPLAY_INTERVAL = 10000; // Changed to 10 seconds

  useEffect(() => {
    if (isHovered || isDragging) {
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
  }, [isHovered, isDragging, slides.length]);

  const navigate = (newDirection: number) => {
    setDirection(newDirection);
    setActiveSlide((prev) => (prev + newDirection + slides.length) % slides.length);
    setProgress(0);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      navigate(1);
    } else if (info.offset.x > threshold) {
      navigate(-1);
    }
    setIsDragging(false);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1]
      }
    })
  };

  if (loading) return null;

  const currentSlide = slides[activeSlide];

  const SlideContent = ({ slide }: { slide: Slide }) => (
    <div className={`relative bg-gradient-to-br ${slide.bgColor} p-2.5 sm:p-3`}>
      <div className="relative flex items-center gap-2.5 sm:gap-3">
        {/* Image/Icon container - smaller and proportional */}
        <motion.div 
          className="relative flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {slide.image ? (
            <Image
              src={slide.image}
              width={40}
              height={40}
              alt={slide.title}
              className="h-10 w-10 rounded-md border border-zinc-700/30 object-cover sm:h-11 sm:w-11"
              unoptimized
              draggable={false}
            />
          ) : (
            <div className={`flex h-10 w-10 items-center justify-center rounded-md border ${slide.borderColor} bg-zinc-800/50 sm:h-11 sm:w-11`}>
              <FiDisc className={`h-4 w-4 ${slide.accentColor}`} />
            </div>
          )}
        </motion.div>

        {/* Text content - compact */}
        <div className="min-w-0 flex-1 select-none">
          {/* Eyebrow */}
          <div className="mb-0.5 flex items-center gap-1.5">
            <span className={`${slide.accentColor}`}>
              {slide.icon}
            </span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
              {slide.eyebrow}
            </span>
          </div>

          {/* Title */}
          <p className="truncate text-xs font-medium text-white sm:text-sm leading-tight">
            {slide.title}
          </p>

          {/* Subtitle */}
          <p className="truncate text-[11px] text-zinc-400 mt-0.5">
            {slide.subtitle}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-zinc-700/30 bg-transparent shadow-lg select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800/50 z-20">
          <motion.div
            className={`h-full ${
              activeSlide === 0 ? 'bg-indigo-500/70' : 'bg-emerald-500/70'
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
              style={{ x, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              className="block cursor-grab active:cursor-grabbing"
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
              style={{ x, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              <SlideContent slide={currentSlide} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation footer - slimmer */}
        <div className="relative border-t border-zinc-800/30 bg-transparent px-2.5 py-1.5 sm:px-3">
          <div className="flex items-center justify-between">
            {/* Navigation buttons */}
            <div className="flex items-center gap-0.5">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
                aria-label="Previous slide"
                type="button"
              >
                <FiChevronLeft className="h-3.5 w-3.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(1)}
                className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
                aria-label="Next slide"
                type="button"
              >
                <FiChevronRight className="h-3.5 w-3.5" />
              </motion.button>
            </div>

            {/* Dot indicators - smaller */}
            <div className="flex items-center gap-1.5">
              {slides.map((slide, index) => (
                <motion.button
                  key={slide.key}
                  onClick={() => {
                    setDirection(index > activeSlide ? 1 : -1);
                    setActiveSlide(index);
                    setProgress(0);
                  }}
                  className={`relative h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === index 
                      ? 'w-4 bg-zinc-400' 
                      : 'w-1.5 bg-zinc-700 hover:bg-zinc-600'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
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
