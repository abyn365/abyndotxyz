import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Mic2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Loader2,
  ListMusic,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMusicPlayer } from "./MusicPlayerContext";
import MusicVisualizer from "./MusicVisualizer";
import MusicArtwork from "./MusicArtwork";
import { formatDuration } from "../../lib/music/metadata";

// ---------------------------------------------------------------------------
// Full Progress Bar (Used in Expanded State)
// ---------------------------------------------------------------------------
function ProgressBar() {
  const { duration, seek, accentColor } = useMusicPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [localProgressText, setLocalProgressText] = useState("0:00");
  
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const accent = accentColor.primary;
  const accentSecondary = accentColor.secondary;

  useEffect(() => {
    let frameId: number;
    const player = import("../../lib/music/audio-player").then(m => m.MusicAudioPlayer.getInstance());
    
    const updateLoop = async () => {
      const p = await player;
      if (!isDragging) {
        const currentTime = p.getTime();
        const pct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
        
        if (fillRef.current) fillRef.current.style.width = `${pct}%`;
        if (thumbRef.current) thumbRef.current.style.left = `${pct}%`;
        
        const newText = formatDuration(currentTime);
        if (newText !== localProgressText) {
          setLocalProgressText(newText);
        }
      }
      frameId = requestAnimationFrame(updateLoop);
    };
    
    frameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(frameId);
  }, [duration, isDragging, localProgressText]);

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
    <div className="relative flex items-center gap-2.5 w-full group/progress">
      <span className="font-mono text-[9px] tabular-nums text-[var(--text-secondary)] shrink-0 w-7 text-right select-none">
        {localProgressText}
      </span>

      <div className="relative flex-1 flex items-center h-3 cursor-pointer">
        {hoverPct !== null && hoverTime && (
          <div
            className="absolute -top-7 pointer-events-none z-10 px-1.5 py-0.5 rounded-md text-[9px] font-mono text-white/90 shadow-lg"
            style={{
              left: `${hoverPct}%`,
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(6px)",
            }}
          >
            {hoverTime}
          </div>
        )}

        <div
          ref={barRef}
          className="relative w-full rounded-full transition-all duration-150"
          style={{
            height: hoverPct !== null || isDragging ? "4px" : "2px",
            background: "rgba(255,255,255,0.08)",
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
          <div
            ref={fillRef}
            className="absolute inset-y-0 left-0 rounded-full transition-none"
            style={{
              width: "0%",
              background: `linear-gradient(90deg, ${accent}, ${accentSecondary})`,
            }}
          />

          <div
            ref={thumbRef}
            className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity duration-150"
            style={{
              left: "0%",
              transform: "translate(-50%, -50%)",
              background: "white",
              boxShadow: `0 0 0 2px ${accent}80, 0 1px 4px rgba(0,0,0,0.35)`,
            }}
          />
        </div>
      </div>

      <span className="font-mono text-[9px] tabular-nums text-[var(--text-secondary)] shrink-0 w-7 select-none">
        {formatDuration(duration)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact Progress Line (Used in Minimized State)
// ---------------------------------------------------------------------------
function CompactProgressLine() {
  const { duration, accentColor } = useMusicPlayer();
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;
    const player = import("../../lib/music/audio-player").then(m => m.MusicAudioPlayer.getInstance());

    const updateLoop = async () => {
      const p = await player;
      const currentTime = p.getTime();
      const pct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
      if (fillRef.current) {
        fillRef.current.style.width = `${pct}%`;
      }
      frameId = requestAnimationFrame(updateLoop);
    };

    frameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(frameId);
  }, [duration]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden rounded-b-xl pointer-events-none">
      <div
        ref={fillRef}
        className="h-full"
        style={{
          width: "0%",
          background: `linear-gradient(90deg, ${accentColor.primary}, ${accentColor.secondary})`,
        }}
      />
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
        className="rounded-full p-1.5 transition-all duration-200 hover:bg-white/5"
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
          className="w-[60px] cursor-pointer appearance-none h-1 rounded-full outline-none bg-white/10"
          aria-label="Volume"
          style={{
            background: `linear-gradient(to right, ${accentColor.primary} ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.08) ${(isMuted ? 0 : volume) * 100}%)`,
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
    pause,
    resume,
    next,
    prev,
    toggleLyrics,
    dismiss,
    error,
    queue,
    queueIndex,
    accentColor,
    syncMode,
    resetToListeningAlong,
    spotifyData,
    isQueueOpen,
    toggleQueue,
  } = useMusicPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!playerRef.current) return;
      const footer = document.querySelector("footer");
      if (!footer) {
        playerRef.current.style.bottom = "1rem";
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (footerRect.top < viewportHeight) {
        const visibleFooterHeight = viewportHeight - footerRect.top;
        playerRef.current.style.bottom = `${visibleFooterHeight + 16}px`;
      } else {
        playerRef.current.style.bottom = "1rem";
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    handleScroll();
    const timer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timer);
    };
  }, [currentTrack]);

  if (!currentTrack) return null;

  const trackKey = `${currentTrack.title}::${currentTrack.artist}`;
  const hasNext = queueIndex < queue.length - 1;
  const hasPrev = queueIndex > 0;
  const accent = accentColor.primary;

  const expanded = isExpanded || isHovered;

  return (
    <AnimatePresence>
      <motion.div
        ref={playerRef}
        key="player-bar"
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 260 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-4 left-0 right-0 mx-auto z-50 overflow-hidden rounded-xl border"
        style={{
          width: "calc(100% - 2rem)",
          maxWidth: expanded ? "440px" : "320px",
          background: "rgba(10, 10, 15, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: `color-mix(in srgb, ${accent} 25%, rgba(255, 255, 255, 0.08))`,
          boxShadow: `0 12px 32px rgba(0,0,0,0.45), 0 0 1px color-mix(in srgb, ${accent} 30%, transparent)`,
          transition: "max-width 300ms cubic-bezier(0.25, 0.8, 0.25, 1), border-color 600ms ease, box-shadow 600ms ease, bottom 250ms cubic-bezier(0.16, 1, 0.3, 1)",
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
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-3 py-1 text-center">
            <p className="text-[10px] text-rose-400 truncate">{error}</p>
          </div>
        )}

        <div className="p-3">
          {/* Main info row (Always visible) */}
          <div className="flex items-center gap-2.5">
            {/* Cover Art */}
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative shrink-0 cursor-pointer group/art"
            >
              <motion.div
                animate={{ scale: isPlaying ? 1.02 : 0.98 }}
                className="h-10 w-10 rounded-lg overflow-hidden shadow-md relative"
              >
                <MusicArtwork
                  src={currentTrack.cover}
                  canvasUrl={currentTrack.canvasUrl}
                  alt={currentTrack.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>

            {/* Track Info */}
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className="min-w-0 flex-1 cursor-pointer select-none"
            >
              <p className="truncate text-xs font-bold text-[var(--text-primary)] leading-snug">
                {currentTrack.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="truncate text-[10px] text-[var(--text-secondary)] leading-none">
                  {currentTrack.artist}
                </p>
                {isPlaying && (
                  <div className="w-8 h-3 flex items-center shrink-0 opacity-70 ml-1">
                    <MusicVisualizer isPlaying={isPlaying} trackId={trackKey} type="wave" height={10} />
                  </div>
                )}
              </div>
            </div>

            {/* Actions area */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Lyrics button */}
              <button
                onClick={toggleLyrics}
                className="rounded-full p-1.5 transition-colors hover:bg-white/5"
                style={{
                  color: isLyricsOpen ? accent : "var(--text-secondary)",
                }}
                aria-label="Lyrics"
                title="Lyrics"
              >
                <Mic2 className="h-3.5 w-3.5" />
              </button>

              {/* Show controls button (if collapsed) */}
              {!expanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="rounded-full p-1.5 transition-colors hover:bg-white/5 text-[var(--text-secondary)]"
                  aria-label="Expand"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Dismiss close button (if collapsed) */}
              {!expanded && (
                <button
                  onClick={dismiss}
                  className="rounded-full p-1.5 transition-colors hover:bg-white/5 text-[var(--text-secondary)]"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Expanded controls drawer */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                  {/* Row 2: Playback Controls + Sync Actions + Volume */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={prev}
                        disabled={!hasPrev}
                        className="rounded-full p-1.5 transition-all duration-150 hover:bg-white/5 disabled:opacity-25 active:scale-95"
                        aria-label="Previous"
                      >
                        <SkipBack className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                      </button>

                      <motion.button
                        onClick={isPlaying ? pause : resume}
                        className="flex h-8 w-8 items-center justify-center rounded-full mx-1 transition-all duration-150 active:scale-95"
                        style={{
                          background: `linear-gradient(135deg, ${accent}, ${accentColor.secondary})`,
                          boxShadow: isPlaying
                            ? `0 0 10px ${accentColor.glow}, 0 1px 4px rgba(0,0,0,0.3)`
                            : "0 1px 4px rgba(0,0,0,0.2)",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        <AnimatePresence mode="wait">
                          {isLoading ? (
                            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <Loader2 className="h-3 w-3 text-white animate-spin" />
                            </motion.span>
                          ) : isPlaying ? (
                            <motion.span key="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <Pause className="h-3 w-3 text-white fill-white" />
                            </motion.span>
                          ) : (
                            <motion.span key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      <button
                        onClick={() => next()}
                        disabled={!hasNext}
                        className="rounded-full p-1.5 transition-all duration-150 hover:bg-white/5 disabled:opacity-25 active:scale-95"
                        aria-label="Next"
                      >
                        <SkipForward className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                      </button>
                    </div>

                    {/* Sync badge */}
                    <div className="flex-1 flex justify-center text-center">
                      {syncMode === "listening-along" ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-wider text-emerald-400 font-semibold select-none">
                          <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                          Live Sync
                        </span>
                      ) : spotifyData?.isPlaying ? (
                        <button
                          onClick={resetToListeningAlong}
                          className="inline-flex items-center text-[8px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-white/5 rounded-full px-2 py-0.2 hover:border-emerald-500/30"
                        >
                          Sync Live
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                      <VolumeControl />

                      <button
                        onClick={toggleQueue}
                        className="rounded-full p-1.5 transition-colors hover:bg-white/5"
                        style={{ color: isQueueOpen ? accent : "var(--text-secondary)" }}
                        aria-label="Queue"
                      >
                        <ListMusic className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setIsExpanded(false)}
                        className="rounded-full p-1.5 transition-colors hover:bg-white/5 text-[var(--text-secondary)]"
                        aria-label="Minimize"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={dismiss}
                        className="rounded-full p-1.5 transition-colors hover:bg-white/5 text-[var(--text-secondary)]"
                        aria-label="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row 3: Progress Slider */}
                  <div className="pt-1">
                    <ProgressBar />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom border progress line (Visible when collapsed) */}
        <AnimatePresence>
          {!expanded && <CompactProgressLine />}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
