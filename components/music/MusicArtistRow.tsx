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

type Props = { group: ArtistGroup; index: number; maxPlaycount: number };

export default function MusicArtistRow({ group, index, maxPlaycount }: Props) {
  const barWidth = maxPlaycount > 0 ? (group.totalPlaycount / maxPlaycount) * 100 : 0;

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
        href={
          group.lastFmUrl ||
          `https://www.last.fm/music/${encodeURIComponent(group.artist)}`
        }
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: Math.min(index * 0.015, 0.2) }}
        className="group relative grid items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--bg-secondary)]"
        style={{ gridTemplateColumns: "2rem 3.5rem 1fr auto" }}
      >
        <span className="hidden text-right font-mono text-xs tabular-nums text-[var(--text-secondary)] sm:block">
          {String(group.rank).padStart(2, "0")}
        </span>

        <div
          className="col-start-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border sm:col-start-2"
          style={{ borderColor: "var(--card-border)" }}
        >
          <MusicArtwork
            src={group.topCover}
            alt={`${group.artist} art`}
            className="h-full w-full object-cover"
            iconClassName="h-4 w-4 opacity-20"
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
            {group.artist}
          </p>
          <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
            {group.trackCount} {group.trackCount === 1 ? "track" : "tracks"}
          </p>
        </div>

        <span className="hidden font-mono text-xs tabular-nums text-[var(--text-secondary)] sm:block">
          {formatPlaycount(group.totalPlaycount)}
        </span>
      </motion.a>
    </div>
  );
}
