import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Squares from "../components/Squares";
import { ChevronLeft } from "lucide-react";

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
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="fixed inset-0 z-0">
        <Squares
          speed={0.15}
          squareSize={50}
          direction="diagonal"
        />
      </div>

      <div className="relative z-10 min-h-screen w-full px-4 pt-20 pb-12 sm:px-6 lg:px-8 lg:pt-28 lg:pb-20">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
              <ChevronLeft size={16} className="mr-1" />
              Back
            </Link>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              My Music
            </h1>
          </div>

          <div className="bento-card">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Top Tracks</h2>
            </div>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mb-5 flex justify-center"
            >
              <div className="flex items-center gap-0.5 rounded-lg p-0.5 border" style={{ borderColor: 'var(--card-border)' }}>
                {(["short", "medium", "long"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200"
                    style={
                      period === p
                        ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }
                        : { color: 'var(--text-secondary)', borderBottom: '2px solid transparent' }
                    }
                  >
                    {p === "short" ? "1M" : p === "medium" ? "6M" : "1Y"}
                  </button>
                ))}
              </div>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  Loading tracks...
                </div>
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
                      initial={{ y: 16, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.03, duration: 0.25 }}
                      className="overflow-hidden rounded-xl transition-all duration-300"
                      style={{
                        border: '1px solid var(--card-border)',
                        background: 'var(--card-bg)',
                      }}
                    >
                      <iframe
                        style={{ borderRadius: "12px" }}
                        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=1`}
                        width="100%"
                        height="152"
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
                <div className="text-xs text-[var(--text-secondary)]">No tracks found</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}