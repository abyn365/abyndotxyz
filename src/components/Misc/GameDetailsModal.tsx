import React from "react";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Star, Calendar, Users, Monitor, Smartphone, Cpu, Gamepad2 } from "lucide-react";

interface GameDetailsModalProps {
  gameId: string;
  gameName?: string;
  onClose: () => void;
}

const PLATFORM_MAP: Record<number, { name: string; icon: React.ReactNode }> = {
  0: { name: "Desktop", icon: <Monitor className="h-3 w-3" /> },
  1: { name: "Xbox", icon: <Cpu className="h-3 w-3" /> },
  2: { name: "PlayStation", icon: <Cpu className="h-3 w-3" /> },
  3: { name: "iOS", icon: <Smartphone className="h-3 w-3" /> },
  4: { name: "Android", icon: <Smartphone className="h-3 w-3" /> },
  5: { name: "Nintendo Switch", icon: <Cpu className="h-3 w-3" /> },
  6: { name: "Linux", icon: <Monitor className="h-3 w-3" /> },
  7: { name: "macOS", icon: <Monitor className="h-3 w-3" /> },
};

const THEME_MAP: Record<number, string> = {
  0: "Thriller",
  1: "Sci-Fi",
  2: "Action",
  3: "Horror",
  4: "Survival",
  5: "Fantasy",
  6: "Historical",
  7: "Stealth",
  8: "Comedy",
  9: "Business",
  10: "Drama",
  11: "Non-Fiction",
  12: "Kids",
  13: "Sandbox",
  14: "Open World",
  15: "Warfare",
  16: "Educational",
  17: "Mystery",
  18: "Party",
  19: "Romance",
  20: "Erotic",
};

const OPENS_CRITIC_TIERS: Record<number, string> = {
  1: "Mighty",
  2: "Strong",
  3: "Fair",
  4: "Weak",
};

