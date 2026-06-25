import { motion } from "framer-motion";
import { formatPlaycount } from "../../lib/music";
import MusicArtwork from "./MusicArtwork";

export type ArtistGroup = {
  artist: string;
  totalPlaycount: number;
  trackCount: number;
  topCover: string;
  lastFmUrl: string;
  rank: number;
};

type Props = {
  group: ArtistGroup;
  index: number;
  maxPlaycount: number;
};

export default function MusicArtistRow({ group, index, maxPlaycount }: Props) {
  const barWidth =
    maxPlaycount > 0 ? (group.totalPlaycount / maxPlaycount) * 100 : 0;

  return (
    <div className="relative">
      {barWidth > 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 transition-all duration-700"
          style={{
            width: `${barWidth}%`,
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent)",
          }}
        />
      )}

      <motion.a
        href={
          group.lastFmUrl ||
          `https://www.last.fm/music/${encodeURIComponent(group.artist)}`
        }
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: Math.min(index * 0.015, 0.2) }}
        className="
          group relative
          grid grid-cols-[56px_1fr] items-center
          gap-3 px-3
          py-3 transition-colors
          duration-150

          hover:bg-[var(--bg-secondary)]
          sm:grid-cols-[2rem_3.5rem_1fr_auto]
        "
      >
        {/* Rank */}
        <span className="hidden text-right font-mono text-xs tabular-nums text-[var(--text-secondary)] sm:block">
          {String(group.rank).padStart(2, "0")}
        </span>

        {/* Cover */}
        <div
          className="
            h-14 w-14
            shrink-0
            overflow-hidden
            rounded-lg
            border
          "
          style={{ borderColor: "var(--card-border)" }}
        >
          <MusicArtwork
            src={group.topCover}
            alt={`${group.artist} art`}
            className="h-full w-full object-cover"
            iconClassName="h-4 w-4 opacity-20"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 overflow-hidden">
          <p className="truncate text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
            {group.artist}
          </p>

          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {group.trackCount} {group.trackCount === 1 ? "track" : "tracks"}
          </p>

          {/* Mobile plays */}
          <div className="mt-1 sm:hidden">
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">
              {formatPlaycount(group.totalPlaycount)} plays
            </span>
          </div>
        </div>

        {/* Desktop plays */}
        <span className="hidden font-mono text-xs tabular-nums text-[var(--text-secondary)] sm:block">
          {formatPlaycount(group.totalPlaycount)}
        </span>
      </motion.a>
    </div>
  );
}
