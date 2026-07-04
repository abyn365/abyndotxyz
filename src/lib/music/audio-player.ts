export type AudioPlayerState = "unstarted" | "ended" | "playing" | "paused" | "buffering" | "cued";

export interface AudioPlayerCallbacks {
  onReady?: () => void;
  onStateChange?: (state: AudioPlayerState) => void;
  onError?: (code: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export class MusicAudioPlayer {
  private static instance: MusicAudioPlayer | null = null;
  private audio: HTMLAudioElement | null = null;
  private callbacks: AudioPlayerCallbacks = {};
  private currentState: AudioPlayerState = "unstarted";
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;

  static getInstance(): MusicAudioPlayer {
    if (!MusicAudioPlayer.instance) {
      MusicAudioPlayer.instance = new MusicAudioPlayer();
    }
    return MusicAudioPlayer.instance;
  }

  init(callbacks: AudioPlayerCallbacks = {}) {
    this.callbacks = callbacks;
    if (typeof window === "undefined") return;

    if (!this.audio) {
      this.audio = new Audio();
      
      this.audio.addEventListener("play", () => {
        this.currentState = "playing";
        this.callbacks.onStateChange?.("playing");
      });

      this.audio.addEventListener("playing", () => {
        this.currentState = "playing";
        this.callbacks.onStateChange?.("playing");
      });

      this.audio.addEventListener("pause", () => {
        this.currentState = "paused";
        this.callbacks.onStateChange?.("paused");
      });

      this.audio.addEventListener("waiting", () => {
        this.currentState = "buffering";
        this.callbacks.onStateChange?.("buffering");
      });

      this.audio.addEventListener("ended", () => {
        this.currentState = "ended";
        this.callbacks.onStateChange?.("ended");
      });

      this.audio.addEventListener("timeupdate", () => {
        if (this.audio) {
          this.callbacks.onTimeUpdate?.(this.audio.currentTime, this.audio.duration || 0);
        }
      });

      this.audio.addEventListener("durationchange", () => {
        if (this.audio) {
          this.callbacks.onTimeUpdate?.(this.audio.currentTime, this.audio.duration || 0);
        }
      });

      this.audio.addEventListener("error", () => {
        // Ignore errors if the source was cleared intentionally (empty src) or player is stopped
        if (
          !this.audio ||
          !this.audio.src ||
          this.audio.src === "" ||
          this.audio.src === window.location.href ||
          this.currentState === "unstarted"
        ) {
          return;
        }

        // Also ignore if the error message indicates an empty src attribute
        if (this.audio.error?.message?.includes("Empty src attribute")) {
          return;
        }

        console.error("[MusicAudioPlayer] Audio error:", this.audio?.error);
        // Map any media error to standard code
        this.callbacks.onError?.(this.audio?.error?.code || 4);
      });
    }

    // Trigger ready immediately since HTML5 Audio initializes synchronously
    setTimeout(() => {
      this.callbacks.onReady?.();
    }, 0);
  }

  load(url: string, seekTo?: number, shouldPlay = true) {
    if (!this.audio) return;
    try {
      this.audio.src = url;
      this.audio.load();
      if (seekTo !== undefined && seekTo > 0) {
        this.audio.currentTime = seekTo;
      }
      if (shouldPlay) {
        this.audio.play().catch((err) => {
          console.warn("[MusicAudioPlayer] Playback deferred or interrupted:", err);
        });
      } else {
        this.currentState = "paused";
        this.callbacks.onStateChange?.("paused");
      }
    } catch (err) {
      console.error("[MusicAudioPlayer] Failed to load source:", err);
    }
  }

  play() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
    this.audio?.play().catch(() => {});
  }

  pause() {
    this.audio?.pause();
  }

  seek(seconds: number) {
    if (this.audio) {
      this.audio.currentTime = seconds;
    }
  }

  getTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.audio?.duration ?? 0;
  }

  setVolume(v: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, v));
    }
  }

  mute() {
    if (this.audio) {
      this.audio.muted = true;
    }
  }

  unmute() {
    if (this.audio) {
      this.audio.muted = false;
    }
  }

  isMuted(): boolean {
    return this.audio?.muted ?? false;
  }

  getState(): AudioPlayerState {
    return this.currentState;
  }

  getAnalyser(): AnalyserNode | null {
    if (typeof window === "undefined") return null;
    if (!this.audio) return null;

    if (!this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64; // 32 frequency bins
        this.analyser.smoothingTimeConstant = 0.8;

        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      } catch (err) {
        console.warn("[MusicAudioPlayer] Failed to initialize Web Audio API:", err);
        return null;
      }
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }

    return this.analyser;
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      // Properly clear/reset media element resources in standard HTML5 browser environment
      this.audio.removeAttribute("src");
      this.audio.load();
    }
    this.currentState = "unstarted";
  }

  updateCallbacks(callbacks: AudioPlayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.source = null;
    this.analyser = null;
    this.audio = null;
    MusicAudioPlayer.instance = null;
  }
}
