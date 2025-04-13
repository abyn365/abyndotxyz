import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { FiMusic, FiActivity } from "react-icons/fi";

interface SpotifyData {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  albumImageUrl?: string;
  songUrl?: string;
}

interface StatusCarouselProps {
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  discordActivity?: any;
  activeDevice?: string | null;
  pauseOnHover?: boolean; // Add this prop
}

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 };

export default function StatusCarousel({
  baseWidth = 300,
  autoplay = true,
  autoplayDelay = 5000,
  discordActivity,
  activeDevice,
  pauseOnHover = true // Add default value
}: StatusCarouselProps) {
  const [spotifyData, setSpotifyData] = useState<SpotifyData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false); // Add hover state
  const x = useMotionValue(0);
  
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('/api/now-playing');
        const data = await res.json();
        setSpotifyData(data);
      } catch (error) {
        console.error('Failed to fetch Spotify status:', error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered)) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev === 1 ? 0 : 1));
      }, autoplayDelay);
      return () => clearInterval(timer);
    }
  }, [autoplay, autoplayDelay, pauseOnHover, isHovered]);

  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      setCurrentIndex((prev) => Math.min(prev + 1, 1));
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <div className="w-full font-sen mb-4 flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <p className="text-white text-sm">
          See what I&apos;m currently doing
        </p>
        {activeDevice && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            Active on {activeDevice}
          </span>
        )}
      </div>
      
      <div 
        className="relative overflow-hidden rounded-lg border border-zinc-800/50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="flex"
          drag="x"
          dragConstraints={{
            left: -trackItemOffset,
            right: 0,
          }}
          style={{
            width: itemWidth,
            gap: `${GAP}px`,
            x,
          }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(currentIndex * trackItemOffset) }}
          transition={SPRING_OPTIONS}
        >
          {/* Discord Activity Card */}
          <motion.div
            className="relative shrink-0 flex items-start bg-zinc-900 rounded-lg p-4"
            style={{ width: itemWidth }}
          >
            <div className="flex items-center gap-3">
              {discordActivity?.image && (
                <Image
                  src={discordActivity.image}
                  width={64}
                  height={64}
                  alt={discordActivity.name}
                  className="rounded-md"
                  unoptimized
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FiActivity className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white">
                    {discordActivity?.name || 'Not doing anything'}
                  </span>
                </div>
                {discordActivity?.details && (
                  <p className="mt-1 text-xs text-gray-400">
                    {discordActivity.details}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Spotify Card */}
          <motion.div
            className="relative shrink-0 flex items-start bg-zinc-900 rounded-lg p-4"
            style={{ width: itemWidth }}
          >
            <div className="flex items-center gap-3">
              {spotifyData?.isPlaying && spotifyData?.albumImageUrl ? (
                <Image
                  src={spotifyData.albumImageUrl}
                  width={64}
                  height={64}
                  alt={spotifyData.title || 'Album art'}
                  className="rounded-md"
                  unoptimized
                />
              ) : (
                <div className="w-16 h-16 bg-zinc-800 rounded-md flex items-center justify-center">
                  <FiMusic className="h-8 w-8 text-zinc-600" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.542-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.281 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span className="text-sm font-medium text-white">
                    {spotifyData?.isPlaying ? 'Now Playing' : 'Not Playing'}
                  </span>
                </div>
                {spotifyData?.isPlaying ? (
                  <>
                    <p className="mt-1 text-sm text-white truncate hover:text-green-400 transition-colors">
                      <a href={spotifyData.songUrl} target="_blank" rel="noopener noreferrer">
                        {spotifyData.title}
                      </a>
                    </p>
                    <p className="text-xs text-gray-400 truncate">{spotifyData.artist}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    No music playing right now
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Pagination Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1].map((index) => (
            <motion.button
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${
                currentIndex === index ? 'bg-white' : 'bg-zinc-600'
              }`}
              onClick={() => setCurrentIndex(index)}
              animate={{ scale: currentIndex === index ? 1.2 : 1 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}