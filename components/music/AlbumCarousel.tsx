/**
 * components/music/AlbumCarousel.tsx
 * Horizontally scrollable "Top Albums" carousel.
 * Cards are non-playable — clicking opens the Last.fm album URL.
 * Matches the design language of TrackCarousel in music.tsx.
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Disc3, ExternalLink } from "lucide-react";
import { useRef, useCallback } from "react";
import MusicArtwork from "./MusicArtwork";
import { useMusicPlayer } from "./MusicPlayerContext";
import { useDragScroll } from "../../hooks/useDragScroll";

interface Album {
  name: string;
  artist: string;
  plays: number;
  share: number;
  coverUrl?: string;
  url?: string;
  year?: string;
}

interface Props {
  albums: Album[];
  isLoading: boolean;
}

function AlbumCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="w-[68vw] max-w-[220px] shrink-0 snap-start"
    >
      {/* Artwork placeholder */}
      <div
        className="aspect-square w-full rounded-xl skeleton-pulse border"
        style={{ borderColor: "var(--card-border)", background: "var(--bg-secondary)" }}
      />
      {/* Text placeholders */}
      <div className="mt-3 space-y-2 px-1">
        <div className="h-2 w-2/3 rounded skeleton-pulse" style={{ background: "var(--bg-secondary)" }} />
        <div className="h-3 w-4/5 rounded skeleton-pulse" style={{ background: "var(--bg-secondary)" }} />
        <div className="h-2.5 w-1/2 rounded skeleton-pulse" style={{ background: "var(--bg-secondary)" }} />
      </div>
    </motion.div>
  );
}

export default function AlbumCarousel({ albums, isLoading }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { accentColor } = useMusicPlayer();

  useDragScroll(ref);

  const scroll = useCallback((dir: number) => {
    ref.current?.scrollBy({
      left: dir * Math.min(480, (ref.current?.clientWidth ?? 0) * 0.85),
      behavior: "smooth",
    });
  }, []);

  const handleCardClick = useCallback((url?: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const accent = accentColor.primary;

  return (
    <section className="overflow-hidden">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Top Albums
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Your most-played albums for this period.
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            aria-label="Previous albums"
            onClick={() => scroll(-1)}
            className="rounded-full border p-2 transition-all duration-200 hover:bg-[var(--bg-secondary)] hover:scale-105 active:scale-95"
            style={{ borderColor: "var(--card-border)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Next albums"
            onClick={() => scroll(1)}
            className="rounded-full border p-2 transition-all duration-200 hover:bg-[var(--bg-secondary)] hover:scale-105 active:scale-95"
            style={{ borderColor: "var(--card-border)" }}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div
        ref={ref}
        tabIndex={0}
        className="music-carousel -mx-4 flex max-w-[100vw] snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 px-4 sm:-mx-6 sm:px-6 scroll-pl-4 sm:scroll-pl-6"
        style={{ scrollbarWidth: "none" }}
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <AlbumCardSkeleton key={i} index={i} />
          ))
        ) : albums.length > 0 ? (
          albums.map((album, idx) => (
            <motion.button
              key={`${album.name}-${album.artist}-${idx}`}
              onClick={() => handleCardClick(album.url)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
              className="group w-[68vw] max-w-[220px] shrink-0 snap-start text-left focus:outline-none focus-visible:ring-2"
              aria-label={`${album.name} by ${album.artist}${album.url ? " — click to view on Last.fm" : ""}`}
            >
              {/* Artwork */}
              <div
                className="relative aspect-square w-full overflow-hidden rounded-xl border transition-all duration-500 ease-out group-hover:scale-[1.03]"
                style={{
                  borderColor: "var(--card-border)",
                  boxShadow: "var(--card-shadow)",
                }}
              >
                <MusicArtwork
                  src={album.coverUrl}
                  alt={`${album.name} cover`}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
                />

                {/* Hover overlay with external link icon */}
                {album.url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl">
                    <div
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </div>
                  </div>
                )}

                {/* Rank badge */}
                <div
                  className="absolute top-2 left-2 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/90"
                  style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                >
                  #{idx + 1}
                </div>
              </div>

              {/* Meta */}
              <div className="mt-2.5">
                <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] transition-opacity duration-300 group-hover:opacity-80 flex items-center gap-1">
                  <Disc3 className="h-2.5 w-2.5 shrink-0" />
                  {album.plays.toLocaleString()} plays
                  {album.year ? <span className="opacity-60">· {album.year}</span> : null}
                </p>
                <h3
                  className="mt-0.5 truncate font-display text-sm font-bold transition-colors duration-200"
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  {album.name}
                </h3>
                <p className="truncate text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                  {album.artist}
                </p>
              </div>
            </motion.button>
          ))
        ) : (
          <div className="w-full">
            <div
              className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-[var(--text-secondary)]"
              style={{ borderColor: "var(--card-border)" }}
            >
              No albums found for this period.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
