import { AnimatePresence, motion } from "framer-motion";
import { NextSeo } from "next-seo";
import { Headphones } from "lucide-react";
import { useMemo, useState } from "react";
import MusicArtwork from "../components/music/MusicArtwork";
import MusicArtistRow, {
  type ArtistGroup,
} from "../components/music/MusicArtistRow";
import MusicPeriodTabs from "../components/music/MusicPeriodTabs";
import MusicTrackCard from "../components/music/MusicTrackCard";
import MusicTrackSkeleton from "../components/music/MusicTrackSkeleton";
import { useTopTracks } from "../hooks/useTopTracks";
import {
  DEFAULT_MUSIC_PERIOD,
  MUSIC_PERIODS,
  formatPlaycount,
  type MusicPeriod,
  type MusicTrack,
} from "../lib/music";
import { PageFooter } from "./index";

type ViewMode = "tracks" | "artists";

export default function MusicPage() {
  const [period, setPeriod] = useState<MusicPeriod>(DEFAULT_MUSIC_PERIOD);
  const [viewMode, setViewMode] = useState<ViewMode>("tracks");
  const { tracks, isLoading } = useTopTracks(period);

  const activePeriod =
    MUSIC_PERIODS.find((p) => p.value === period) ?? MUSIC_PERIODS[0];
  const top = tracks[0];

  const maxPlaycount = tracks.reduce((m, t) => Math.max(m, t.playcount), 0);

  const totalScrobbles = tracks.reduce((s, t) => s + t.playcount, 0);

  const artistCounts = useMemo(
    () =>
      tracks.reduce<Record<string, number>>((acc, t) => {
        acc[t.artist] = (acc[t.artist] ?? 0) + 1;
        return acc;
      }, {}),
    [tracks]
  );

  const artistGroups = useMemo((): ArtistGroup[] => {
    const grouped = tracks.reduce<Record<string, MusicTrack[]>>((acc, t) => {
      (acc[t.artist] ??= []).push(t);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([artist, artistTracks]) => {
        const sorted = [...artistTracks].sort(
          (a, b) => b.playcount - a.playcount
        );
        return {
          artist,
          totalPlaycount: artistTracks.reduce((s, t) => s + t.playcount, 0),
          trackCount: artistTracks.length,
          topCover: sorted[0]?.cover ?? "",
          lastFmUrl: sorted[0]?.songUrl?.replace(/_\/.*/, "") ?? "",
          rank: 0,
        };
      })
      .sort((a, b) => b.totalPlaycount - a.totalPlaycount)
      .map((g, i) => ({ ...g, rank: i + 1 }));
  }, [tracks]);

  const maxArtistPlaycount = artistGroups.reduce(
    (m, g) => Math.max(m, g.totalPlaycount),
    0
  );

  return (
    <>
      <NextSeo
        title="music — abyn"
        description="Top tracks and scrobble history via Last.fm."
        canonical="https://abyn.xyz/music"
      />

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
              03 — Tracklist
            </p>
            <h1 className="gradient-text font-display text-5xl font-bold tracking-tight sm:text-6xl">
              Music
            </h1>
            <p className="mt-2 font-mono text-xs text-[var(--text-secondary)]">
              via Last.fm · {activePeriod.description}
              {!isLoading &&
                totalScrobbles > 0 &&
                ` · ${formatPlaycount(totalScrobbles)} plays`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MusicPeriodTabs
              active={period}
              onChange={(p) => {
                setPeriod(p);
                setViewMode("tracks");
              }}
            />

            <div
              className="inline-flex items-center gap-0.5 rounded-full border p-0.5"
              style={{
                borderColor: "var(--card-border)",
                background: "var(--bg-secondary)",
              }}
            >
              {(["tracks", "artists"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background:
                      viewMode === mode ? "var(--accent)" : "transparent",
                    color:
                      viewMode === mode
                        ? "var(--accent-text)"
                        : "var(--text-secondary)",
                  }}
                >
                  {mode === "tracks" ? "Tracks" : "Artists"}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {!isLoading && top && viewMode === "tracks" && (
          <motion.a
            href={top.songUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 }}
            className="surface-card interactive-lift group mb-8 flex items-center gap-5 rounded-2xl p-4 sm:p-5"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border sm:h-24 sm:w-24"
              style={{ borderColor: "var(--card-border)" }}
            >
              <MusicArtwork
                src={top.cover}
                alt={`${top.title} cover`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
                01 · Top track
              </div>
              <p className="font-display text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] sm:text-2xl">
                {top.title}
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                {top.artist}
              </p>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)]">
                <Headphones className="h-3.5 w-3.5" />
                {formatPlaycount(top.playcount)}
              </div>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                scrobbles
              </p>
            </div>
          </motion.a>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: "var(--card-border)",
            background: "var(--card-bg)",
          }}
        >
          <div
            className="
              grid grid-cols-[56px_1fr] items-center border-b px-3
              py-2.5
              sm:grid-cols-[2rem_3.5rem_1fr_auto]
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            <span className="hidden text-right font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] sm:block">
              #
            </span>

            <span className="hidden sm:block" />

            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)]">
              {viewMode === "tracks" ? "Title" : "Artist"}
            </span>

            <span className="hidden font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] sm:block">
              Plays
            </span>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key={`loading-${period}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-b last:border-0"
                    style={{
                      borderColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <MusicTrackSkeleton index={i} />
                  </div>
                ))}
              </motion.div>
            ) : viewMode === "tracks" && tracks.length > 0 ? (
              <motion.div
                key={`tracks-${period}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tracks.map((track, index) => (
                  <div
                    key={`${track.songUrl}-${track.rank}`}
                    className="border-b last:border-0"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <MusicTrackCard
                      track={track}
                      index={index}
                      maxPlaycount={maxPlaycount}
                      artistCount={artistCounts[track.artist]}
                    />
                  </div>
                ))}
              </motion.div>
            ) : viewMode === "artists" && artistGroups.length > 0 ? (
              <motion.div
                key={`artists-${period}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {artistGroups.map((group, index) => (
                  <div
                    key={group.artist}
                    className="border-b last:border-0"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <MusicArtistRow
                      group={group}
                      index={index}
                      maxPlaycount={maxArtistPlaycount}
                    />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={`empty-${period}-${viewMode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-14 text-center"
              >
                <p className="font-display text-xl font-bold text-[var(--text-primary)]">
                  No tracks found
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Nothing was scrobbled in this window.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12">
          <PageFooter />
        </div>
      </main>
    </>
  );
}
