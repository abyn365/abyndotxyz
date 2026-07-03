import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { formatPlaycount, type MusicTrack } from "../../lib/music";
import { type TrackMetadata } from "../../lib/music/metadata";
import MusicArtwork from "./MusicArtwork";

type Props = {
  track: MusicTrack;
  index: number;
  maxPlaycount?: number;
  artistCount?: number;
  onPlay?: (track: TrackMetadata) => void;
};

export default function MusicTrackCard({
  track,
  index,
  maxPlaycount = 0,
  artistCount = 1,
  onPlay,
}: Props) {
  const barWidth =
    maxPlaycount > 0 ? (track.playcount / maxPlaycount) * 100 : 0;

  const showBar = barWidth > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (onPlay) {
      e.preventDefault();
      onPlay({
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        songUrl: track.songUrl,
        playcount: track.playcount,
        rank: track.rank,
      });
    }
  };

  const Inner = (
    <>
      {/* Top tracks background bar */}
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

      <div
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

        {/* Cover with play overlay */}
        <div
          className="
            relative
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
          {onPlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Play className="h-5 w-5 text-white fill-white drop-shadow-md" />
            </div>
          )}
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
      </div>
    </>
  );

  if (onPlay) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: Math.min(index * 0.015, 0.2) }}
        className="relative overflow-hidden cursor-pointer"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Play ${track.title} by ${track.artist}`}
        onKeyDown={(e) => e.key === "Enter" && handleClick(e as any)}
      >
        {Inner}
      </motion.div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <motion.a
        href={track.songUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: Math.min(index * 0.015, 0.2) }}
      >
        {Inner}
      </motion.a>
    </div>
  );
}
