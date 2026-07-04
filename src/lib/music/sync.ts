import { NowPlayingSong } from "../../@types/now-playing-song.type";

export type SpotifySyncCallback = (data: NowPlayingSong) => void;

export class SpotifySync {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTrackId: string | null = null;
  private lastFetchTime = 0;
  private lastProgressMs = 0;
  private callback: SpotifySyncCallback;
  private pollIntervalMs: number;
  private isActive = false;

  constructor(callback: SpotifySyncCallback, pollIntervalMs = 5000) {
    this.callback = callback;
    this.pollIntervalMs = pollIntervalMs;
  }

  /**
   * Compute the estimated current Spotify playback position,
   * accounting for time elapsed since the last fetch.
   */
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
    const data = await this.fetchNowPlaying();
    if (!data) return;

    this.lastFetchTime = Date.now();

    if (data.isPlaying) {
      this.lastProgressMs = data.progressMs ?? 0;
    }

    const trackId = `${data.title ?? ""}::${data.artist ?? ""}`;
    if (trackId !== this.lastTrackId) {
      this.lastTrackId = trackId;
    }

    this.callback({
      ...data,
      // Attach computed estimate for callers that want it
    });
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;

    // Immediate first fetch
    this.tick();

    this.intervalId = setInterval(() => this.tick(), this.pollIntervalMs);
  }

  stop() {
    this.isActive = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  forceRefresh() {
    this.tick();
  }
}
