## Performance & Architecture Rules

### React High-Frequency State
Never store high-frequency changing state (e.g., media playback progress, scroll positions, mouse coordinates) in global React Contexts or high-level parent components. This causes severe re-render cascades. 
**Required Approach**: Use `requestAnimationFrame` combined with local `useRef` direct DOM manipulations, or tightly scoped local component state, to visualize fast-changing data without blocking the main thread.

### Asynchronous Operation Deduplication
When implementing expensive backend operations (such as child processes, CLI executions like `yt-dlp`, or heavy API fetches), always implement a concurrency lock/deduplication mechanism.
**Required Approach**: Maintain an `activePromises` Map (keyed by the resource ID) to ensure that multiple simultaneous requests for the exact same resource return the shared in-flight Promise rather than spawning redundant overlapping processes.

## Codebase Knowledge Base

### Music Streaming & Live Sync Architecture
- **Sync Engine**: `src/lib/music/sync.ts` is driven by Spotify API polls. It triggers metadata updates that propagate to `src/components/music/MusicPlayerContext.tsx`.
- **Sync Modes**:
  - `listening-along`: Keeps the local queue synchronized with the user's Spotify queue. In this mode, the local player strictly follows Spotify. If a track ends locally before Spotify transitions, it stops playing and waits (`endedLocally: true`) rather than auto-advancing. This prevents replaying or going out of sync.
  - `manual`: User-controlled playback. Tracks auto-advance locally using the local queue.
- **Audio Player**: `src/lib/music/audio-player.ts` handles the HTML5 Audio interface, buffering, and feeds Web Audio API analyser nodes for the visualizer.
- **Canvas Integration**: Spotify Canvas URLs (returned via `GET https://api.paxsenix.org/spotify/canvas`) are rendered as looping `<video>` elements in `src/components/music/MusicArtwork.tsx` if available.
- **Paxsenix & YouTube Fallbacks**: Track streams are resolved in `src/lib/music/extractor.ts`. We prioritize searching via `https://api.paxsenix.org/yt/search` and resolving audio streams via `/yt/ytaudio` using `PAXSENIX_API_KEY`. If the API fails or is unconfigured, we fall back to a local `yt-dlp` process.
- **I Don't Have Spotify**: `/api/idonthavespotify` is a proxy mapping to `https://api.paxsenix.org/tools/idonthavespotify` to resolve Spotify track URLs on other streaming platforms.

## Validation & Verification Rules

### Post-Change Verification Rule
- **Mandatory Build & Tests**: After completing any code changes, always check the change by running a build (`bun run build` or equivalent) or executing the test suite (`bun test` or `npm test`).
- **Create Tests If Needed**: If there is no existing test coverage for the modified path or feature, write a test script in `src/tests` or a scratch script in the `<appDataDir>\brain\<conversation-id>/scratch/` directory to run and verify correctness. Never assume changes are correct without running them.