export default function GameDetailsModal({ gameId, gameName, onClose }: GameDetailsModalProps) {
  const url = gameName
    ? `/api/game-profile?gameId=${gameId}&name=${encodeURIComponent(gameName)}`
    : `/api/game-profile?gameId=${gameId}`;
  const { data, error } = useSWR<any>(url, fetcher);

  const isLoading = !data && !error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* Modal Content Wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#111214]/90 text-neutral-200 shadow-2xl backdrop-blur-xl flex flex-col max-h-[85vh]"
      >
        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-black/40 p-1.5 text-neutral-400 hover:bg-black/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="font-mono text-xs text-neutral-400">Loading game profile...</p>
          </div>
        ) : error || !data ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="text-2xl">⚠️</span>
            <p className="font-mono text-xs text-red-400">Failed to load game profile.</p>
            <button
              onClick={onClose}
              className="mt-3 rounded border border-white/10 px-3 py-1 font-mono text-[10px] uppercase hover:bg-white/5"
            >
              Close
            </button>
          </div>
        ) : data.is_fallback ? (
          <>
            {/* Banner Background */}
            <div className="relative h-44 w-full bg-cover bg-center shrink-0">
              <div className="h-full w-full bg-gradient-to-r from-indigo-900/60 to-neutral-900" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-[#111214]/50 to-transparent" />

              {/* Title Overlay Info */}
              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/10 bg-black/40 shadow-lg shrink-0 hidden sm:flex">
                  <Gamepad2 className="h-10 w-10 text-neutral-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">{data.name}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                      Verified Application
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400">
                      ID: {data.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable details body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Fallback explanation */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                  {data.has_user_token ? "ℹ️ Unverified Discord Application" : "⚠️ Discord API Limitation"}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-neutral-300">
                  {data.has_user_token ? (
                    "This application is unverified or has no supplemental database metadata registered in Discord's system. User Rich Presence details are active, but supplemental description cards are unavailable."
                  ) : (
                    "Discord restricts its supplemental game database metadata (descriptions, genres, publishers, reviews, and screenshots) to User Accounts only. Bots are forbidden from accessing this information."
                  )}
                </p>
                {!data.has_user_token && (
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                    To view full details cards, you can add a <code className="rounded bg-black/30 px-1 py-0.5 text-amber-300">DISCORD_TOKEN</code> to your local <code className="rounded bg-black/30 px-1 py-0.5 text-neutral-300">.env</code> file.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                  Quick Search External Profiles
                </h4>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={`https://store.steampowered.com/search/?term=${encodeURIComponent(data.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-white/5 px-4 py-2.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-white/10"
                  >
                    Search on Steam
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(data.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-white/5 px-4 py-2.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-white/10"
                  >
                    Search on Google
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-white/5 bg-black/25 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-text)] transition-colors hover:opacity-90"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Banner Background */}
            <div className="relative h-44 w-full bg-cover bg-center shrink-0">
              {data.supplemental_game_data?.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.supplemental_game_data.cover_image_url}
                  alt={data.name}
                  className="h-full w-full object-cover blur-sm opacity-30"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-indigo-950 to-neutral-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-[#111214]/50 to-transparent" />

              {/* Title Overlay Info */}
              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                {data.supplemental_game_data?.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.supplemental_game_data.cover_image_url}
                    alt={data.name}
                    className="h-24 w-18 rounded border border-white/10 object-cover shadow-lg shrink-0 hidden sm:block"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">{data.name}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {/* Platforms */}
                    {data.platforms?.map((pId: number) => {
                      const plat = PLATFORM_MAP[pId];
                      if (!plat) return null;
                      return (
                        <span
                          key={pId}
                          className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400"
                        >
                          {plat.icon}
                          {plat.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable details body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary / Description */}
              {data.supplemental_game_data?.summary && (
                <div>
                  <p className="text-xs leading-relaxed text-neutral-300">
                    {data.supplemental_game_data.summary}
                  </p>
                </div>
              )}

              {/* Metadata columns */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  {/* Genres / Themes */}
                  {data.genres && data.genres.length > 0 && (
                    <div>
                      <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                        Genres & Themes
                      </h4>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {data.genres.map((g: any, idx: number) => {
                          const themeName = typeof g === "string" ? g : THEME_MAP[g];
                          if (!themeName) return null;
                          return (
                            <span
                              key={idx}
                              className="rounded border border-white/5 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-400"
                            >
                              {themeName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Developers / Publishers */}
                  {(data.supplemental_game_data?.developer_names ||
                    data.supplemental_game_data?.publisher_names) && (
                    <div>
                      <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                        Companies
                      </h4>
                      <p className="mt-1 text-xs text-neutral-400">
                        {data.supplemental_game_data?.developer_names && (
                          <span>
                            Dev: {data.supplemental_game_data.developer_names.join(", ")}
                          </span>
                        )}
                        {data.supplemental_game_data?.publisher_names && (
                          <span className="block mt-0.5">
                            Pub: {data.supplemental_game_data.publisher_names.join(", ")}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Review Ratings */}
                  {(data.supplemental_game_data?.reviews?.steam ||
                    data.supplemental_game_data?.reviews?.opencritic) && (
                    <div>
                      <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                        Reviews & Ratings
                      </h4>
                      <div className="mt-2 space-y-2">
                        {/* Steam Rating */}
                        {data.supplemental_game_data.reviews.steam && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-blue-400">Steam:</span>
                            <span className="flex items-center gap-0.5 text-neutral-300">
                              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                              {Math.round(data.supplemental_game_data.reviews.steam.rating * 100)}%
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              ({data.supplemental_game_data.reviews.steam.rating_count?.toLocaleString()} reviews)
                            </span>
                          </div>
                        )}

                        {/* OpenCritic Rating */}
                        {data.supplemental_game_data.reviews.opencritic && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-orange-400">OpenCritic:</span>
                            <span className="text-neutral-300">
                              {data.supplemental_game_data.reviews.opencritic.top_critic_rating || "N/A"}/100
                            </span>
                            {data.supplemental_game_data.reviews.opencritic.tier && (
                              <span className="rounded bg-orange-500/10 px-1 py-0.5 text-[9px] text-orange-400">
                                {OPENS_CRITIC_TIERS[data.supplemental_game_data.reviews.opencritic.tier]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Release Date */}
                  {data.supplemental_game_data?.first_release_date && (
                    <div>
                      <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                        Release Date
                      </h4>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(data.supplemental_game_data.first_release_date).toLocaleDateString(
                          undefined,
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Screenshots Gallery */}
              {data.supplemental_game_data?.screenshot_urls &&
                data.supplemental_game_data.screenshot_urls.length > 0 && (
                  <div>
                    <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-2">
                      Screenshots
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {data.supplemental_game_data.screenshot_urls
                        .slice(0, 4)
                        .map((url: string, idx: number) => (
                          <div
                            key={idx}
                            className="aspect-video overflow-hidden rounded-md border border-white/5 bg-neutral-900"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Screenshot ${idx + 1}`}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* External Links */}
              {data.supplemental_game_data?.websites &&
                data.supplemental_game_data.websites.length > 0 && (
                  <div>
                    <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-2">
                      Links
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.supplemental_game_data.websites.map(
                        (site: { url: string; category: number }, idx: number) => (
                          <a
                            key={idx}
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-300 transition-colors hover:bg-white/10"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Link #{idx + 1}</span>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
