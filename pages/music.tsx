import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Squares from "../components/Squares";
import { FiMusic, FiChevronLeft } from "react-icons/fi";
import Image from "next/image";

type Track = {
  artist: string;
  title: string;
  songUrl: string;
  cover: string;
  albumYear: string;
  popularity: number;
};

type NowPlaying = {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
};

type Period = "short" | "medium" | "long";

export default function MusicEmbed() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [period, setPeriod] = useState<Period>("short");
  const [loading, setLoading] = useState(true);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ isPlaying: false });

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('/api/now-playing');
        const data = await res.json();
        setNowPlaying(data);
      } catch (error) {
        console.error('Failed to fetch now playing:', error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const getTrackIdFromUrl = (songUrl: string) => {
    const match = songUrl.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

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

      <div className="relative z-10 w-full min-h-screen flex flex-col">
        <div className="px-3 pt-4 sm:pt-6 sm:px-4">
          <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white">
            <FiChevronLeft size={20} className="sm:w-6 sm:h-6" />
            <span className="ml-2 text-sm sm:text-base">Back</span>
          </Link>
          <h1 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <FiMusic className="text-[#ff6347] w-5 h-5 sm:w-6 sm:h-6" />
            <span className="truncate">My Top Tracks</span>
          </h1>
        </div>

        <div className="flex-1 w-full py-4 sm:py-8 md:py-10 px-1 sm:px-4 md:px-6">
          <div className="mx-auto w-full max-w-7xl">
            {/* Now Playing Card */}
            {nowPlaying.isPlaying && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6 sm:mb-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-2 sm:p-4 hover:bg-white/10 transition-all"
              >
                <h2 className="text-white text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="relative inline-block w-2 h-2">
                    <span className="absolute inset-0 bg-[#1DB954] rounded-full animate-pulse"></span>
                    <span className="absolute inset-0 bg-[#1DB954] rounded-full"></span>
                  </span>
                  Now Playing
                </h2>
                <a
                  href={nowPlaying.songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-2 sm:gap-4 items-center hover:opacity-80 transition-opacity"
                >
                  {nowPlaying.albumImageUrl && (
                    <Image
                      src={nowPlaying.albumImageUrl}
                      alt={nowPlaying.title || 'Now Playing'}
                      width={64}
                      height={64}
                      className="rounded-lg w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-sm truncate">{nowPlaying.title}</p>
                    <p className="text-zinc-400 text-xs sm:text-sm truncate">{nowPlaying.artist}</p>
                    <p className="text-zinc-500 text-[10px] sm:text-xs truncate">{nowPlaying.album}</p>
                  </div>
                </a>
              </motion.div>
            )}

            {/* Period Selector */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-8 flex justify-center"
            >
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-full p-1 flex gap-1 sm:gap-2">
                {(["short", "medium", "long"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition ${
                      period === p ? "bg-[#ff6347] text-white" : "text-zinc-400"
                    }`}
                  >
                    {p === "short" ? "1M" : p === "medium" ? "6M" : "1Y"}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Tracks Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-zinc-400">Loading tracks...</div>
              </div>
            ) : tracks.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
              >
                {tracks.map((track, index) => {
                  const trackId = getTrackIdFromUrl(track.songUrl);
                  if (!trackId) return null;

                  return (
                    <motion.div
                      key={track.songUrl}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-0 hover:bg-white/10 transition-all"
                    >
                      <iframe
                        style={{
                          borderRadius: "12px",
                        }}
                        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=1`}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="flex justify-center items-center py-12">
                <div className="text-zinc-400">No tracks found</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
