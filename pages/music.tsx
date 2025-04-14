import { useState, useEffect } from 'react';
import Image from "next/image";
import { motion } from "framer-motion";
import Squares from "../components/Squares";
import Link from "next/link";
import { FiMusic, FiChevronLeft } from "react-icons/fi";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

type Track = {
  artist: string;
  title: string;
  songUrl: string;
  cover: string;
  albumYear: string;
  popularity: number;
};

type Period = 'short' | 'medium' | 'long';

export default function Music() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [period, setPeriod] = useState<Period>('short');
  const [loading, setLoading] = useState(true);

  // Fetch tracks for the selected time period
  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/top-tracks?period=${period}`);
        const data = await response.json();
        if (!data.error) {
          setTracks(data.tracks);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [period]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-900">
      {/* Background squares */}
      <div className="fixed inset-0 z-0 sm:block">
        <Squares 
          speed={0.2}
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255,255,255,0.1)'
          hoverFillColor='rgba(255, 99, 71, 0.1)'
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header Section */}
        <div className="px-4 py-6 sm:py-8">
          <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white transition-colors">
            <FiChevronLeft size={24} />
            <span className="ml-2">Back</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white flex items-center gap-3">
            <FiMusic className="text-[#ff6347]" />
            My Music Collection
          </h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          <div className="relative h-[80vh]"> {/* Reduced from 85vh to 80vh */}
            <div className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
              {loading ? (
                <Swiper
                  modules={[EffectCoverflow]}
                  effect="coverflow"
                  centeredSlides={true}
                  slidesPerView="auto"
                  coverflowEffect={{
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: false,
                  }}
                  className="h-full py-[8vh]"
                >
                  {[...Array(9)].map((_, i) => (
                    <SwiperSlide
                      key={i}
                      className="!w-64"
                    >
                      <LoadingSkeleton index={i} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <Swiper
                  modules={[Autoplay, EffectCoverflow, Navigation]}
                  effect="coverflow"
                  grabCursor={true}
                  centeredSlides={true}
                  slidesPerView="auto"
                  coverflowEffect={{
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: false,
                  }}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  loop={true}
                  className="h-full py-[8vh]" // Reduced from 10vh to 8vh
                >
                  {tracks.map((track, index) => (
                    <SwiperSlide
                      key={track.songUrl}
                      className="!w-64" // Fixed width instead of dynamic clamp
                    >
                      <TrackCard track={track} index={index} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            {/* Floating Period Selector - Adjusted position */}
            <div className="absolute bottom-[8vh] left-1/2 -translate-x-1/2 z-50"> {/* Changed from 15vh to 8vh */}
              <div className="backdrop-blur-md bg-black/30 rounded-full p-2 border border-white/10 shadow-lg">
                <div className="flex gap-2">
                  {(['short', 'medium', 'long'] as Period[]).map((p) => (
                    <motion.button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-4 py-2 rounded-full transition-all duration-300 ${
                        period === p 
                          ? 'bg-[#ff6347] text-white' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      whileHover={{ scale: period === p ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {p === 'short' ? 'Past Month' : p === 'medium' ? 'Past 6 Months' : 'All Time'}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TrackCard = ({ track, index }: { track: Track; index: number }) => {
  return (
    <motion.a
      href={track.songUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative snap-start snap-always rounded-lg elegant-card"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        scale: 1.05,
        zIndex: 10,
        transition: { duration: 0.2 }
      }}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-lg">
        <Image
          src={track.cover}
          alt={track.title}
          fill
          className="object-cover transition-all duration-500 group-hover:scale-110"
          priority={index < 8}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="font-bold text-white text-lg md:text-xl truncate">
            {track.title}
          </p>
          <p className="text-zinc-200 text-sm md:text-base truncate mt-1">
            {track.artist}
          </p>
        </div>
      </div>
    </motion.a>
  );
};

const LoadingSkeleton = ({ index }: { index: number }) => {
  return (
    <motion.div
      className="group relative snap-start snap-always rounded-lg elegant-card"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.1,
        ease: "easeOut"
      }}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          {/* Title skeleton */}
          <div className="h-5 w-3/4 bg-zinc-700/50 rounded-md animate-pulse mb-2" />
          {/* Artist skeleton */}
          <div className="h-4 w-1/2 bg-zinc-700/30 rounded-md animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
};