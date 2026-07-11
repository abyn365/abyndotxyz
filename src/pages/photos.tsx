import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, Layers, X, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { PageFooter } from "../components/PageFooter";

interface Photo {
  id: string;
  url: string;
  description: string;
  aspectRatio: number;
  tags?: string[];
  createdAt: number;
  blurDataUrl?: string;
}

const loadedImages = new Set<string>();

function GalleryImage({
  photo,
  isMasonry,
}: {
  photo: Photo;
  isMasonry: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  // Synchronously check on client-side mount if this photo was already loaded
  const wasCachedRef = useRef(typeof window !== "undefined" && loadedImages.has(photo.url));

  const [loaded, setLoaded] = useState(() => {
    if (typeof window !== "undefined") {
      return loadedImages.has(photo.url);
    }
    return false;
  });

  // Track prop changes if the component is ever recycled with a new photo URL
  const lastUrlRef = useRef(photo.url);
  if (lastUrlRef.current !== photo.url) {
    lastUrlRef.current = photo.url;
    wasCachedRef.current = typeof window !== "undefined" && loadedImages.has(photo.url);
    setLoaded(typeof window !== "undefined" && loadedImages.has(photo.url));
  }

  useEffect(() => {
    // Check if the image completes loading in the browser cache (fallback)
    if (imgRef.current?.complete && !loaded) {
      loadedImages.add(photo.url);
      setLoaded(true);
    }
  }, [photo.url, loaded]);

  const showInstant = wasCachedRef.current;
  const isImageLoaded = loaded || showInstant;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={isMasonry ? { aspectRatio: photo.aspectRatio } : { height: "100%" }}
    >
      {/* Tiny Base64 Blur Placeholder */}
      {photo.blurDataUrl ? (
        <img
          src={photo.blurDataUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none filter blur-md scale-110 ${
            showInstant ? "" : "transition-opacity duration-700"
          } ${isImageLoaded ? "opacity-0" : "opacity-100"}`}
        />
      ) : (
        /* Skeleton Background Fallback */
        <div
          className={`absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse ${
            showInstant ? "" : "transition-opacity duration-700"
          } ${isImageLoaded ? "opacity-0" : "opacity-100"}`}
        />
      )}

      {/* Full-resolution Image */}
      <img
        ref={imgRef}
        src={photo.url}
        alt={photo.description || "Gallery Photo"}
        loading="lazy"
        onLoad={() => {
          loadedImages.add(photo.url);
          setLoaded(true);
        }}
        className={`w-full group-hover:scale-103 transition-transform duration-500 ${
          showInstant ? "" : "transition-opacity duration-500"
        } ${isMasonry ? "h-auto" : "h-full object-cover"} ${
          isImageLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={isMasonry ? { aspectRatio: photo.aspectRatio } : undefined}
      />
    </div>
  );
}



export default function PhotosPage({ photos: initialPhotos }: { photos?: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos || []);
  const [loading, setLoading] = useState(!initialPhotos);

  // Layout toggles
  const [isMasonry, setIsMasonry] = useState(true);

  // Filtering and searching states
  const [selectedTag, setSelectedTag] = useState("All");

  // Progressive loading states
  const [visibleCount, setVisibleCount] = useState(12);
  const [hasMore, setHasMore] = useState(true);

  // Zoom Viewer states
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  // Load layout setting on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem("photo-layout");
    if (savedLayout === "square") {
      setIsMasonry(false);
    }

    // Fetch photos from API if static props are empty
    if (!initialPhotos || initialPhotos.length === 0) {
      fetch("/api/photos")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPhotos(data.photos || []);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load photos:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [initialPhotos]);

  const handleToggleLayout = () => {
    const nextLayout = isMasonry ? "square" : "masonry";
    setIsMasonry(!isMasonry);
    localStorage.setItem("photo-layout", nextLayout);
  };

  // Get unique tags list across all photos
  const tagsList = ["All", ...Array.from(new Set(photos.flatMap((p) => p.tags || [])))];

  // Filter photos
  const filteredPhotos = photos.filter((photo) => {
    if (selectedTag === "All") return true;
    return photo.tags?.includes(selectedTag);
  });

  // Handle infinite scroll / progressive loading
  useEffect(() => {
    setHasMore(visibleCount < filteredPhotos.length);
  }, [visibleCount, filteredPhotos.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // If within 300px from bottom, load more
      if (docHeight - (scrollTop + windowHeight) < 300 && hasMore) {
        setVisibleCount((prev) => Math.min(prev + 12, filteredPhotos.length));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, filteredPhotos.length]);

  const displayedPhotos = filteredPhotos.slice(0, visibleCount);

  // Keyboard navigation for image zoom viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (zoomIndex === null) return;
      if (e.key === "Escape") setZoomIndex(null);
      if (e.key === "ArrowLeft") handlePrevZoom();
      if (e.key === "ArrowRight") handleNextZoom();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomIndex, filteredPhotos]);

  const handlePrevZoom = () => {
    setZoomIndex((prev) => {
      if (prev === null || prev === 0) return filteredPhotos.length - 1;
      return prev - 1;
    });
  };

  const handleNextZoom = () => {
    setZoomIndex((prev) => {
      if (prev === null || prev === filteredPhotos.length - 1) return 0;
      return prev + 1;
    });
  };

  return (
    <>
      <Head>
        <title>Gallery · abyn</title>
        <meta name="description" content="Personal photo gallery showcasing photography, design works, and captured moments." />
      </Head>

      <main className="relative min-h-screen pb-16">
        <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 lg:px-8">

          {/* Header & Controls */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
                Gallery
              </h1>
              <p className="max-w-md text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                A curated visual diary of captures, design snaps, and miscellaneous moments.
              </p>
            </div>

            {/* Layout Toggle Button */}
            <button
              onClick={handleToggleLayout}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] transition-all hover:bg-[var(--card-bg-mix)] hover:text-[var(--text-primary)] self-start sm:self-auto"
              title={isMasonry ? "Switch to Grid Layout" : "Switch to Masonry Layout"}
            >
              {isMasonry ? <Grid className="h-4.5 w-4.5" /> : <Layers className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Tags Filtering Ribbon */}
          {tagsList.length > 1 && (
            <div className="scrollbar-none mb-8 flex gap-1.5 overflow-x-auto pb-2">
              {tagsList.map((tag) => {
                const active = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      setVisibleCount(12); // Reset page count on filter change
                    }}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-[var(--accent)] text-[var(--accent-text)]"
                        : "border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-mix)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Photos Grid Container */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]"
                  style={{ height: n % 2 === 0 ? "280px" : "200px" }}
                />
              ))}
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center text-sm text-[var(--text-secondary)] italic">
              No photos found under this tag filter.
            </div>
          ) : (
            <div
              className={
                isMasonry
                  ? "columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-3"
                  : "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              }
            >
              {displayedPhotos.map((photo, index) => {
                // Find photo index in filtered list for zooming reference
                const filteredIndex = filteredPhotos.findIndex((p) => p.id === photo.id);

                return (
                  <motion.div
                    key={photo.id}
                    layout="position"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      default: { duration: 0.3, delay: (index % 6) * 0.05 },
                      layout: { duration: 0.3 }
                    }}
                    onClick={() => setZoomIndex(filteredIndex)}
                    className={`group relative mb-4 cursor-zoom-in overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] transition-all hover:shadow-[var(--card-shadow)] ${
                      isMasonry ? "inline-block w-full break-inside-avoid" : "aspect-square"
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label="Zoom photo"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setZoomIndex(filteredIndex);
                      }
                    }}
                  >
                    <div className="relative w-full h-full overflow-hidden">
                      <GalleryImage photo={photo} isMasonry={isMasonry} />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100">
                        {photo.description && (
                          <p className="text-xs text-white leading-relaxed line-clamp-3 font-medium">
                            {photo.description}
                          </p>
                        )}
                        {photo.tags && photo.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {photo.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Loading More Indicator */}
          {hasMore && !loading && (
            <div className="mt-8 text-center text-xs text-[var(--text-secondary)] animate-pulse">
              Scroll down to load more...
            </div>
          )}
        </div>

        <div className="mx-auto max-w-5xl px-4 mt-12 sm:px-6 lg:px-8">
          <PageFooter />
        </div>
      </main>

      {/* Lightbox / Zoom View Overlay */}
      <AnimatePresence>
        {zoomIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/98 p-4 backdrop-blur-md select-none"
            onClick={() => setZoomIndex(null)}
          >
            {/* Top Toolbar */}
            <div className="flex w-full items-center justify-between text-white/70 max-w-5xl">
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(filteredPhotos[zoomIndex].createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              <button
                onClick={() => setZoomIndex(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Main Lightbox Content */}
            <div className="relative flex flex-1 w-full items-center justify-center max-w-5xl my-4">
              {/* Previous Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevZoom();
                }}
                className="absolute left-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Central Zoomed Image */}
              <motion.div
                key={zoomIndex}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-h-[70vh] max-w-[85vw] overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filteredPhotos[zoomIndex].url}
                  alt={filteredPhotos[zoomIndex].description || "Zoomed Photo"}
                  className="max-h-[70vh] max-w-full object-contain pointer-events-none"
                />
              </motion.div>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextZoom();
                }}
                className="absolute right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Bottom Caption Info */}
            <div className="w-full max-w-3xl text-center pb-4 text-white/90 space-y-2" onClick={(e) => e.stopPropagation()}>
              {filteredPhotos[zoomIndex].description && (
                <p className="text-sm font-medium leading-relaxed">
                  {filteredPhotos[zoomIndex].description}
                </p>
              )}
              {filteredPhotos[zoomIndex].tags && filteredPhotos[zoomIndex].tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1">
                  {filteredPhotos[zoomIndex].tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-white/40 font-mono tracking-wider pt-1">
                {zoomIndex + 1} / {filteredPhotos.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export const getStaticProps = async () => {
  const { getPhotos } = require("../lib/photos");
  const photos = await getPhotos();
  return {
    props: {
      photos,
    },
    revalidate: 60,
  };
};
