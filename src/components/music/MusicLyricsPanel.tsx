/**
 * components/music/MusicLyricsPanel.tsx
 * Apple Music / Spotify-style synchronized immersive lyrics overlay.
 * Slides up from the bottom to cover the viewport on toggle.
 * Integrates artwork, details, controls, and scrolling lyrics natively.
 * Fits perfectly inside the viewport on all screen resolutions without overflow.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Mic2,
  Disc3,
  Shuffle,
  Repeat,
  Volume1,
  Volume2,
  VolumeX,
  ListMusic,
} from "lucide-react";
import { useEffect, useRef, useCallback, useState } from "react";
import { FaSpotify } from "react-icons/fa";
import { useMusicPlayer } from "./MusicPlayerContext";
import { formatDuration } from "../../lib/music/metadata";
import MusicArtwork from "./MusicArtwork";
import MusicVisualizer from "./MusicVisualizer";

export default function MusicLyricsPanel() {
  const {
    isLyricsOpen,
    isMinimized,
    currentTrack,
    lyrics,
    activeLyricIndex,
    hasTimestamps,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    syncMode,
    toggleLyrics,
    seek,
    pause,
    resume,
    next,
    prev,
    setVolume,
    toggleMute,
    resetToListeningAlong,
    spotifyData,
    plainLyrics,
    lyricsState,
    accentColor,
    isQueueOpen,
    toggleQueue,
  } = useMusicPlayer();

  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledIndex = useRef<number>(-1);

  // Local Shuffle & Repeat states (visual toggles)
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Mobile Volume Slider auto-hide state and timer
  const [showVolume, setShowVolume] = useState(false);
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerVolumeActive = useCallback(() => {
    setShowVolume(true);
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = setTimeout(() => {
      setShowVolume(false);
    }, 3500); // hide after 3.5 seconds of inactivity
  }, []);

  useEffect(() => {
    return () => {
      if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    };
  }, []);

  // Smooth scroll to active lyric
  const scrollToActive = useCallback(() => {
    if (!activeLineRef.current || !lyricsContainerRef.current) return;
    if (activeLyricIndex === lastScrolledIndex.current) return;
    lastScrolledIndex.current = activeLyricIndex;

    const activeEl = activeLineRef.current;
    const container = lyricsContainerRef.current;

    const activeTop = activeEl.offsetTop;
    const activeHeight = activeEl.clientHeight;
    const containerHeight = container.clientHeight;
    const targetScrollTop = activeTop - (containerHeight / 2) + (activeHeight / 2);

    container.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }, [activeLyricIndex]);

  useEffect(() => {
    if (isLyricsOpen && !isMinimized) {
      requestAnimationFrame(scrollToActive);
    }
  }, [activeLyricIndex, isLyricsOpen, isMinimized, scrollToActive]);

  const isVisible = isLyricsOpen && !isMinimized && !!currentTrack;
  const accent = accentColor.primary;
  const accentGlow = accentColor.glow;

  const pct = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;
  const volPct = isMuted ? 0 : volume * 100;

  // Speaker icon indicator
  const SpeakerIcon = isMuted || volume === 0
    ? VolumeX
    : volume < 0.5
    ? Volume1
    : Volume2;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="lyrics-immersive-overlay"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 220 }}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden h-screen w-screen"
          style={{
            background: "var(--bg-primary)",
          }}
        >
          {/* Ambient blurred album art backdrop */}
          {currentTrack.cover && (
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-15 dark:opacity-10"
              style={{
                backgroundImage: `url(${currentTrack.cover})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(130px) saturate(2)",
                transform: "scale(1.1)",
              }}
            />
          )}

          {/* ── MOBILE / COMPACT SCREEN HEADER (Hidden on LG) ── */}
          <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-4 border-b lg:hidden" style={{ borderColor: "var(--card-border)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                className="h-9 w-9 rounded-lg object-cover border"
                style={{ borderColor: "var(--card-border)" }}
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                  {currentTrack.title}
                </p>
                <p className="truncate text-[10px] text-[var(--text-secondary)] font-medium">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleLyrics}
              className="rounded-full border p-1.5 transition-all hover:bg-[var(--bg-secondary)] active:scale-95"
              style={{ borderColor: "var(--card-border)" }}
              aria-label="Close details"
            >
              <X className="h-4 w-4 text-[var(--text-primary)]" />
            </button>
          </header>

          {/* ── DESKTOP ONLY HEADER (Hidden on Mobile) ── */}
          <header className="relative z-10 hidden lg:flex h-16 shrink-0 items-center justify-between px-6 border-b" style={{ borderColor: "var(--card-border)" }}>
            <div className="flex items-center gap-2">
              <Mic2 className="h-4 w-4 text-[var(--text-secondary)]" style={{ color: accent }} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
                Now Playing
              </span>
            </div>
            
            <button
              onClick={toggleLyrics}
              className="rounded-full border p-2 transition-all hover:bg-[var(--bg-secondary)] hover:scale-105 active:scale-95"
              style={{ borderColor: "var(--card-border)" }}
              aria-label="Close details"
            >
              <X className="h-4 w-4 text-[var(--text-primary)]" />
            </button>
          </header>

          {/* ── Main Viewport Content ── */}
          <div className="relative z-10 flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-16 w-full max-w-6xl mx-auto px-4 lg:px-6 py-4 lg:py-6 overflow-hidden min-h-0" style={{ paddingBottom: 0 }}>
            
            {/* ── LEFT COLUMN (Desktop): Large Art & Controls (lg:col-span-5) ── */}
            <div
              className="hidden lg:flex lg:col-span-5 flex-col items-stretch justify-start py-2 select-none w-full max-w-sm mx-auto overflow-y-auto max-h-full scrollbar-none"
              style={{ scrollbarWidth: "none" }}
            >
              
              {/* Large Cover Art with dynamic glow */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ 
                  opacity: 1, 
                  scale: isPlaying ? 1.02 : 0.98,
                  y: isPlaying ? -3 : 0
                }}
                transition={{ type: "spring", damping: 18, stiffness: 100 }}
                className="aspect-square w-full max-w-[260px] max-h-[260px] mx-auto rounded-3xl overflow-hidden shadow-2xl relative border"
                style={{ 
                  borderColor: "var(--card-border)",
                  boxShadow: isPlaying 
                    ? `0 20px 50px -10px ${accentGlow}, 0 16px 30px -15px ${accentGlow}`
                    : "0 8px 24px rgba(0,0,0,0.18)"
                }}
              >
                <MusicArtwork
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              {/* Title / Artist details */}
              <div className="mt-5 min-w-0">
                <h2 className="truncate font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {currentTrack.title}
                </h2>
                <p className="truncate text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-semibold">
                  {currentTrack.artist}
                  {currentTrack.album ? <span className="opacity-60"> · {currentTrack.album}</span> : null}
                </p>
              </div>

              {/* Audio Visualizer */}
              <div className="mt-5 w-full h-8 flex items-center justify-center opacity-85">
                <MusicVisualizer isPlaying={isPlaying} trackId={currentTrack.title} barCount={28} height={28} />
              </div>

              {/* Progress Slider */}
              <div className="mt-4 w-full flex flex-col gap-2">
                <div className="relative w-full h-1 bg-[var(--card-border)] rounded-full overflow-hidden cursor-pointer"
                     onClick={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const ratio = (e.clientX - rect.left) / rect.width;
                       seek(ratio * duration);
                     }}>
                  <div 
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${accent}, ${accentColor.secondary})`
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between font-mono text-[9px] text-[var(--text-secondary)]">
                  <span>{formatDuration(progress)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              {/* Control Buttons (Shuffle, Prev, Play, Next, Repeat) */}
              <div className="mt-3 flex items-center justify-between px-2 gap-2">
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className="rounded-full p-2 transition-all hover:bg-[var(--bg-secondary)] active:scale-95 text-[var(--text-secondary)]"
                  style={{ color: isShuffle ? accent : undefined }}
                  aria-label="Toggle shuffle"
                >
                  <Shuffle className="h-4.5 w-4.5" />
                </button>

                <button
                  onClick={prev}
                  className="rounded-full border p-2.5 transition-all hover:bg-[var(--bg-secondary)] active:scale-95"
                  style={{ borderColor: "var(--card-border)" }}
                  aria-label="Previous track"
                >
                  <SkipBack className="h-4 w-4 text-[var(--text-primary)]" />
                </button>

                <button
                  onClick={isPlaying ? pause : resume}
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accentColor.secondary})`,
                  }}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-white text-white" />
                  ) : (
                    <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={next}
                  className="rounded-full border p-2.5 transition-all hover:bg-[var(--bg-secondary)] active:scale-95"
                  style={{ borderColor: "var(--card-border)" }}
                  aria-label="Next track"
                >
                  <SkipForward className="h-4 w-4 text-[var(--text-primary)]" />
                </button>

                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className="rounded-full p-2 transition-all hover:bg-[var(--bg-secondary)] active:scale-95 text-[var(--text-secondary)]"
                  style={{ color: isRepeat ? accent : undefined }}
                  aria-label="Toggle repeat"
                >
                  <Repeat className="h-4.5 w-4.5" />
                </button>

                <button
                  onClick={toggleQueue}
                  className="rounded-full p-2 transition-all hover:bg-[var(--bg-secondary)] active:scale-95 text-[var(--text-secondary)]"
                  style={{ color: isQueueOpen ? accent : undefined }}
                  aria-label="Toggle queue"
                  title="Queue"
                >
                  <ListMusic className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Volume Control and Action Links Row (Combined & Hover-simplified) */}
              <div className="mt-5 flex items-center justify-between border-t pt-4 px-1 h-12" style={{ borderColor: "var(--card-border)" }}>
                {/* Left: Volume speaker icon and hover slider */}
                <div className="flex items-center gap-2 group/volume relative h-8">
                  <button
                    onClick={toggleMute}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    <SpeakerIcon className="h-4 w-4" />
                  </button>
                  <div
                    className="h-5 flex items-center w-0 group-hover/volume:w-28 overflow-hidden transition-all duration-300 ease-out"
                  >
                    <div
                      className="w-24 h-1 bg-[var(--card-border)] rounded-full relative cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const ratio = (e.clientX - rect.left) / rect.width;
                        setVolume(ratio);
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${volPct}%`,
                          background: `linear-gradient(90deg, ${accent}, ${accentColor.secondary})`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Open Source Link & Live Sync Status */}
                <div className="flex items-center gap-3">
                  {currentTrack.songUrl ? (
                    (() => {
                      const isSpotify = currentTrack.songUrl.includes("spotify.com");
                      const isLastFm = currentTrack.songUrl.includes("last.fm");
                      const linkText = isSpotify ? "Spotify" : isLastFm ? "Last.fm" : "Source";
                      return (
                        <a
                          href={currentTrack.songUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--card-border)] px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-widest text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-500/20 transition-all active:scale-95 bg-white/5"
                        >
                          {isSpotify ? (
                            <FaSpotify className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Disc3 className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0" />
                          )}
                          {linkText}
                        </a>
                      );
                    })()
                  ) : null}

                  {syncMode === "listening-along" ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-semibold select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Sync
                    </span>
                  ) : spotifyData?.isPlaying ? (
                    <button
                      onClick={resetToListeningAlong}
                      className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--card-border)] rounded-full px-2.5 py-1 hover:border-emerald-500/25 bg-white/5 active:scale-95"
                    >
                      Sync Live
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ── MIDDLE / LYRICS SCROLL AREA (lg:col-span-7) ── */}
            <div className="flex-1 lg:col-span-7 flex flex-col h-full overflow-hidden min-h-0 w-full">
              <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-8 mask-linear-fade relative"
                style={{ scrollbarWidth: "none" }}
              >
                {lyricsState === "loading" ? (
                  <div className="flex h-full items-center justify-center text-center py-20">
                    <div>
                      <Disc3 className="mx-auto mb-4 h-12 w-12 text-[var(--text-secondary)] opacity-35 animate-spin-slow" style={{ color: accent }} />
                      <p className="text-base font-semibold text-[var(--text-secondary)]">
                        Looking for lyrics...
                      </p>
                      <p className="mt-1.5 text-xs text-[var(--text-secondary)] opacity-50">
                        {currentTrack.title} · {currentTrack.artist}
                      </p>
                    </div>
                  </div>
                ) : lyricsState === "loaded" && hasTimestamps ? (
                  <div className="flex flex-col gap-3 pb-32 pt-16">
                    {lyrics.map((line, idx) => {
                      const isActive = idx === activeLyricIndex;
                      const isPast = idx < activeLyricIndex;
                      const isFuture = idx > activeLyricIndex;
                      const isNearActive = Math.abs(idx - activeLyricIndex) <= 2;

                      return (
                        <button
                          key={line.id}
                          ref={isActive ? activeLineRef : null}
                          onClick={() => seek(line.startMs / 1000)}
                          className="w-full text-left font-display text-lg sm:text-xl lg:text-2xl font-bold leading-relaxed px-4 py-2 transition-all duration-500 ease-out select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
                          style={{
                            color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                            opacity: isActive
                              ? 1
                              : isPast
                              ? isNearActive ? 0.35 : 0.18
                              : isFuture
                              ? isNearActive ? 0.55 : 0.35
                              : 0.35,
                            filter: isActive ? "none" : `blur(${isNearActive ? 0 : 0.6}px)`,
                            background: isActive ? "rgba(255,255,255,0.03)" : "transparent",
                            transform: isActive ? "scale(1.01) translateX(2px)" : "scale(1)",
                            transition: "all 500ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                          }}
                        >
                          {line.text}
                        </button>
                      );
                    })}
                  </div>
                ) : lyricsState === "loaded" && plainLyrics ? (
                  <div className="mx-auto max-w-xl py-12 px-6 pb-32">
                    <p className="text-center lg:text-left text-xs font-mono tracking-wider uppercase text-[var(--text-secondary)] opacity-50 mb-6 flex items-center justify-center lg:justify-start gap-2 select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)] opacity-65" />
                      Lyrics not yet timed
                    </p>
                    <pre className="whitespace-pre-wrap font-sans text-base sm:text-lg lg:text-xl font-medium leading-loose tracking-wide text-[var(--text-secondary)] select-text text-center lg:text-left">
                      {plainLyrics}
                    </pre>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center py-20">
                    <div>
                      <Disc3 className="mx-auto mb-4 h-12 w-12 text-[var(--text-secondary)] opacity-35" style={{ color: accent }} />
                      <p className="text-base font-semibold text-[var(--text-secondary)]">
                        No Lyrics Available
                      </p>
                      <p className="mt-1.5 text-xs text-[var(--text-secondary)] opacity-50">
                        This track is instrumental or doesn't have lyrics yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── MOBILE ONLY FOOTER CONTROLS (Hidden on Desktop) ── */}
            <div
              className="shrink-0 flex flex-col gap-4 border-t pt-4 pb-5 px-4 lg:hidden"
              style={{
                borderColor: "var(--card-border)",
                background: "color-mix(in srgb, var(--bg-primary) 96%, transparent)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
              }}
            >
              {/* Audio Visualizer */}
              <div className="w-full h-6 flex items-center justify-center opacity-85">
                <MusicVisualizer isPlaying={isPlaying} trackId={currentTrack.title} barCount={20} height={20} />
              </div>

              {/* Progress Scrubber (Touch Friendly Input Range) */}
              <div className="w-full flex flex-col gap-1.5">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={progress}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full h-1.5 bg-[var(--card-border)] rounded-full appearance-none cursor-pointer outline-none accent-transparent"
                  style={{
                    background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, var(--card-border) ${pct}%, var(--card-border) 100%)`,
                  }}
                />

                <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-secondary)] font-medium">
                  <span>{formatDuration(progress)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              {/* Control Buttons & Volume slider */}
              <div className="w-full flex flex-col gap-1">
                {/* Volume Scrubber (Auto Hide Slider) */}
                <AnimatePresence>
                  {showVolume && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", damping: 20, stiffness: 200 }}
                      className="w-full overflow-hidden"
                    >
                      <div className="w-full flex items-center gap-2 px-6 text-[var(--text-secondary)] pb-2 pt-1">
                        <SpeakerIcon className="h-4 w-4 shrink-0" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            setVolume(Number(e.target.value));
                            triggerVolumeActive();
                          }}
                          className="flex-1 h-1 bg-[var(--card-border)] rounded-full appearance-none cursor-pointer outline-none accent-transparent"
                          style={{
                            background: `linear-gradient(to right, ${accent} 0%, ${accent} ${isMuted ? 0 : volume * 100}%, var(--card-border) ${isMuted ? 0 : volume * 100}%, var(--card-border) 100%)`,
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Playback & App controls row */}
                <div className="flex items-center justify-between w-full mt-1 px-6">
                  {/* Volume Toggle Button */}
                  <button
                    onClick={() => {
                      if (showVolume) {
                        toggleMute();
                        triggerVolumeActive();
                      } else {
                        triggerVolumeActive();
                      }
                    }}
                    className="rounded-full p-2 transition-all active:scale-95 text-[var(--text-secondary)]"
                    aria-label="Volume"
                  >
                    <SpeakerIcon className="h-4.5 w-4.5" />
                  </button>

                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className="rounded-full p-2 transition-all active:scale-95 text-[var(--text-secondary)]"
                    style={{ color: isShuffle ? accent : undefined }}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="h-4.5 w-4.5" />
                  </button>

                  <button
                    onClick={prev}
                    className="rounded-full border p-2.5 transition-all hover:bg-[var(--bg-secondary)] active:scale-95"
                    style={{ borderColor: "var(--card-border)" }}
                    aria-label="Previous track"
                  >
                    <SkipBack className="h-4 w-4 text-[var(--text-primary)]" />
                  </button>

                  <button
                    onClick={isPlaying ? pause : resume}
                    className="flex h-13 w-13 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 text-white shadow-lg shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accentColor.secondary})`,
                      boxShadow: isPlaying ? `0 4px 18px -2px ${accentGlow}` : "none",
                    }}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-5.5 w-5.5 fill-white text-white" />
                    ) : (
                      <Play className="h-5.5 w-5.5 fill-white text-white ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={next}
                    className="rounded-full border p-2.5 transition-all hover:bg-[var(--bg-secondary)] active:scale-95"
                    style={{ borderColor: "var(--card-border)" }}
                    aria-label="Next track"
                  >
                    <SkipForward className="h-4 w-4 text-[var(--text-primary)]" />
                  </button>

                  <button
                    onClick={() => setIsRepeat(!isRepeat)}
                    className="rounded-full p-2 transition-all active:scale-95 text-[var(--text-secondary)]"
                    style={{ color: isRepeat ? accent : undefined }}
                    aria-label="Repeat"
                  >
                    <Repeat className="h-4.5 w-4.5" />
                  </button>

                  <button
                    onClick={toggleQueue}
                    className="rounded-full p-2 transition-all active:scale-95 text-[var(--text-secondary)]"
                    style={{ color: isQueueOpen ? accent : undefined }}
                    aria-label="Toggle queue"
                  >
                    <ListMusic className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
