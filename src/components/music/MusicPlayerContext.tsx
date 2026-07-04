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
import { MusicAudioPlayer } from "../../lib/music/audio-player";
import { cacheGet, cacheSet } from "../../lib/music/cache";
import { fetchLyrics, getActiveLyricIndex, type LyricsLine } from "../../lib/music/lyrics";
import { resolveMetadata, isSameTrack, type TrackMetadata } from "../../lib/music/metadata";
import { SpotifySync } from "../../lib/music/sync";
import { NowPlayingSong } from "../../@types/now-playing-song.type";
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
  spotifyData: NowPlayingSong | null;
  queue: TrackMetadata[];
  queueIndex: number;
  accentColor: AccentPalette;
  syncMode: "listening-along" | "manual";
  isQueueOpen: boolean;
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
  toggleQueue: () => void;
  setQueueOpen: (open: boolean) => void;
  playFromQueue: (index: number) => Promise<void>;
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
  isQueueOpen: false,
};

const MusicPlayerContext = createContext<
  (MusicPlayerState & MusicPlayerActions) | null
>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used inside MusicPlayerProvider");
  return ctx;
}

const preloadSearch = async (title: string, artist: string, duration?: number) => {
  try {
    const params = new URLSearchParams({ title, artist });
    if (duration) params.append("duration", duration.toString());
    await fetch(`/api/resolve-track?${params.toString()}`);
  } catch {
    // Ignore preload failures
  }
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MusicPlayerState>(defaultState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const audioPlayer = useRef<MusicAudioPlayer | null>(null);
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
        // Resolve on server in background to warm the cache
        const params = new URLSearchParams({
          title: nextTrack.title,
          artist: nextTrack.artist,
        });
        if (nextTrack.album) params.append("album", nextTrack.album);
        if (nextTrack.duration) params.append("duration", nextTrack.duration.toString());
        fetch(`/api/resolve-track?${params.toString()}`).catch(() => {});

        fetchLyrics(nextTrack.artist, nextTrack.title).catch(() => {});
        extractAccentColors(nextTrack.cover).catch(() => {});
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Unified Audio Player setup (once)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const player = MusicAudioPlayer.getInstance();
    audioPlayer.current = player;

    player.init({
      onReady: () => {
        player.setVolume(stateRef.current.volume);
      },
      onStateChange: (audioState) => {
        if (audioState === "playing") {
          setLoadingDebounced(false);
          if (audioPlayer.current) {
            if (!stateRef.current.isMuted) {
              audioPlayer.current.unmute();
            }
            audioPlayer.current.setVolume(stateRef.current.volume);
          }
          set({ isPlaying: true, isLoading: false });

          // ── Playback Sync Correction ──
          if (stateRef.current.syncMode === "listening-along" && lastSpotifySync.current) {
            const elapsed = Date.now() - lastSpotifySync.current.timestamp;
            const targetSpotifyMs = lastSpotifySync.current.progressMs + elapsed;
            const currentMs = player.getTime() * 1000;
            const drift = Math.abs(currentMs - targetSpotifyMs);
            if (drift > 1500) {
              isSyncSeekInProgress.current = true;
              player.seek(targetSpotifyMs / 1000);
              setTimeout(() => {
                isSyncSeekInProgress.current = false;
              }, 800);
            }
          }
        } else if (audioState === "paused") {
          set({ isPlaying: false });
        } else if (audioState === "ended") {
          // Auto-advance queue
          const { queue, queueIndex } = stateRef.current;
          if (queueIndex < queue.length - 1) {
            actions.next();
          } else {
            set({ isPlaying: false });
          }
        } else if (audioState === "buffering") {
          setLoadingDebounced(true);
        }
      },
      onError: async (code: number) => {
        const currentTrack = stateRef.current.currentTrack;
        console.error(`[Audio Player Error] Code: ${code}. Video ID: ${currentTrack?.videoId}`);

        if (currentTrack && retryCount.current < 2) {
          retryCount.current += 1;
          console.warn(`[Audio Player] Playback failed. Retrying...`);

          try {
            const target = currentTrack.videoId || currentTrack.resolvedUrl || "";
            if (!target) {
              console.warn("[Audio Player] Ignored error: track not resolved yet.");
              return;
            }
            const streamUrl = `/api/stream?id=${encodeURIComponent(target)}`;
            audioPlayer.current?.load(streamUrl, stateRef.current.progress);
            return;
          } catch (err) {
            console.error("[Audio Player Retry Failed]", err);
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
            audioPlayer.current?.seek(targetSpotifyMs / 1000);
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
    const sync = new SpotifySync(async (data: NowPlayingSong) => {
      set({ spotifyData: data });

      // Preload next items in the Spotify queue
      if (data.upcomingQueue && Array.isArray(data.upcomingQueue)) {
        data.upcomingQueue.forEach((t) => {
          preloadSearch(t.title, t.artist).catch(() => {});
        });
      }

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
          audioPlayer.current?.pause();
          set({ isPlaying: false });
        }
        return;
      }

      const trackKey = `${data.title}::${data.artist}`;

      const lastSpotifyTrack = spotifyTrackKey.current
        ? {
            title: spotifyTrackKey.current.split("::")[0],
            artist: spotifyTrackKey.current.split("::")[1],
          }
        : null;

      if (isSameTrack(data, lastSpotifyTrack)) {
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
      if (isSameTrack(track, stateRef.current.currentTrack) && seekToMs === undefined) {
        if (!stateRef.current.isPlaying) audioPlayer.current?.play();
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

      // Immediately stop previous audio and mute the channels to block sound leak
      audioPlayer.current?.stop();
      audioPlayer.current?.mute();

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

      const resolveTrackOnServer = async (t: TrackMetadata, signal?: AbortSignal) => {
        const normTitle = t.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const normArtist = t.artist.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const normAlbum = t.album ? t.album.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim() : "";
        const cacheKey = `resolved_track:${normArtist}:${normTitle}${normAlbum ? `:${normAlbum}` : ""}`;
        const cached = cacheGet<any>(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({
          title: t.title,
          artist: t.artist,
        });
        if (t.album) params.append("album", t.album);
        if (t.duration) params.append("duration", t.duration.toString());

        const res = await fetch(`/api/resolve-track?${params.toString()}`, { signal });
        if (!res.ok) throw new Error("Failed to resolve track");
        const resolved = await res.json();
        
        cacheSet(cacheKey, resolved, 24 * 60 * 60 * 1000, true);
        return resolved;
      };

      // Search and retrieve lyrics
      const [resolveResult, lyricsResult] = await Promise.allSettled([
        resolveTrackOnServer(track, abort.signal),
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

      if (resolveResult.status === "fulfilled" && resolveResult.value) {
        const resolved = resolveResult.value;
        const { provider, id, duration: lengthSeconds } = resolved;
        
        // Offset the search/load delay
        const elapsedMs = Date.now() - playSongStartedAt.current;
        const seekTo = seekToMs !== undefined ? (seekToMs + elapsedMs) / 1000 : undefined;

        const enrichedTrack = {
          ...activeTrack,
          provider,
          resolvedUrl: provider === "soundcloud" ? id : undefined,
          videoId: provider !== "soundcloud" ? id : undefined,
        };

        set({
          currentTrack: enrichedTrack,
          duration: lengthSeconds || stateRef.current.duration,
        });
        
        const target = id;
        const streamUrl = `/api/stream?id=${encodeURIComponent(target)}`;
        audioPlayer.current?.load(streamUrl, seekTo);

        // Preload next track in queue
        preloadNextTrack().catch(() => {});
      } else {
        setLoadingDebounced(false);
        set({
          isLoading: false,
          error: "Could not find this track on any source — try another",
        });
      }
    },

    pause() {
      set({ syncMode: "manual" });
      audioPlayer.current?.pause();
      set({ isPlaying: false });
    },

    resume() {
      set({ syncMode: "manual" });
      audioPlayer.current?.play();
      set({ isPlaying: true });
    },

    seek(seconds: number) {
      set({ syncMode: "manual" });
      audioPlayer.current?.seek(seconds);
      const currentMs = seconds * 1000;
      const newIdx = getActiveLyricIndex(stateRef.current.lyrics, currentMs);
      set({ progress: seconds, activeLyricIndex: newIdx });
    },

    setVolume(v: number) {
      const clamped = Math.max(0, Math.min(1, v));
      audioPlayer.current?.setVolume(clamped);
      if (clamped > 0 && stateRef.current.isMuted) {
        audioPlayer.current?.unmute();
        set({ isMuted: false });
      }
      set({ volume: clamped });
    },

    toggleMute() {
      const muted = stateRef.current.isMuted;
      if (muted) {
        audioPlayer.current?.unmute();
        audioPlayer.current?.setVolume(stateRef.current.volume);
      } else {
        audioPlayer.current?.mute();
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
      audioPlayer.current?.stop();
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
    toggleQueue() {
      set({ isQueueOpen: !stateRef.current.isQueueOpen });
    },
    setQueueOpen(open: boolean) {
      set({ isQueueOpen: open });
    },
    async playFromQueue(index: number) {
      const { queue } = stateRef.current;
      if (index >= 0 && index < queue.length) {
        set({ queueIndex: index });
        await actions.playSong(queue[index]);
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
