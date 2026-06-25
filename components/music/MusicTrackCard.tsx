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

  const showBar = barWidth > 0;

  return (
    <div className="relative overflow-hidden">
      {/* Top tracks background */}
      {showBar && barWidth > 0 && (
        <>
          {/* Soft glow layer */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 transition-all duration-700"
            style={{
              width: `${barWidth}%`,
              background:
                "linear-gradient(90deg, var(--accent-glow), transparent)",
              filter: "blur(10px)",
            }}
          />

          {/* Main bar */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 transition-all duration-700"
            style={{
              width: `${barWidth}%`,
              background:
                "linear-gradient(90deg, var(--accent-bar) 0%, transparent 100%)",
            }}
          />
        </>
      )}

      <motion.a
        href={track.songUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: Math.min(index * 0.015, 0.2) }}
        className="
          group
          relative
          grid
          grid-cols-[56px_1fr]
          items-center
          gap-3
          px-3
          py-3
          transition-all
          duration-200

          hover:bg-[var(--accent-glow)]

          sm:grid-cols-[2rem_3.5rem_1fr_auto]
        "
      >
        {/* Rank */}
        <span className="hidden text-right font-mono text-xs tabular-nums text-[var(--text-secondary)] sm:block">
          {String(track.rank).padStart(2, "0")}
        </span>

        {/* Cover */}
        <div
          className="
            h-14
            w-14
            shrink-0
            overflow-hidden
            rounded-lg
            border
            transition-all
            duration-200

            group-hover:border-[var(--accent)]
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          <MusicArtwork
            src={track.cover}
            alt={`${track.title} cover`}
            className="h-full w-full object-cover"
            iconClassName="h-4 w-4 opacity-20"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 overflow-hidden">
          <p
            className="
              truncate
              text-sm
              font-medium
              text-[var(--text-primary)]
              transition-colors

              group-hover:text-[var(--accent)]
            "
          >
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

          {/* Mobile playcount */}
          <div className="mt-1 sm:hidden">
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">
              {formatPlaycount(track.playcount)} plays
            </span>
          </div>
        </div>

        {/* Desktop playcount */}
        <span
          className="
            hidden
            font-mono
            text-xs
            tabular-nums
            text-[var(--text-secondary)]

            transition-colors

            group-hover:text-[var(--accent)]
            sm:block
          "
        >
          {formatPlaycount(track.playcount)}
        </span>
      </motion.a>
    </div>
  );
}
