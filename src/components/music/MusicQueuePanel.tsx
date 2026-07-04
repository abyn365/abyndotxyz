import { AnimatePresence, motion } from "framer-motion";
import { X, Play, Disc3, ListMusic } from "lucide-react";
import { useMusicPlayer } from "./MusicPlayerContext";
import MusicArtwork from "./MusicArtwork";
import MusicVisualizer from "./MusicVisualizer";
import { useEffect, useRef } from "react";

export default function MusicQueuePanel() {
  const {
    isQueueOpen,
    setQueueOpen,
    queue,
    queueIndex,
    currentTrack,
    isPlaying,
    playFromQueue,
    accentColor,
  } = useMusicPlayer();

  const panelRef = useRef<HTMLDivElement>(null);
  const accent = accentColor.primary;
  const isVisible = isQueueOpen && !!currentTrack;

  // Close on outside clicks (desktop popover mode)
  useEffect(() => {
    if (!isVisible) return;
    const handleOutsideClick = (e: MouseEvent) => {
      // Don't close if clicking the toggle button in the player bar
      const target = e.target as HTMLElement;
      if (target.closest("[aria-label='Toggle queue']")) return;
      
      if (panelRef.current && !panelRef.current.contains(target)) {
        setQueueOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isVisible, setQueueOpen]);

  const upcoming = queue.slice(queueIndex + 1);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={panelRef}
          key="queue-panel"
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          transition={{ type: "spring", damping: 25, stiffness: 240 }}
          className="fixed z-[70] flex flex-col overflow-hidden rounded-2xl border shadow-2xl
                     bottom-0 left-0 right-0 h-[65vh] w-full
                     sm:bottom-[88px] sm:right-6 sm:left-auto sm:w-[380px] sm:h-[480px]"
          style={{
            background: "color-mix(in srgb, var(--card-bg) 92%, transparent)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            borderColor: `color-mix(in srgb, ${accent} 25%, var(--card-border))`,
            boxShadow: `0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px color-mix(in srgb, ${accent} 10%, transparent)`,
          }}
        >
          {/* Header */}
          <header
            className="flex h-14 shrink-0 items-center justify-between px-4 border-b"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center gap-2">
              <ListMusic className="h-4 w-4" style={{ color: accent }} />
              <span className="font-display text-sm font-bold text-[var(--text-primary)]">
                Play Queue
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border text-[var(--text-secondary)]">
                {queue.length} track{queue.length !== 1 ? "s" : ""}
              </span>
            </div>

            <button
              onClick={() => setQueueOpen(false)}
              className="rounded-full border p-1.5 transition-all hover:bg-[var(--bg-secondary)] active:scale-95 text-[var(--text-secondary)]"
              style={{ borderColor: "var(--card-border)" }}
              aria-label="Close queue"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </header>

          {/* Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5" style={{ scrollbarWidth: "none" }}>
            {/* Now Playing Item */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-2 font-bold">
                Now Playing
              </p>
              <div
                className="flex items-center gap-3 p-2.5 rounded-xl border relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: `color-mix(in srgb, ${accent} 20%, var(--card-border))`,
                }}
              >
                {/* Dynamic accent background glow */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-5 z-0"
                  style={{
                    background: `radial-gradient(circle at 10% 50%, ${accent}, transparent 60%)`,
                  }}
                />

                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border z-10" style={{ borderColor: "var(--card-border)" }}>
                  <MusicArtwork src={currentTrack.cover} alt={currentTrack.title} className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0 flex-1 z-10">
                  <p className="truncate text-xs font-bold text-[var(--text-primary)] leading-normal">
                    {currentTrack.title}
                  </p>
                  <p className="truncate text-[10px] text-[var(--text-secondary)] mt-0.5 font-medium">
                    {currentTrack.artist}
                  </p>
                </div>

                <div className="w-8 h-3.5 flex items-center shrink-0 z-10 opacity-90 mr-1">
                  <MusicVisualizer isPlaying={isPlaying} trackId={currentTrack.title} barCount={6} height={10} />
                </div>
              </div>
            </div>

            {/* Next Up List */}
            <div className="flex-1 flex flex-col min-h-0">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-2 font-bold">
                Next Up
              </p>

              {upcoming.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center select-none opacity-40">
                  <Disc3 className="h-8 w-8 animate-spin-slow mb-2 text-[var(--text-secondary)]" />
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Queue is empty</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 pb-6">
                  {upcoming.map((track, i) => {
                    const actualIdx = queueIndex + 1 + i;
                    return (
                      <button
                        key={`${track.songUrl || track.title}-${actualIdx}`}
                        onClick={() => playFromQueue(actualIdx)}
                        className="group flex items-center gap-3 p-2 rounded-xl text-left transition-all hover:bg-white/5 active:scale-[0.99] border border-transparent hover:border-[var(--card-border)]"
                      >
                        {/* Artwork with play hover overlay */}
                        <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 border relative bg-white/5" style={{ borderColor: "var(--card-border)" }}>
                          <MusicArtwork src={track.cover} alt={track.title} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Track Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                            {track.title}
                          </p>
                          <p className="truncate text-[10px] text-[var(--text-secondary)] mt-0.5 font-medium leading-none">
                            {track.artist}
                          </p>
                        </div>

                        {/* Track Number / Index */}
                        <span className="font-mono text-[9px] text-[var(--text-secondary)] opacity-35 px-1 shrink-0">
                          #{actualIdx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
