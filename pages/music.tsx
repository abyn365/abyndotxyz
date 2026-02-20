import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Squares from "../components/Squares";
import { FiMusic, FiChevronLeft } from "react-icons/fi";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";

type Track = {
  artist: string;
  title: string;
  songUrl: string;
  cover: string;
  albumYear: string;
  popularity: number;
};

type Period = "short" | "medium" | "long";

export default function MusicEmbed() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [period, setPeriod] = useState<Period>("short");
  const [loading, setLoading] = useState(true);

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

      <div className="relative z-10 min-h-screen w-full px-3 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <Link href="/" passHref legacyBehavior>
              <a className="inline-flex items-center text-zinc-400 transition-colors hover:text-white">
                <FiChevronLeft size={20} className="sm:h-6 sm:w-6" />
                <span className="ml-2 text-sm sm:text-base">Back</span>
              </a>
            </Link>
            <h1 className="text-right text-lg font-bold text-white sm:text-2xl">
              <span className="inline-flex items-center gap-2 sm:gap-3">
                <FiMusic className="h-5 w-5 text-[#ff6347] sm:h-6 sm:w-6" />
                My Music
              </span>
            </h1>
          </div>

          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-3 shadow-xl sm:p-5">
            {/* Activity Carousel */}
            <div className="mb-4 sm:mb-5">
              <DiscordStatus />
            </div>

            <div className="mb-4 sm:mb-5">
              <h2 className="text-sm font-semibold text-white sm:text-base">Top Tracks</h2>
            </div>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mb-5 flex justify-center sm:mb-6"
            >
              <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                {(["short", "medium", "long"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`rounded-full px-3 py-1.5 text-xs transition sm:px-4 ${
                      period === p
                        ? "bg-[#ff6347] text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {p === "short" ? "1M" : p === "medium" ? "6M" : "1Y"}
                  </button>
                ))}
              </div>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-zinc-400">Loading tracks...</div>
              </div>
            ) : tracks.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {tracks.map((track, index) => {
                  const trackId = getTrackIdFromUrl(track.songUrl);
                  if (!trackId) return null;

                  return (
                    <motion.div
                      key={track.songUrl}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.03, duration: 0.25 }}
                      className="group overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/80 shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 hover:border-zinc-500/70"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2">
                        <p className="truncate text-xs font-medium text-zinc-300">{track.title}</p>
                        <span className="text-[10px] uppercase tracking-wide text-zinc-500">Spotify</span>
                      </div>
                      <iframe
                        style={{ borderRadius: "0 0 12px 12px" }}
                        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=1`}
                        width="100%"
                        height="180"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-zinc-400">No tracks found</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
