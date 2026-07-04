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

  load(url: string, seekTo?: number) {
    if (!this.audio) return;
    try {
      this.audio.src = url;
      this.audio.load();
      if (seekTo !== undefined && seekTo > 0) {
        this.audio.currentTime = seekTo;
      }
      this.audio.play().catch((err) => {
        console.warn("[MusicAudioPlayer] Playback deferred or interrupted:", err);
      });
    } catch (err) {
      console.error("[MusicAudioPlayer] Failed to load source:", err);
    }
  }

  play() {
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

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
    }
    this.currentState = "unstarted";
  }

  updateCallbacks(callbacks: AudioPlayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  destroy() {
    this.stop();
    this.audio = null;
    MusicAudioPlayer.instance = null;
  }
}
