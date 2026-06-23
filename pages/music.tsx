import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Squares from "../components/Squares";
import { Music, ChevronLeft } from "lucide-react";

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
          speed={0.1}
          squareSize={40}
          direction="diagonal"
        />
      </div>

      <div className="relative z-10 flex flex-col">
        <div className="mx-auto w-full max-w-3xl px-6 pt-24 pb-12 sm:pt-32 sm:pb-20">
          <div className="mb-12 flex items-center justify-between">
            <Link href="/" passHref legacyBehavior>
              <a className="inline-flex items-center text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                <ChevronLeft size={16} />
                <span className="ml-1">Home</span>
              </a>
            </Link>
            <h1 className="text-xl font-medium tracking-tight text-[var(--text-primary)]">
              Music
            </h1>
          </div>

          <div
            className="rounded-xl border p-6 sm:p-8"
            style={{
              borderColor: 'var(--card-border)',
              background: 'var(--card-bg)',
            }}
          >
            <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Top Tracks
              </h2>

              <div
                className="inline-flex rounded-lg p-1 gap-1"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {(["short", "medium", "long"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      period === p
                        ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {p === "short" ? "1M" : p === "medium" ? "6M" : "1Y"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent)' }} />
                  Loading...
                </div>
              </div>
            ) : tracks.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 gap-4"
              >
                {tracks.map((track, index) => {
                  const trackId = getTrackIdFromUrl(track.songUrl);
                  if (!trackId) return null;

                  return (
                    <motion.div
                      key={track.songUrl}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]"
                    >
                      <iframe
                        style={{ borderRadius: "0" }}
                        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=1`}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center py-24 text-sm text-[var(--text-secondary)]">
                No tracks found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}