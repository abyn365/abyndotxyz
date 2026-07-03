"use client";
/**
 * components/music/MusicPlayerContext.tsx
 * Global music player state — mounted once in _app.tsx.
 * All components consume this context to interact with the player.
 *
 * Enhancements:
 *   - syncMode: 'listening-along' | 'manual' to prevent Spotify Sync fighting local selections
 *   - Playback synchronization: offset loading latency, muting on transition, continuous drift correction
 *   - Preload next track
 *   - Keyboard shortcuts checking target inputs and contenteditable
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { MusicYouTubePlayer, searchYouTube, preloadSearch } from "../../lib/music/youtube";
import { fetchLyrics, getActiveLyricIndex, type LyricsLine } from "../../lib/music/lyrics";
import { resolveMetadata, type TrackMetadata } from "../../lib/music/metadata";
import { SpotifySync, type SpotifyNowPlayingData } from "../../lib/music/sync";
import {
  extractAccentColors,
  applyAccentToCSSVars,
  resetAccentCSSVars,
  type AccentPalette,
  FALLBACK,
} from "../../lib/music/accentColor";

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------
export interface MusicPlayerState {
  currentTrack: TrackMetadata | null;
  isPlaying: boolean;
  progress: number;       // seconds
  duration: number;       // seconds
  volume: number;         // 0–1
  isMuted: boolean;
  isLoading: boolean;
  lyrics: LyricsLine[];
  activeLyricIndex: number;
  hasTimestamps: boolean;
  plainLyrics?: string;
  lyricsState: "idle" | "loading" | "loaded" | "empty" | "error";
  isLyricsOpen: boolean;
  isMinimized: boolean;
  error: string | null;
  spotifyData: SpotifyNowPlayingData | null;
  queue: TrackMetadata[];
  queueIndex: number;
  accentColor: AccentPalette;
  syncMode: "listening-along" | "manual";
}

export interface MusicPlayerActions {
  playSong: (track: TrackMetadata, seekToMs?: number, isSyncOrigin?: boolean) => Promise<void>;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleLyrics: () => void;
  setMinimized: (v: boolean) => void;
  next: () => void;
  prev: () => void;
  setQueue: (tracks: TrackMetadata[], startIndex?: number) => void;
  dismiss: () => void;
  resetToListeningAlong: () => void;
}

const defaultState: MusicPlayerState = {
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isLoading: false,
  lyrics: [],
  activeLyricIndex: -1,
  hasTimestamps: false,
  plainLyrics: undefined,
  lyricsState: "idle",
  isLyricsOpen: false,
  isMinimized: false,
  error: null,
  spotifyData: null,
  queue: [],
  queueIndex: -1,
  accentColor: FALLBACK,
  syncMode: "listening-along",
};

const MusicPlayerContext = createContext<
  (MusicPlayerState & MusicPlayerActions) | null
>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used inside MusicPlayerProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MusicPlayerState>(defaultState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const ytPlayer = useRef<MusicYouTubePlayer | null>(null);
  const spotifySync = useRef<SpotifySync | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const currentTrackKey = useRef<string | null>(null);
  const spotifyTrackKey = useRef<string | null>(null);

  // Sync references to calculate elapsed loading latency and drift
  const playSongStartedAt = useRef<number>(0);
  const lastSpotifySync = useRef<{ progressMs: number; timestamp: number } | null>(null);
  const isSyncSeekInProgress = useRef<boolean>(false);
  const failedVideoIds = useRef<string[]>([]);
  const retryCount = useRef<number>(0);

  // Loading debounce — avoid flash for fast loads
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to set partial state
  const set = useCallback((partial: Partial<MusicPlayerState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Debounced loading setter — only show spinner after 300ms delay
  const setLoadingDebounced = useCallback((loading: boolean) => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    if (!loading) {
      set({ isLoading: false });
      return;
    }
    loadingTimerRef.current = setTimeout(() => {
      set({ isLoading: true });
    }, 300);
  }, [set]);

  // ---------------------------------------------------------------------------
  // Extract accent color from album artwork
  // ---------------------------------------------------------------------------
  const extractAndApplyAccent = useCallback(async (coverUrl: string | undefined) => {
    if (!coverUrl) {
      resetAccentCSSVars();
      set({ accentColor: FALLBACK });
      return;
    }
    const palette = await extractAccentColors(coverUrl);
    applyAccentToCSSVars(palette);
    set({ accentColor: palette });
  }, [set]);

  // ---------------------------------------------------------------------------
  // Preloading helper for next track
  // ---------------------------------------------------------------------------
  const preloadNextTrack = useCallback(async () => {
    const { queue, queueIndex } = stateRef.current;
    if (queueIndex >= 0 && queueIndex < queue.length - 1) {
      const nextTrack = queue[queueIndex + 1];
      if (nextTrack) {
        preloadSearch(nextTrack.title, nextTrack.artist).catch(() => {});
        fetchLyrics(nextTrack.artist, nextTrack.title).catch(() => {});
        extractAccentColors(nextTrack.cover).catch(() => {});
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // YouTube player setup (once)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const player = MusicYouTubePlayer.getInstance();
    ytPlayer.current = player;

    player.init({
      onReady: () => {
        player.setVolume(stateRef.current.volume);
      },
      onStateChange: (ytState) => {
        if (ytState === "playing") {
          setLoadingDebounced(false);
          // Unmute and restore volume only when the new video starts playing
          // This avoids the previous video's audio leakage during loading
          if (ytPlayer.current) {
            if (!stateRef.current.isMuted) {
              ytPlayer.current.unmute();
            }
            ytPlayer.current.setVolume(stateRef.current.volume);
          }
          set({ isPlaying: true, isLoading: false });
        } else if (ytState === "paused") {
          set({ isPlaying: false });
        } else if (ytState === "ended") {
          // Auto-advance queue
          const { queue, queueIndex } = stateRef.current;
          if (queueIndex < queue.length - 1) {
            actions.next();
          } else {
            set({ isPlaying: false });
          }
        } else if (ytState === "buffering") {
          setLoadingDebounced(true);
        }
      },
      onError: async (code: number) => {
        const currentTrack = stateRef.current.currentTrack;
        const currentVideoId = currentTrack?.videoId;

        console.error(`[YouTube Player Error] Code: ${code}. Video ID: ${currentVideoId}`);

        if ((code === 150 || code === 101 || code === 100) && currentTrack && retryCount.current < 2) {
          retryCount.current += 1;
          if (currentVideoId) {
            failedVideoIds.current.push(currentVideoId);
          }
          console.warn(`[YouTube Player] Video blocked or failed. Retrying search excluding:`, failedVideoIds.current);

          try {
            const nextResult = await searchYouTube(
              currentTrack.title,
              currentTrack.artist,
              undefined,
              failedVideoIds.current
            );
            if (nextResult) {
              console.log(`[YouTube Player] Found fallback video: ${nextResult.videoId} (${nextResult.title})`);
              set({
                currentTrack: {
                  ...currentTrack,
                  videoId: nextResult.videoId,
                },
                duration: nextResult.lengthSeconds || stateRef.current.duration,
              });
              ytPlayer.current?.load(nextResult.videoId);
              return;
            }
          } catch (err) {
            console.error("[YouTube Player Retry Failed]", err);
          }
        }

        setLoadingDebounced(false);
        set({ isLoading: false, error: "Playback failed — try another track" });
      },
      onTimeUpdate: (currentTime, duration) => {
        const currentMs = currentTime * 1000;
        const newActiveLyric = getActiveLyricIndex(stateRef.current.lyrics, currentMs);
        set({
          progress: currentTime,
          duration: duration || stateRef.current.duration,
          activeLyricIndex: newActiveLyric,
        });

        // ── Continuous Spotify Drift Correction ──
        if (
          stateRef.current.syncMode === "listening-along" &&
          lastSpotifySync.current &&
          stateRef.current.isPlaying &&
          !isSyncSeekInProgress.current
        ) {
          const elapsed = Date.now() - lastSpotifySync.current.timestamp;
          const targetSpotifyMs = lastSpotifySync.current.progressMs + elapsed;
          const drift = Math.abs(currentMs - targetSpotifyMs);

          // If drift exceeds 2 seconds, adjust playback location
          if (drift > 2000) {
            isSyncSeekInProgress.current = true;
            ytPlayer.current?.seek(targetSpotifyMs / 1000);
            setTimeout(() => {
              isSyncSeekInProgress.current = false;
            }, 800);
          }
        }
      },
    });

    // Keyboard shortcuts
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (!stateRef.current.currentTrack) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (stateRef.current.isPlaying) actions.pause();
          else actions.resume();
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            e.preventDefault();
            actions.seek(Math.max(0, stateRef.current.progress - 10));
          }
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            e.preventDefault();
            actions.seek(stateRef.current.progress + 10);
          }
          break;
        case "KeyM":
          actions.toggleMute();
          break;
        case "KeyL":
          actions.toggleLyrics();
          break;
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      player.stop();
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Spotify sync setup (once)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const sync = new SpotifySync(async (data: SpotifyNowPlayingData) => {
      set({ spotifyData: data });

      // Update sync references
      if (data.progressMs !== undefined) {
        lastSpotifySync.current = {
          progressMs: data.progressMs,
          timestamp: Date.now(),
        };
      }

      if (stateRef.current.syncMode === "manual") {
        return;
      }

      if (!data.isPlaying) {
        // Paused on Spotify: mirror pause locally while remaining in listening-along mode
        if (stateRef.current.isPlaying) {
          ytPlayer.current?.pause();
          set({ isPlaying: false });
        }
        return;
      }

      const trackKey = `${data.title}::${data.artist}`;

      if (trackKey === spotifyTrackKey.current) {
        // Same song — onTimeUpdate handles drift correction continuously
        return;
      }

      // New Spotify track detected
      spotifyTrackKey.current = trackKey;

      if (!data.title || !data.artist) return;

      const track: TrackMetadata = {
        title: data.title,
        artist: data.artist,
        album: data.album,
        cover: data.albumImageUrl,
        songUrl: data.songUrl,
      };

      // Add a slight latency buffer for initial track load
      const latencyCompensation = Date.now() - lastSpotifySync.current!.timestamp;
      const initialSeekMs = (data.progressMs ?? 0) + latencyCompensation;

      await actions.playSong(track, initialSeekMs, true);
    });

    sync.start();
    spotifySync.current = sync;

    return () => sync.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const actions: MusicPlayerActions = {
    async playSong(track: TrackMetadata, seekToMs?: number, isSyncOrigin = false) {
      const key = `${track.title}::${track.artist}`;

      if (!isSyncOrigin) {
        set({ syncMode: "manual" });
      }

      // Don't reload if same track
      if (key === currentTrackKey.current && seekToMs === undefined) {
        if (!stateRef.current.isPlaying) ytPlayer.current?.play();
        return;
      }

      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      currentTrackKey.current = key;
      failedVideoIds.current = [];
      retryCount.current = 0;

      // Track request timestamp to offset search latency later
      playSongStartedAt.current = Date.now();

      // Immediately stop previous audio and mute the channel to block sound leak
      ytPlayer.current?.stop();
      ytPlayer.current?.mute();

      // Update state atomically
      set({
        currentTrack: track,
        isLoading: false,
        error: null,
        lyrics: [],
        activeLyricIndex: -1,
        hasTimestamps: false,
        plainLyrics: undefined,
        lyricsState: "loading",
        isMinimized: false,
        isPlaying: false,
      });

      setLoadingDebounced(true);

      // Async, non-blocking theme calculation
      extractAndApplyAccent(track.cover).catch(() => {});

      let activeTrack = track;

      // Search and retrieve lyrics
      const [ytResult, lyricsResult] = await Promise.allSettled([
        searchYouTube(track.title, track.artist, abort.signal),
        fetchLyrics(track.artist, track.title, abort.signal),
      ]);

      if (abort.signal.aborted) return;

      if (lyricsResult.status === "fulfilled") {
        const lyrics = lyricsResult.value;
        const enriched = resolveMetadata(track, lyrics.metadata);
        activeTrack = enriched;
        
        let lyricsState: MusicPlayerState["lyricsState"] = "empty";
        if (lyrics.lines.length > 0) {
          lyricsState = "loaded";
        } else if (lyrics.plainLyrics && lyrics.plainLyrics.trim() !== "") {
          lyricsState = "loaded";
        } else if (lyrics.error) {
          lyricsState = "error";
        }

        set({
          currentTrack: enriched,
          lyrics: lyrics.lines,
          hasTimestamps: lyrics.hasTimestamps,
          plainLyrics: lyrics.plainLyrics,
          lyricsState,
          activeLyricIndex: -1,
        });
        if (enriched.cover && enriched.cover !== track.cover) {
          extractAndApplyAccent(enriched.cover).catch(() => {});
        }
      } else {
        set({
          lyricsState: "error",
        });
      }

      if (ytResult.status === "fulfilled" && ytResult.value) {
        const { videoId, lengthSeconds } = ytResult.value;
        
        // Offset the search/load delay
        const elapsedMs = Date.now() - playSongStartedAt.current;
        const seekTo = seekToMs !== undefined ? (seekToMs + elapsedMs) / 1000 : undefined;

        set({
          currentTrack: {
            ...activeTrack,
            videoId,
          },
          duration: lengthSeconds || stateRef.current.duration,
        });
        
        // Load the video — it remains muted until state changes to 'playing'
        ytPlayer.current?.load(videoId, seekTo);

        // Preload next track in queue
        preloadNextTrack().catch(() => {});
      } else {
        setLoadingDebounced(false);
        set({
          isLoading: false,
          error: "Could not find this track on YouTube — try another",
        });
      }
    },

    pause() {
      set({ syncMode: "manual" });
      ytPlayer.current?.pause();
      set({ isPlaying: false });
    },

    resume() {
      set({ syncMode: "manual" });
      ytPlayer.current?.play();
      set({ isPlaying: true });
    },

    seek(seconds: number) {
      set({ syncMode: "manual" });
      ytPlayer.current?.seek(seconds);
      const currentMs = seconds * 1000;
      const newIdx = getActiveLyricIndex(stateRef.current.lyrics, currentMs);
      set({ progress: seconds, activeLyricIndex: newIdx });
    },

    setVolume(v: number) {
      const clamped = Math.max(0, Math.min(1, v));
      ytPlayer.current?.setVolume(clamped);
      if (clamped > 0 && stateRef.current.isMuted) {
        ytPlayer.current?.unmute();
        set({ isMuted: false });
      }
      set({ volume: clamped });
    },

    toggleMute() {
      const muted = stateRef.current.isMuted;
      if (muted) {
        ytPlayer.current?.unmute();
        ytPlayer.current?.setVolume(stateRef.current.volume);
      } else {
        ytPlayer.current?.mute();
      }
      set({ isMuted: !muted });
    },

    toggleLyrics() {
      set({ isLyricsOpen: !stateRef.current.isLyricsOpen, isMinimized: false });
    },

    setMinimized(v: boolean) {
      set({ isMinimized: v });
    },

    next() {
      set({ syncMode: "manual" });
      const { queue, queueIndex } = stateRef.current;
      const nextIdx = queueIndex + 1;
      if (nextIdx < queue.length) {
        set({ queueIndex: nextIdx });
        actions.playSong(queue[nextIdx]);
      }
    },

    prev() {
      set({ syncMode: "manual" });
      const { progress, queue, queueIndex } = stateRef.current;
      if (progress > 3) {
        actions.seek(0);
        return;
      }
      const prevIdx = queueIndex - 1;
      if (prevIdx >= 0) {
        set({ queueIndex: prevIdx });
        actions.playSong(queue[prevIdx]);
      }
    },

    setQueue(tracks: TrackMetadata[], startIndex = 0) {
      set({ syncMode: "manual", queue: tracks, queueIndex: startIndex });
      if (tracks.length > startIndex) {
        actions.playSong(tracks[startIndex]);
      }
    },

    dismiss() {
      ytPlayer.current?.stop();
      resetAccentCSSVars();
      set({
        ...defaultState,
        volume: stateRef.current.volume,
        isMuted: stateRef.current.isMuted,
      });
      currentTrackKey.current = null;
      spotifyTrackKey.current = null;
      lastSpotifySync.current = null;
    },

    resetToListeningAlong() {
      set({ syncMode: "listening-along" });
      spotifyTrackKey.current = null;
      if (spotifySync.current) {
        spotifySync.current.forceRefresh();
      }
    },
  };

  const contextValue = { ...state, ...actions };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
