/**
 * components/music/MusicPlayerBar.tsx
 * Fixed bottom player bar — premium Spotify-style.
 * Features: dynamic accent colors, spinning artwork, crossfade transitions,
 * accent-themed progress bar, glassmorphism, micro-animations.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Mic2,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Loader2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useMusicPlayer } from "./MusicPlayerContext";
import MusicVisualizer from "./MusicVisualizer";
import MusicArtwork from "./MusicArtwork";
import { formatDuration } from "../../lib/music/metadata";

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------
function ProgressBar() {
  const { progress, duration, seek, accentColor, isPlaying } = useMusicPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const pct = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;

  const accent = accentColor.primary;
  const accentSecondary = accentColor.secondary;

  const getPositionFromEvent = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!barRef.current) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const clientX =
        "touches" in e
          ? e.touches[0]?.clientX ?? rect.left
          : (e as React.MouseEvent).clientX;
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    []
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const ratio = getPositionFromEvent(e);
      seek(ratio * duration);
      setIsDragging(false);
    },
    [getPositionFromEvent, seek, duration]
  );

  return (
    <div className="relative flex items-center gap-3 w-full group/progress">
      <span className="font-mono text-[10px] tabular-nums text-[var(--text-secondary)] shrink-0 w-8 text-right">
        {formatDuration(progress)}
      </span>

      <div className="relative flex-1 flex items-center h-4 cursor-pointer">
        {/* Hover time tooltip */}
        {hoverPct !== null && hoverTime && (
          <div
            className="absolute -top-7 pointer-events-none z-10 px-2 py-0.5 rounded-md text-[10px] font-mono text-white/90 shadow-lg"
            style={{
              left: `${hoverPct}%`,
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
            }}
          >
            {hoverTime}
          </div>
        )}

        <div
          ref={barRef}
          className="relative w-full rounded-full transition-all duration-150"
          style={{
            height: hoverPct !== null || isDragging ? "5px" : "3px",
            background: "var(--card-border)",
          }}
          onMouseMove={(e) => {
            const ratio = getPositionFromEvent(e);
            setHoverPct(ratio * 100);
            setHoverTime(formatDuration(ratio * duration));
          }}
          onMouseLeave={() => {
            setHoverPct(null);
            setHoverTime(null);
          }}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleSeek(e);
          }}
          onMouseUp={() => setIsDragging(false)}
          onClick={handleSeek}
        >
          {/* Filled track */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-none"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent}, ${accentSecondary})`,
            }}
          />

          {/* Hover preview */}
          {hoverPct !== null && (
            <div
              className="absolute inset-y-0 left-0 rounded-full opacity-20"
              style={{
                width: `${hoverPct}%`,
                background: `linear-gradient(90deg, ${accent}, ${accentSecondary})`,
              }}
            />
          )}

          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity duration-150"
            style={{
              left: `${pct}%`,
              transform: "translate(-50%, -50%)",
              background: "white",
              boxShadow: `0 0 0 2.5px ${accent}80, 0 2px 6px rgba(0,0,0,0.35)`,
            }}
          />
        </div>
      </div>

      <span className="font-mono text-[10px] tabular-nums text-[var(--text-secondary)] shrink-0 w-8">
        {formatDuration(duration)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Volume Control
// ---------------------------------------------------------------------------
function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute, accentColor } = useMusicPlayer();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={toggleMute}
        className="rounded-full p-1.5 transition-all duration-200 hover:bg-[var(--bg-secondary)]"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
        ) : (
          <Volume2 className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
        )}
      </button>

      <div
        className="overflow-hidden transition-all duration-250 ease-out"
        style={{ width: isHovered ? "60px" : "0px", opacity: isHovered ? 1 : 0 }}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-[60px] cursor-pointer appearance-none h-1 rounded-full outline-none"
          aria-label="Volume"
          style={{
            background: `linear-gradient(to right, ${accentColor.primary} ${(isMuted ? 0 : volume) * 100}%, var(--card-border) ${(isMuted ? 0 : volume) * 100}%)`,
            accentColor: accentColor.primary,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Player Bar
// ---------------------------------------------------------------------------
export default function MusicPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    isLyricsOpen,
    isMinimized,
    pause,
    resume,
    next,
    prev,
    toggleLyrics,
    setMinimized,
    dismiss,
    error,
    queue,
    queueIndex,
    accentColor,
    syncMode,
    resetToListeningAlong,
    spotifyData,
  } = useMusicPlayer();

  if (!currentTrack) return null;

  const trackKey = `${currentTrack.title}::${currentTrack.artist}`;
  const hasNext = queueIndex < queue.length - 1;
  const hasPrev = queueIndex > 0;
  const accent = accentColor.primary;

  return (
    <AnimatePresence>
      <motion.div
        key="player-bar"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "color-mix(in srgb, var(--card-bg) 88%, transparent)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderTop: `1px solid color-mix(in srgb, ${accent} 20%, var(--card-border))`,
          boxShadow: `0 -12px 40px rgba(0,0,0,0.25), 0 -1px 0 color-mix(in srgb, ${accent} 15%, transparent)`,
          transition: "border-top-color 600ms ease, box-shadow 600ms ease",
        }}
      >
        {/* Subtle accent glow overlay at the top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
            transition: "background 600ms ease",
          }}
        />

        {/* Error banner */}
        {error && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-1.5 text-center">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}



        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Three-column layout */}
          <div className="flex items-center gap-2 py-2.5">

            {/* ── LEFT: Album art + track info ── */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Cover Art */}
              <div className="relative shrink-0">
                <motion.div
                  key={currentTrack.cover || "placeholder"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: isPlaying ? 1.05 : 0.95,
                    y: isPlaying ? -2 : 0,
                  }}
                  transition={{ type: "spring", damping: 15, stiffness: 120 }}
                  className="h-12 w-12 rounded-xl overflow-hidden shadow-lg relative"
                  style={{
                    boxShadow: isPlaying
                      ? "0 10px 25px -5px var(--music-glow), 0 8px 10px -6px var(--music-glow)"
                      : "0 2px 8px rgba(0,0,0,0.15)",
                    transition: "box-shadow 600ms ease",
                  }}
                >
                  <MusicArtwork
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </div>

              {/* Track info */}
              <div className="min-w-0 flex-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTrack.title}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="truncate text-sm font-bold text-[var(--text-primary)] leading-tight"
                  >
                    {currentTrack.title}
                  </motion.p>
                </AnimatePresence>
                <p className="truncate text-xs text-[var(--text-secondary)] mt-0.5 leading-tight">
                  {currentTrack.artist}
                  {currentTrack.album ? (
                    <span className="opacity-60"> · {currentTrack.album}</span>
                  ) : null}
                </p>
                {/* Sync Mode indicator badge */}
                <div className="flex items-center gap-1.5 mt-1">
                  {syncMode === "listening-along" ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-semibold select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Sync
                    </span>
                  ) : spotifyData?.isPlaying ? (
                    <button
                      onClick={resetToListeningAlong}
                      className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--card-border)] rounded-full px-2.5 py-0.5 hover:border-emerald-500/30"
                    >
                      Sync Live
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ── CENTER: Playback controls ── */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={prev}
                disabled={!hasPrev}
                className="rounded-full p-2 transition-all duration-150 hover:bg-[var(--bg-secondary)] disabled:opacity-25 active:scale-95"
                aria-label="Previous"
              >
                <SkipBack className="h-4 w-4 text-[var(--text-primary)]" />
              </button>

              {/* Play / Pause — main button with accent glow */}
              <motion.button
                onClick={isPlaying ? pause : resume}
                className="flex h-10 w-10 items-center justify-center rounded-full mx-1 transition-all duration-150 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accentColor.secondary})`,
                  boxShadow: isPlaying
                    ? `0 0 20px ${accentColor.glow}, 0 2px 8px rgba(0,0,0,0.3)`
                    : "0 2px 8px rgba(0,0,0,0.2)",
                  transition: "background 600ms ease, box-shadow 600ms ease",
                }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </motion.span>
                  ) : isPlaying ? (
                    <motion.span
                      key="pause"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.12 }}
                    >
                      <Pause className="h-4 w-4 text-white fill-white" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="play"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.12 }}
                    >
                      <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <button
                onClick={next}
                disabled={!hasNext}
                className="rounded-full p-2 transition-all duration-150 hover:bg-[var(--bg-secondary)] disabled:opacity-25 active:scale-95"
                aria-label="Next"
              >
                <SkipForward className="h-4 w-4 text-[var(--text-primary)]" />
              </button>
            </div>

            {/* ── RIGHT: Secondary controls ── */}
            <div className="flex items-center gap-0.5 shrink-0">
              <VolumeControl />

              <button
                onClick={toggleLyrics}
                className="rounded-full p-2 transition-all duration-200 hover:bg-[var(--bg-secondary)]"
                style={{
                  color: isLyricsOpen ? accent : "var(--text-secondary)",
                  transition: "color 300ms ease",
                }}
                aria-label="Toggle lyrics"
                title="Lyrics (L)"
              >
                <Mic2 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setMinimized(!isMinimized)}
                className="rounded-full p-2 transition-colors hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                aria-label={isMinimized ? "Expand player" : "Minimize player"}
              >
                {isMinimized ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={dismiss}
                className="rounded-full p-2 transition-colors hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                aria-label="Close player"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar (hidden when minimized) */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="pb-2.5"
              >
                <ProgressBar />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard shortcut hints */}
        <div className="hidden lg:flex justify-center pb-1.5 gap-6">
          {[
            ["Space", "Play/Pause"],
            ["Shift+←/→", "Seek ±10s"],
            ["M", "Mute"],
            ["L", "Lyrics"],
            ["/?", "Keyboard shortcuts"],
          ].map(([key, label]) => (
            <span key={key} className="text-[9px] text-[var(--text-secondary)] opacity-35 font-mono">
              <kbd className="font-bold">{key}</kbd> {label}
            </span>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
