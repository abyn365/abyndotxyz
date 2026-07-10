import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import { Gamepad2, ChevronDown, ChevronUp } from "lucide-react";
import type { ActivityHistoryEntry } from "../../pages/api/discord-activities";

interface ActivityHistoryProps {
  onOpenDetails: (applicationId: string, name: string) => void;
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}

export default function ActivityHistory({ onOpenDetails }: ActivityHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, error } = useSWR<{ activities: ActivityHistoryEntry[] }>(
    "/api/discord-activities",
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  if (error || !data || !data.activities || data.activities.length === 0) {
    return null;
  }

  // Collapsed view showing the stacked cards deck
  if (!isExpanded) {
    const act = data.activities[0];
    const iconUrl = act.applicationId
      ? `https://dcdn.dstn.to/app-icons/${act.applicationId}.webp?size=128`
      : null;

    return (
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--discord-card-secondary)]">
            Recently Active
          </h3>
          {data.activities.length > 1 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)] hover:underline select-none"
            >
              Show all ({data.activities.length}) <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="relative mb-4">
          {/* Main Card */}
          <div
            onClick={() => {
              if (data.activities.length > 1) {
                setIsExpanded(true);
              }
            }}
            className={`relative z-10 flex items-center gap-4 overflow-hidden rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] p-4 text-left transition-all backdrop-blur-md ${
              data.activities.length > 1 ? "cursor-pointer hover:bg-[rgba(255,255,255,0.02)] active:scale-[0.995]" : ""
            }`}
          >
            {/* App Icon */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--discord-card-border)] bg-[#1e1f22] flex items-center justify-center">
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconUrl}
                  alt={act.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      const fallbackIcon = parent.querySelector(".fallback-icon");
                      if (fallbackIcon) fallbackIcon.classList.remove("hidden");
                    }
                  }}
                />
              ) : null}
              <div
                className={`fallback-icon ${iconUrl ? "hidden" : ""} flex items-center justify-center`}
              >
                <Gamepad2 className="h-6 w-6 text-neutral-400" />
              </div>
            </div>

            {/* Activity Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="truncate text-sm font-bold text-[var(--discord-card-text)]">
                  {act.name}
                </h4>
                <span className="shrink-0 font-mono text-[10px] text-[var(--discord-card-secondary)]">
                  {getRelativeTime(act.lastSeen)}
                </span>
              </div>

              {act.details && (
                <p className="mt-0.5 truncate text-xs text-[var(--discord-card-secondary)]">
                  {act.details}
                </p>
              )}
              {act.state && (
                <p className="truncate text-xs text-[var(--discord-card-secondary)] opacity-85">
                  {act.state}
                </p>
              )}

              {act.applicationId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card expansion when details is clicked
                    onOpenDetails(act.applicationId!, act.name);
                  }}
                  className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)] hover:underline"
                >
                  Open details
                </button>
              )}
            </div>
          </div>

          {/* Stacked background cards deck visual effect */}
          {data.activities.length > 1 && (
            <>
              {/* Middle card outline */}
              <div className="absolute inset-0 z-0 rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-bg)] shadow-sm pointer-events-none transform translate-y-1.5 scale-[0.98] backdrop-blur-sm" />
              {/* Back card outline */}
              <div className="absolute inset-0 -z-10 rounded-lg border border-[var(--discord-card-border)]/40 bg-[var(--discord-card-bg)] shadow-sm pointer-events-none transform translate-y-3 scale-[0.96] backdrop-blur-sm" />
            </>
          )}
        </div>
      </div>
    );
  }

  // Expanded list view
  return (
    <div className="mt-6 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--discord-card-secondary)]">
          Recently Active
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)] hover:underline select-none"
        >
          Collapse <ChevronUp className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1.5 scrollbar-thin">
        {data.activities.map((act, index) => {
          const iconUrl = act.applicationId
            ? `https://dcdn.dstn.to/app-icons/${act.applicationId}.webp?size=128`
            : null;

          return (
            <div
              key={`${act.name}-${index}`}
              className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] p-4 text-left transition-all hover:bg-[rgba(255,255,255,0.02)] backdrop-blur-md"
            >
              {/* App Icon */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--discord-card-border)] bg-[#1e1f22] flex items-center justify-center">
                {iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl}
                    alt={act.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) {
                        const fallbackIcon = parent.querySelector(".fallback-icon");
                        if (fallbackIcon) fallbackIcon.classList.remove("hidden");
                      }
                    }}
                  />
                ) : null}
                <div
                  className={`fallback-icon ${iconUrl ? "hidden" : ""} flex items-center justify-center`}
                >
                  <Gamepad2 className="h-6 w-6 text-neutral-400" />
                </div>
              </div>

              {/* Activity Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate text-sm font-bold text-[var(--discord-card-text)]">
                    {act.name}
                  </h4>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--discord-card-secondary)]">
                    {getRelativeTime(act.lastSeen)}
                  </span>
                </div>

                {/* State/Details */}
                {act.details && (
                  <p className="mt-0.5 truncate text-xs text-[var(--discord-card-secondary)]">
                    {act.details}
                  </p>
                )}
                {act.state && (
                  <p className="truncate text-xs text-[var(--discord-card-secondary)] opacity-85">
                    {act.state}
                  </p>
                )}

                {/* Open details action */}
                {act.applicationId && (
                  <button
                    onClick={() => onOpenDetails(act.applicationId!, act.name)}
                    className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)] hover:underline"
                  >
                    Open details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
