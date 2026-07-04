import { NowPlayingSong } from "../../@types/now-playing-song.type";

export type SpotifySyncCallback = (data: NowPlayingSong) => void;

export class SpotifySync {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTrackId: string | null = null;
  private lastFetchTime = 0;
  private lastProgressMs = 0;
  private callback: SpotifySyncCallback;
  private pollIntervalMs: number;
  private nextTickTimeout: ReturnType<typeof setTimeout> | null = null;
  private isActive = false;

  constructor(callback: SpotifySyncCallback, pollIntervalMs = 5000) {
    this.callback = callback;
    this.pollIntervalMs = pollIntervalMs;
  }

  getEstimatedProgressMs(data: NowPlayingSong): number {
    if (!data.isPlaying) return data.progressMs ?? 0;
    const elapsed = Date.now() - this.lastFetchTime;
    return Math.min(
      (data.progressMs ?? 0) + elapsed,
      data.durationMs ?? Infinity
    );
  }

  private async fetchNowPlaying(): Promise<NowPlayingSong | null> {
    try {
      const res = await fetch("/api/now-playing", { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  private async tick() {
    if (!this.isActive) return;

    const data = await this.fetchNowPlaying();
    if (data) {
      this.lastFetchTime = Date.now();

      if (data.isPlaying) {
        this.lastProgressMs = data.progressMs ?? 0;
      }

      const trackId = `${data.title ?? ""}::${data.artist ?? ""}`;
      if (trackId !== this.lastTrackId) {
        this.lastTrackId = trackId;
      }

      this.callback({ ...data });
    }

    if (!this.isActive) return;

    // Schedule next tick based on track duration to eliminate sync delay
    let delay = this.pollIntervalMs;
    if (data && data.isPlaying && data.durationMs && data.progressMs) {
      const remainingMs = data.durationMs - data.progressMs;
      // If the song is ending within the normal poll interval, schedule exactly when it ends (+500ms buffer)
      if (remainingMs > 0 && remainingMs < this.pollIntervalMs + 2000) {
        delay = Math.max(1000, remainingMs + 500); // Wait until it finishes, but at least 1s
      } else if (remainingMs <= 0) {
        delay = 1000;
      }
    }

    if (this.nextTickTimeout) clearTimeout(this.nextTickTimeout);
    this.nextTickTimeout = setTimeout(() => this.tick(), delay);
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.tick();
  }

  stop() {
    this.isActive = false;
    if (this.nextTickTimeout !== null) {
      clearTimeout(this.nextTickTimeout);
      this.nextTickTimeout = null;
    }
  }

  forceRefresh() {
    if (this.nextTickTimeout) clearTimeout(this.nextTickTimeout);
    this.tick();
  }
}
