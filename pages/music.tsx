import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Squares from "../components/Squares";
import Link from "next/link";
import { FiMusic, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

type Track = {
  artist: string;
  title: string;
  songUrl: string;
  cover: string;
  albumYear: string;
  popularity: number;
};

type Period = "short" | "medium" | "long";

export default function Music() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [period, setPeriod] = useState<Period>("short");
  const [loading, setLoading] = useState(true);
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const [isHoldingPrev, setIsHoldingPrev] = useState(false);
  const [isHoldingNext, setIsHoldingNext] = useState(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/top-tracks?period=${period}`);
        const data = await res.json();
        if (!data.error) setTracks(data.tracks);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [period]);

  useEffect(() => {
    if (isHoldingPrev || isHoldingNext) {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

      const slide = () => {
        if (!swiperRef) return;
        isHoldingPrev ? swiperRef.slidePrev() : swiperRef.slideNext();
      };

      slide();

      holdIntervalRef.current = setInterval(slide, 400);
    } else {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    }

    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [isHoldingPrev, isHoldingNext, swiperRef]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-900">
      <div className="fixed inset-0 z-0 sm:block">
        <Squares
          speed={0.2}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255,255,255,0.1)"
          hoverFillColor="rgba(255, 99, 71, 0.1)"
        />
      </div>

      <div className="relative z-10 w-full h-screen flex flex-col">
        <div className="px-4 pt-6">
          <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white">
            <FiChevronLeft size={24} />
            <span className="ml-2">Back</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white flex items-center gap-3">
            <FiMusic className="text-[#ff6347]" />
            My Music Collection
          </h1>
        </div>

        <div className="flex-1 w-full flex items-center justify-center">
          <div className="relative w-full h-full max-h-[60vh] px-4 flex justify-center">
            {tracks.length > 0 && !loading && (
              <Swiper
                key={period}
                modules={[Autoplay, EffectCoverflow]}
                effect="coverflow"
                grabCursor
                centeredSlides
                slidesPerView="auto"
                speed={400}
                loop
                onSwiper={setSwiperRef}
                coverflowEffect={{
                  rotate: 50,
                  stretch: 0,
                  depth: 120,
                  modifier: 1,
                  slideShadows: false
                }}
                className="h-full"
              >
                {tracks.map((track, index) => (
                  <SwiperSlide key={track.songUrl} className="!w-64">
                    <TrackCard track={track} index={index} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}

            {/* Prev */}
            <motion.button
              onMouseDown={() => setIsHoldingPrev(true)}
              onMouseUp={() => setIsHoldingPrev(false)}
              onMouseLeave={() => setIsHoldingPrev(false)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full backdrop-blur-xl bg-white/5 border border-white/20 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              style={{
                boxShadow: isHoldingPrev
                  ? "0 0 25px #ff6347"
                  : "0 0 10px rgba(255,255,255,0.15)",
                color: isHoldingPrev ? "#ff6347" : "white"
              }}
            >
              <FiChevronLeft size={24} />
            </motion.button>

            {/* Next */}
            <motion.button
              onMouseDown={() => setIsHoldingNext(true)}
              onMouseUp={() => setIsHoldingNext(false)}
              onMouseLeave={() => setIsHoldingNext(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full backdrop-blur-xl bg-white/5 border border-white/20 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              style={{
                boxShadow: isHoldingNext
                  ? "0 0 25px #ff6347"
                  : "0 0 10px rgba(255,255,255,0.15)",
                color: isHoldingNext ? "#ff6347" : "white"
              }}
            >
              <FiChevronRight size={24} />
            </motion.button>

            {/* Period */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-full p-1 flex gap-2 shadow-2xl">
                {(["short", "medium", "long"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-full text-sm transition ${
                      period === p ? "bg-[#ff6347] text-white" : "text-zinc-400"
                    }`}
                  >
                    {p === "short"
                      ? "Past Month"
                      : p === "medium"
                      ? "6 Months"
                      : "All Time"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TrackCard = ({ track, index }: { track: Track; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={cardRef}
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={track.songUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative rounded-xl overflow-hidden"
      >
        <div className="relative aspect-square w-full rounded-xl overflow-hidden">

          {/* Glow */}
          <div className="absolute -inset-1 bg-[#ff6347] blur-2xl opacity-20 group-hover:opacity-40 transition" />

          <Image
            src={track.cover}
            alt={track.title}
            fill
            priority={index < 6}
            className="object-cover relative z-10"
          />

          {/* Glass overlay on hover */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition" />
        </div>
      </a>

      {/* GLASS TOOLTIP - TRUE CENTER LOCK */}
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{
    opacity: hovered ? 1 : 0,
    y: hovered ? 0 : 12
  }}
  className="absolute inset-x-0 bottom-0 translate-y-1/2 flex justify-center z-50 pointer-events-none"
>
  <div
    className="px-4 py-2 rounded-xl backdrop-blur-xl bg-black/60 border border-white/20 text-center w-[85%]"
    style={{
      boxShadow: "0 8px 20px rgba(0,0,0,0.6)"
    }}
  >
    <p className="text-white font-semibold text-sm truncate">
      {track.title}
    </p>
    <p className="text-zinc-300 text-xs truncate">
      {track.artist}
    </p>
  </div>
</motion.div>

    </div>
  );
};
