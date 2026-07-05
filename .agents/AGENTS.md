# AGENTS.md

> Developer guidelines and architectural constraints for this project.
>
> These rules are mandatory unless explicitly overridden by the repository owner.

---

# Core Engineering Principles

## Performance First

Prioritize runtime performance, responsiveness, and low memory usage over convenience.

Avoid introducing unnecessary abstractions, providers, wrappers, or dependencies when native platform features or Bun APIs provide equivalent functionality.

Every feature should scale well under heavy usage.

---

## Keep Code Simple

- Prefer readable code over clever code.
- Keep functions focused on a single responsibility.
- Remove dead code immediately.
- Avoid premature abstractions.
- Minimize dependency count.
- Prefer native Bun, Web APIs, and browser APIs whenever practical.

---

## Preserve Existing Behavior

Unless explicitly requested:

- Never remove existing features.
- Never change public APIs.
- Never silently alter UX.
- New functionality must remain backwards compatible.

---

# Performance Rules

## React High-Frequency State

High-frequency values include:

- playback position
- elapsed time
- progress bars
- visualizers
- animations
- mouse coordinates
- scroll positions
- drag operations

Never place these values inside:

- React Context
- top-level state
- global stores

Doing so creates unnecessary render cascades.

Instead use:

- `requestAnimationFrame`
- `useRef`
- direct DOM updates
- localized component state

Only commit React state when the UI actually needs reconciliation.

---

## Avoid Re-render Cascades

Before lifting state upward, ask:

> Does another component actually need this?

If not:

Keep the state local.

Memoize expensive components using:

- `React.memo`
- `useMemo`
- `useCallback`

only when profiling shows a measurable benefit.

---

## Expensive Backend Operations

Heavy operations include:

- yt-dlp
- ffmpeg
- child processes
- media extraction
- expensive fetches
- metadata generation

Never execute duplicate work simultaneously.

Always deduplicate using an in-flight promise map.

Example:

```ts
const activePromises = new Map<string, Promise<Result>>();

if (activePromises.has(id))
    return activePromises.get(id)!;

const promise = expensiveOperation(id)
    .finally(() => activePromises.delete(id));

activePromises.set(id, promise);

return promise;
```

---

## Cache Aggressively

Cache whenever data is:

- deterministic
- expensive to compute
- frequently requested

Examples:

- resolved streams
- extracted metadata
- Spotify lookups
- image URLs
- lyrics
- canvas URLs

Always define an appropriate cache TTL.

---

## Network Requests

Batch requests whenever possible.

Avoid waterfalls.

Prefer:

- parallel fetches
- Promise.all()
- request deduplication
- stale-while-revalidate

---

# Architecture

## Music Synchronization

### Sync Engine

```
Spotify API
      ↓
sync.ts
      ↓
MusicPlayerContext
      ↓
Audio Player
      ↓
UI
```

`src/lib/music/sync.ts`

is the single source of truth for Spotify synchronization.

---

### Sync Modes

#### listening-along

Spotify owns playback.

The local player mirrors Spotify exactly.

If a song finishes locally before Spotify changes tracks:

- stop playback
- mark `endedLocally = true`
- wait for Spotify

Never automatically advance.

---

#### manual

User owns playback.

Queue advances locally without Spotify.

---

## Audio Pipeline

```
Extractor
      ↓
Audio Player
      ↓
HTML5 Audio
      ↓
Web Audio API
      ↓
Visualizer
```

### Audio Player

Responsible for:

- playback
- buffering
- seeking
- analyser nodes
- playback events

File:

```
src/lib/music/audio-player.ts
```

---

## Stream Resolution

Priority order:

1. Paxsenix search
2. Paxsenix audio endpoint
3. local yt-dlp fallback

Never reverse this order unless requested.

---

## Canvas

Spotify Canvas videos come from

```
GET /spotify/canvas
```

Render using looping `<video>` elements.

Do not convert Canvas videos into GIFs.

---

## Spotify-Free Resolver

```
/api/idonthavespotify
```

acts as a proxy to

```
https://api.paxsenix.org/tools/idonthavespotify
```

This endpoint converts Spotify URLs into links on other streaming platforms.

---

# Bun Guidelines

Prefer Bun-native APIs whenever available.

Examples:

- Bun.serve()
- Bun.file()
- Bun.write()
- Bun.sql
- Bun.redis
- Bun.spawn()
- Bun.password
- Bun.sleep()

Avoid introducing Node packages that duplicate Bun functionality.

---

# Error Handling

Never silently swallow errors.

Wrap external operations with:

- descriptive logging
- retry logic when appropriate
- graceful fallbacks

User-facing failures should always provide meaningful messages.

---

# Validation

Every completed code change must be verified.

Minimum verification:

- `bun run build`

or

- relevant test suite

If tests do not exist:

- create a focused test
- or create a scratch verification script

Never assume changes work without executing them.

---

# Project Knowledge Base

## Important Files

### Synchronization

```
src/lib/music/sync.ts
```

Spotify polling and synchronization.

---

### Audio Engine

```
src/lib/music/audio-player.ts
```

Handles playback and Web Audio.

---

### Stream Resolver

```
src/lib/music/extractor.ts
```

Handles Paxsenix and yt-dlp fallback.

---

### Artwork

```
src/components/music/MusicArtwork.tsx
```

Displays album art and Canvas videos.

---

### Player Context

```
src/components/music/MusicPlayerContext.tsx
```

Coordinates playback state.

Avoid placing rapidly-changing values here.

# Layout & Component Guidelines

## Global Layouts

Never render layout components (like `<Navbar />`) inside individual page routes if they are already wrapped globally in `src/pages/_app.tsx`. Always inspect `_app.tsx` first to identify global layout providers.

---

## Responsive Form Design

When rendering user forms inside column-based grids or narrow containers, layout fields and submit buttons vertically using `flex flex-col` rather than inline `flex` groups to prevent container overflow on narrower viewports.

---

## Bun Type Signatures

If native Bun APIs (e.g., `Bun.CSRF.generate`, `Bun.CSRF.verify`, `Bun.secrets.get`) trigger TypeScript compilation errors due to outdated local `bun-types` packages, use standard options shapes and cast option blocks to `as any`.

---

## Dynamically Added Pages in Turbopack

Creating new route endpoints in `src/pages/api/` or `src/pages/` while `bun run dev` (Turbopack) is active can trigger module resolution failures. Always instruct restarting the development server to rebuild the route list.

---

# Coding Style

- Prefer TypeScript strict mode.
- Avoid `any`.
- Prefer explicit return types for exported functions.
- Keep imports sorted.
- Remove unused imports immediately.
- Prefer composition over inheritance.
- Prefer immutable data structures when practical.

---

# Pull Request Checklist

Before considering work complete:

- [ ] Project builds successfully
- [ ] Tests pass
- [ ] No duplicate backend work introduced
- [ ] No unnecessary React re-renders introduced
- [ ] No new heavy dependencies added
- [ ] Existing behavior preserved
- [ ] Error handling included
- [ ] Logging remains useful
- [ ] Performance impact considered
