# How This Site Works: Under the Hood

Hey, I'm Abyan.

If you've spent more than a couple of minutes clicking around here, you might have noticed things are constantly moving. The music player syncs with whatever I'm listening to, the "Recently Active" card shows what I've been coding or playing, and the guestbook is always open for comments.

Here is a quick look behind the scenes at how everything actually fits together.

---

## The Core Tech Stack

I like to keep things fast, simple, and dependency-light whenever I can (though let's be honest, I still find ways to overcomplicate it). 

- **Next.js & React**: The frontend is built using Next.js (using the Pages router). It gives me a clean structure and handles API routes without needing to spin up a separate backend server.
- **Tailwind CSS & Custom Globals**: Styling is handled by Tailwind. I use custom CSS variables in `globals.css` to build light and dark themes with glassmorphic elements.
- **Bun**: I use Bun as my local development environment and run runtime scripts with it. It’s incredibly fast and has everything I need out of the box.
- **SQLite (via `bun:sqlite`)**: Instead of running a heavy PostgreSQL or Redis instance, I'm using Bun's built-in SQLite database (`kv.sqlite` in the project root) mapped through a simple KV helper. It holds guestbook entries, visitor stats, weather cache, and other local data.
- **Cloud Storage (S3)**: If I'm using a production S3-compatible bucket, the blog uses S3 to store post markdown and images. If not, it falls back to the SQLite KV store.

---

## 1. The Spotify Sync Engine

This is easily the most fun part of the site, but also the most prone to edge cases. The code lives under `src/lib/music/` and `src/components/music/`.

```
Spotify API ──> sync.ts ──> MusicPlayerContext ──> Audio Player ──> UI
```

Here's how it coordinates media playback:
- **Spotify Polling**: The file `sync.ts` constantly polls the Spotify API to check what track is active.
- **The Listening-Along Mode**: If Spotify owns playback, the local audio player mirrors Spotify exactly. If a track ends locally before the Spotify status updates, the player stops and waits rather than advancing on its own.
- **Stream Resolution**: When you hit play, the player resolves the track. It queries a Paxsenix search API, falls back to the Paxsenix audio endpoint, and uses a local `yt-dlp` resolver on the server as a last-resort fallback.
- **Spotify Canvas**: The dynamic background uses looping `<video>` elements fetched from `/spotify/canvas` (no converting to heavy GIFs!).
- **Synced Lyrics**: Renders lyrics from Spotify in real-time, syncing to the current audio cursor.

---

## 2. Discord Live Status & Activity History

You might see me idling in Zed, working on this website, or playing a game. That card isn't static—it updates in real-time.

- **Discord API & Lanyard**: The frontend fetches `/api/discord-status` and `/api/discord-activities` to grab my Discord status.
- **Recently Active Deck**: When I'm offline, the site shows a collapsed "deck" of my recent activities. It matches the glassmorphism of the rest of the site (now with a slightly translucent backdrop and a solid icon thumbnail on top, because contrast matters!).
- **Modals**: Clicking "Open details" on a game or a server pulls up detailed info queried directly from Discord's CDN and the local APIs.

---

## 3. The Guestbook & Blog

- **Guestbook**: Users can sign, leave comments, and leave likes. The authentication checks ensure nobody spams the API (there's also webhook notifications configured to ping my Discord server if someone goes wild or tries to brute-force).
- **Blog System**: Implements markdown rendering with an admin dashboard where I can write, edit drafts, and upload files. Post slugs are converted dynamically, and comments are saved straight to the SQLite KV store.

---

## A Small Confession

As you can probably tell from reading the source code, I'm the type of developer who says:
> "I'll just fix this one styling bug."

Four hours later, I've refactored the entire audio sync engine, rewritten the theme variables, added transition animations to the modal overlays, and somehow read up on how Web Audio API analyser nodes work under the hood. Scope creep is real, but it's how I learn.

If you come back next week, something will probably look different. That's just how it goes!

Thanks for checking out the project :>
