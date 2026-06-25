import { motion } from "framer-motion";
import { formatPlaycount, type MusicTrack } from "../../lib/music";
import MusicArtwork from "./MusicArtwork";

type Props = {
  track: MusicTrack;
  index: number;
  maxPlaycount?: number;
  artistCount?: number;
};

export default function MusicTrackCard({
  track,
  index,
  maxPlaycount = 0,
  artistCount = 1,
}: Props) {
  const barWidth =
    maxPlaycount > 0 ? (track.playcount / maxPlaycount) * 100 : 0;

  return (
    <div className="relative">
      {barWidth > 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-xl transition-all duration-700"
          style={{
            width: `${barWidth}%`,
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent)",
          }}
        />
      )}

      <motion.a
        href={track.songUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: Math.min(index * 0.015, 0.2) }}
        className="group relative grid items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--bg-secondary)]"
        style={{ gridTemplateColumns: "2rem 3.5rem 1fr auto" }}
      >
        <span className="hidden text-right font-mono text-xs tabular-nums text-[var(--text-secondary)] sm:block">
          {String(track.rank).padStart(2, "0")}
        </span>

        <div
          className="col-start-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border sm:col-start-2"
          style={{ borderColor: "var(--card-border)" }}
        >
          <MusicArtwork
            src={track.cover}
            alt={`${track.title} cover`}
            className="h-full w-full object-cover"
            iconClassName="h-4 w-4 opacity-20"
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
            {track.title}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--text-secondary)]">
            <span className="truncate">{track.artist}</span>
            {artistCount > 1 && (
              <span className="shrink-0 font-mono text-[9px] opacity-50">
                ×{artistCount}
              </span>
            )}
          </p>
        </div>

        <span className="hidden font-mono text-xs tabular-nums text-[var(--text-secondary)] sm:block">
          {formatPlaycount(track.playcount)}
        </span>
      </motion.a>
    </div>
  );
}
