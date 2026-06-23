import { useEffect, useState } from "react";
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

const PERIODS: { value: Period; label: string }[] = [
  { value: "short", label: "1M" },
  { value: "medium", label: "6M" },
  { value: "long", label: "1Y" },
];

function PeriodButton({
  value,
  label,
  active,
  onClick,
}: {
  value: Period;
  label: string;
  active: boolean;
  onClick: (period: Period) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className="rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4"
      style={
        active
          ? { background: "var(--accent)", color: "var(--accent-text)" }
          : { color: "var(--text-secondary)" }
      }
    >
      {label}
    </button>
  );
}

function TrackCard({ track, index }: { track: Track; index: number }) {
  const big = index % 10 === 0;
  const tall = index % 7 === 0;

  const mobileShape = big
    ? "aspect-[4/5]"
    : tall
      ? "aspect-[5/6]"
      : "aspect-square";

  return (
    <motion.a
      href={track.songUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className={[
        "group relative block w-full overflow-hidden rounded-2xl transition duration-300",
        "break-inside-avoid mb-3 md:mb-0",
        mobileShape,
        "md:aspect-square",
        big ? "md:col-span-2 md:row-span-2" : "",
      ].join(" ")}
      style={{
        border: "1px solid var(--card-border)",
        background: "color-mix(in srgb, var(--text-primary) 3%, transparent)",
      }}
    >
      <img
        src={track.cover}
        alt={`${track.title} cover art`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] group-hover:brightness-50"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-90 transition duration-300 group-hover:from-black/85" />

      <div
        className={[
          "absolute inset-3 z-20 flex flex-col justify-end transition duration-300",
          "opacity-100 md:opacity-0 md:group-hover:opacity-100",
          "translate-y-0 md:translate-y-2 md:group-hover:translate-y-0",
          big ? "md:inset-4" : "",
        ].join(" ")}
      >
        <p
          className={[
            "mb-1 line-clamp-2 font-bold leading-tight text-white",
            big ? "sm:text-xl" : "text-sm sm:text-base",
          ].join(" ")}
        >
          {track.title}
        </p>
        <p className="line-clamp-1 text-xs text-white/80 sm:text-sm">
          {track.artist}
        </p>
      </div>
    </motion.a>
  );
}

export default function MusicEmbed() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [period, setPeriod] = useState<Period>("short");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTracks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/top-tracks?period=${period}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!controller.signal.aborted) {
          setTracks(data?.error ? [] : data?.tracks ?? []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setTracks([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTracks();
    return () => controller.abort();
  }, [period]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="fixed inset-0 z-0">
        <Squares speed={0.15} squareSize={40} direction="diagonal" />
      </div>

      <div className="relative z-10 min-h-screen w-full px-3 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ChevronLeft size={20} className="sm:h-6 sm:w-6" />
              <span className="ml-2 text-sm sm:text-base">Back</span>
            </Link>

            <h1 className="text-right text-lg font-bold text-[var(--text-primary)] sm:text-2xl">
              <span className="inline-flex items-center gap-2 sm:gap-3">
                <Music
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: "var(--accent)" }}
                />
                My Music
              </span>
            </h1>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">
              Top Tracks
            </h2>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mt-4 flex justify-center"
            >
              <div
                className="inline-flex gap-0.5 rounded-full p-0.5"
                style={{
                  background: "color-mix(in srgb, var(--text-primary) 5%, transparent)",
                  border: "1px solid var(--card-border)",
                }}
              >
                {PERIODS.map(({ value, label }) => (
                  <PeriodButton
                    key={value}
                    value={value}
                    label={label}
                    active={period === value}
                    onClick={setPeriod}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <div
                  className="h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                Loading tracks...
              </div>
            </div>
          ) : tracks.length > 0 ? (
            <>
              <motion.div
                key={period}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="columns-2 gap-3 sm:columns-3 md:columns-1 md:grid md:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6"
              >
                {tracks.map((track, index) => (
                  <TrackCard key={track.songUrl} track={track} index={index} />
                ))}
              </motion.div>
            </>
          ) : (
            <div className="flex items-center justify-center py-16">
              <div className="text-xs text-[var(--text-secondary)]">
                No tracks found
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}