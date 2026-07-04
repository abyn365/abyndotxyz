import type { NextComponentType } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import MusicArtwork from "../music/MusicArtwork";
import { useTopTracks } from "../../hooks/useTopTracks";
import { formatPlaycount } from "../../lib/music";

const TopTracks: NextComponentType = () => {
  const { tracks } = useTopTracks();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!tracks.length) return null;

  return (
    <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-300"
        style={{
          background: "color-mix(in srgb, var(--text-primary) 5%, transparent)",
          borderColor: "var(--card-border)",
        }}
      >
        <div>
          <p className="font-display text-base font-bold text-[var(--text-primary)]">
            Top Tracks
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Quick look from Last.fm
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="grid gap-2">
          {tracks.slice(0, 10).map((track) => (
            <Link
              key={`${track.songUrl}-${track.rank}`}
              href={track.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: "var(--card-border)",
                background: "var(--card-bg)",
              }}
            >
              <span className="w-5 text-right text-xs font-medium tabular-nums text-[var(--text-secondary)]">
                {track.rank}
              </span>

              <div
                className="h-11 w-11 overflow-hidden rounded-xl border"
                style={{ borderColor: "var(--card-border)" }}
              >
                <MusicArtwork
                  src={track.cover}
                  alt={`${track.title} cover art`}
                  className="h-full w-full object-cover"
                  iconClassName="h-4 w-4 opacity-25"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                  {track.title}
                </p>
                <p className="truncate text-xs text-[var(--text-secondary)]">
                  {track.artist}
                </p>
              </div>

              <span className="text-[10px] tabular-nums text-[var(--text-secondary)] opacity-70">
                {formatPlaycount(track.playcount)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopTracks;
