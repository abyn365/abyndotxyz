// Minimal YouTube IFrame Player API type stubs for TypeScript.
// The real API is loaded at runtime via https://www.youtube.com/iframe_api

declare namespace YT {
  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1 | 2;
    disablekb?: 0 | 1;
    fs?: 0 | 1;
    modestbranding?: 0 | 1;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    origin?: string;
    start?: number;
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onError?: (event: OnErrorEvent) => void;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    data: number;
    target: Player;
  }

  interface OnErrorEvent {
    data: number;
    target: Player;
  }

  interface VideoById {
    videoId: string;
    startSeconds?: number;
    endSeconds?: number;
  }

  class Player {
    constructor(elementIdOrElement: string | HTMLElement, options: PlayerOptions);
    loadVideoById(videoId: string | VideoById, startSeconds?: number): void;
    cueVideoById(videoId: string | VideoById, startSeconds?: number): void;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setVolume(volume: number): void;
    getVolume(): number;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    destroy(): void;
  }
}

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady: () => void;
}
