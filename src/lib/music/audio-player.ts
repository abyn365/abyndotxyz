export type AudioPlayerState = "unstarted" | "ended" | "playing" | "paused" | "buffering" | "cued";

export interface AudioPlayerCallbacks {
  onReady?: () => void;
  onStateChange?: (state: AudioPlayerState) => void;
  onError?: (code: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export class MusicAudioPlayer {
  private static instance: MusicAudioPlayer | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private standbyAudio: HTMLAudioElement | null = null;
  private callbacks: AudioPlayerCallbacks = {};
  private currentState: AudioPlayerState = "unstarted";
  
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private activeSource: MediaElementAudioSourceNode | null = null;
  private standbySource: MediaElementAudioSourceNode | null = null;

  private currentVolume: number = 0.8;
  private isMutedState: boolean = false;

  static getInstance(): MusicAudioPlayer {
    if (!MusicAudioPlayer.instance) {
      MusicAudioPlayer.instance = new MusicAudioPlayer();
    }
    return MusicAudioPlayer.instance;
  }

  private attachListeners(audio: HTMLAudioElement, isStandby: boolean) {
    audio.addEventListener("play", () => {
      if (audio !== this.activeAudio) return;
      this.currentState = "playing";
      this.callbacks.onStateChange?.("playing");
    });

    audio.addEventListener("playing", () => {
      if (audio !== this.activeAudio) return;
      this.currentState = "playing";
      this.callbacks.onStateChange?.("playing");
    });

    audio.addEventListener("pause", () => {
      if (audio !== this.activeAudio) return;
      this.currentState = "paused";
      this.callbacks.onStateChange?.("paused");
    });

    audio.addEventListener("waiting", () => {
      if (audio !== this.activeAudio) return;
      this.currentState = "buffering";
      this.callbacks.onStateChange?.("buffering");
    });

    audio.addEventListener("ended", () => {
      if (audio !== this.activeAudio) return;
      this.currentState = "ended";
      this.callbacks.onStateChange?.("ended");
    });

    audio.addEventListener("timeupdate", () => {
      if (audio !== this.activeAudio) return;
      this.callbacks.onTimeUpdate?.(audio.currentTime, audio.duration || 0);
    });

    audio.addEventListener("durationchange", () => {
      if (audio !== this.activeAudio) return;
      this.callbacks.onTimeUpdate?.(audio.currentTime, audio.duration || 0);
    });

    audio.addEventListener("error", () => {
      if (audio !== this.activeAudio) return;
      if (!audio.src || audio.src === "" || audio.src === window.location.href || this.currentState === "unstarted") return;
      if (audio.error?.message?.includes("Empty src attribute")) return;

      console.error("[MusicAudioPlayer] Audio error:", audio.error);
      this.callbacks.onError?.(audio.error?.code || 4);
    });
  }

  init(callbacks: AudioPlayerCallbacks = {}) {
    this.callbacks = callbacks;
    if (typeof window === "undefined") return;

    if (!this.activeAudio) {
      this.activeAudio = new Audio();
      this.activeAudio.crossOrigin = "anonymous";
      this.attachListeners(this.activeAudio, false);
      
      this.standbyAudio = new Audio();
      this.standbyAudio.crossOrigin = "anonymous";
      this.attachListeners(this.standbyAudio, true);
    }

    setTimeout(() => {
      this.callbacks.onReady?.();
    }, 0);
  }

  load(url: string, seekTo?: number, shouldPlay = true) {
    if (!this.activeAudio) return;
    try {
      if (this.standbyAudio && this.standbyAudio.src.endsWith(url)) {
        this.playPreloaded();
        if (seekTo !== undefined && seekTo > 0) {
          this.activeAudio.currentTime = seekTo;
        }
        if (!shouldPlay) {
          this.activeAudio.pause();
          this.currentState = "paused";
          this.callbacks.onStateChange?.("paused");
        }
        return;
      }

      this.activeAudio.src = url;
      this.activeAudio.load();
      this.activeAudio.volume = this.currentVolume;
      this.activeAudio.muted = this.isMutedState;

      if (seekTo !== undefined && seekTo > 0) {
        this.activeAudio.currentTime = seekTo;
      }
      
      if (shouldPlay) {
        this.activeAudio.play().catch((err) => {
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

  preload(url: string) {
    if (!this.standbyAudio) return;
    try {
      if (this.standbyAudio.src.endsWith(url)) return; // Already preloaded
      this.standbyAudio.src = url;
      this.standbyAudio.load();
      this.standbyAudio.volume = this.currentVolume;
      this.standbyAudio.muted = this.isMutedState;
    } catch (err) {
      console.error("[MusicAudioPlayer] Failed to preload source:", err);
    }
  }

  playPreloaded() {
    if (!this.activeAudio || !this.standbyAudio) return;
    
    // Stop active
    this.activeAudio.pause();
    this.activeAudio.removeAttribute("src");
    this.activeAudio.load();
    
    // Swap pointers
    const tempAudio = this.activeAudio;
    this.activeAudio = this.standbyAudio;
    this.standbyAudio = tempAudio;
    
    // Swap sources if analyzer is active
    if (this.audioContext && this.analyser) {
       // Both sources should already be connected to analyzer if initialized
    }
    
    // Play new active
    this.activeAudio.volume = this.currentVolume;
    this.activeAudio.muted = this.isMutedState;
    this.activeAudio.play().catch(console.error);
  }

  play() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
    this.activeAudio?.play().catch(() => {});
  }

  resumeContext() {
    if (!this.audioContext) {
      this.getAnalyser();
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
  }

  pause() {
    this.activeAudio?.pause();
  }

  seek(seconds: number) {
    if (this.activeAudio) {
      this.activeAudio.currentTime = seconds;
    }
  }

  getTime(): number {
    return this.activeAudio?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.activeAudio?.duration ?? 0;
  }

  setVolume(v: number) {
    const clamped = Math.max(0, Math.min(1, v));
    this.currentVolume = clamped;
    if (this.activeAudio) this.activeAudio.volume = clamped;
    if (this.standbyAudio) this.standbyAudio.volume = clamped;
  }

  mute() {
    this.isMutedState = true;
    if (this.activeAudio) this.activeAudio.muted = true;
    if (this.standbyAudio) this.standbyAudio.muted = true;
  }

  unmute() {
    this.isMutedState = false;
    if (this.activeAudio) this.activeAudio.muted = false;
    if (this.standbyAudio) this.standbyAudio.muted = false;
  }

  isMuted(): boolean {
    return this.isMutedState;
  }

  getState(): AudioPlayerState {
    return this.currentState;
  }

  getAnalyser(): AnalyserNode | null {
    if (typeof window === "undefined") return null;
    if (!this.activeAudio || !this.standbyAudio) return null;

    if (!this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;

        // Connect both elements to the same analyser
        this.activeSource = this.audioContext.createMediaElementSource(this.activeAudio);
        this.standbySource = this.audioContext.createMediaElementSource(this.standbyAudio);
        
        this.activeSource.connect(this.analyser);
        this.standbySource.connect(this.analyser);
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
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.removeAttribute("src");
      this.activeAudio.load();
    }
    if (this.standbyAudio) {
      this.standbyAudio.pause();
      this.standbyAudio.removeAttribute("src");
      this.standbyAudio.load();
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
    this.activeSource = null;
    this.standbySource = null;
    this.analyser = null;
    this.activeAudio = null;
    this.standbyAudio = null;
    MusicAudioPlayer.instance = null;
  }
}
