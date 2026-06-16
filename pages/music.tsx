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
          speed={0.15}
          squareSize={40}
          direction="diagonal"
        />
      </div>

      <div className="relative z-10 min-h-screen w-full px-3 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <Link href="/" passHref legacyBehavior>
              <a className="inline-flex items-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                <ChevronLeft size={20} className="sm:h-6 sm:w-6" />
                <span className="ml-2 text-sm sm:text-base">Back</span>
              </a>
            </Link>
            <h1 className="text-right text-lg font-bold text-[var(--text-primary)] sm:text-2xl">
              <span className="inline-flex items-center gap-2 sm:gap-3">
                <Music className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: 'var(--accent)' }} />
                My Music
              </span>
            </h1>
          </div>

          <div className="bento-card">
            <div className="mb-4 sm:mb-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">Top Tracks</h2>
            </div>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mb-5 flex justify-center sm:mb-6"
            >
              <div
                className="inline-flex rounded-full p-0.5 gap-0.5"
                style={{
                  background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
                  border: '1px solid var(--card-border)',
                }}
              >
                {(["short", "medium", "long"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="rounded-full px-3 py-1.5 text-xs transition sm:px-4 font-medium"
                    style={
                      period === p
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { color: 'var(--text-secondary)' }
                    }
                    onMouseEnter={(e) => {
                      if (period !== p) e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (period !== p) e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    {p === "short" ? "1M" : p === "medium" ? "6M" : "1Y"}
                  </button>
                ))}
              </div>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
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
                      className="group overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        border: '1px solid var(--card-border)',
                        background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
                      }}
                    >
                      <div
                        className="flex items-center justify-between border-b px-3 py-2"
                        style={{ borderColor: 'var(--card-border)' }}
                      >
                        <p className="truncate text-xs font-medium text-[var(--text-primary)]">{track.title}</p>
                        <span className="text-[9px] uppercase tracking-wide text-[var(--text-secondary)]">Spotify</span>
                      </div>
                      <iframe
                        style={{ borderRadius: "0 0 12px 12px" }}
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