import React from "react";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import { motion } from "framer-motion";
import { X, Users, ShieldAlert, Award } from "lucide-react";

interface GuildDetailsModalProps {
  guildId: string;
  onClose: () => void;
}

export default function GuildDetailsModal({ guildId, onClose }: GuildDetailsModalProps) {
  const { data, error } = useSWR<any>(`/api/guild-profile?guildId=${guildId}`, fetcher);

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

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#111214]/90 text-neutral-200 shadow-2xl backdrop-blur-xl flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-black/40 p-1.5 text-neutral-400 hover:bg-black/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {isLoading ? (
          <div className="flex h-60 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="font-mono text-xs text-neutral-400">Loading server profile...</p>
          </div>
        ) : error || !data ? (
          <div className="flex h-60 flex-col items-center justify-center gap-2 p-6 text-center">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            <p className="font-mono text-xs text-red-400">Failed to load server profile.</p>
            <button
              onClick={onClose}
              className="mt-3 rounded border border-white/10 px-3 py-1 font-mono text-[10px] uppercase hover:bg-white/5"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Cohesive Header Gradient */}
            <div className="relative h-24 w-full shrink-0 bg-gradient-to-r from-indigo-950/60 to-neutral-900" />

            {/* Content Body */}
            <div className="relative px-6 pb-6 pt-0 flex flex-col items-center -mt-10 text-center">
              {/* Server Icon Placement */}
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-[#111214] bg-neutral-900 shadow-xl shrink-0 flex items-center justify-center">
                {data.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://cdn.discordapp.com/icons/${data.id}/${data.icon}.${data.icon.startsWith("a_") ? "gif" : "png"}?size=256`}
                    alt={data.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-neutral-400">
                    {data.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Server Title */}
              <h3 className="mt-3 text-lg font-bold text-white tracking-tight">{data.name}</h3>

              {/* Members stats */}
              {(data.approximate_member_count || data.approximate_presence_count) && (
                <div className="mt-2 flex items-center justify-center gap-4 text-xs font-mono text-neutral-400">
                  {data.approximate_presence_count && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {data.approximate_presence_count.toLocaleString()} Online
                    </span>
                  )}
                  {data.approximate_member_count && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      {data.approximate_member_count.toLocaleString()} Members
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {data.description && (
                <p className="mt-4 text-xs leading-relaxed text-neutral-300 max-w-sm">
                  {data.description}
                </p>
              )}

              {/* Features / Badges */}
              {data.features && data.features.length > 0 && (
                <div className="mt-5 w-full text-left">
                  <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-2 text-center">
                    Server Features
                  </h4>
                  <div className="flex flex-wrap justify-center gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {data.features.slice(0, 8).map((feat: string, idx: number) => (
                      <span
                        key={idx}
                        className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-mono text-neutral-400 uppercase tracking-wide"
                      >
                        {feat.replace(/_/g, " ")}
                      </span>
                    ))}
                    {data.features.length > 8 && (
                      <span className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-mono text-neutral-400 uppercase tracking-wide">
                        +{data.features.length - 8} more
                      </span>
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
