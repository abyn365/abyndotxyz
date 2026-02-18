import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiActivity } from "react-icons/fi";

type StatusData = {
  isActive: boolean;
  status: string;
  activity?: {
    name: string;
    details?: string;
    state?: string;
    image?: string | null;
  };
  message?: string;
  activeDevice?: string;
};

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/discord-status');
        const data = await res.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-white">
          See what I&apos;m currently doing
        </p>
        {status?.activeDevice && (
          <span className="rounded-full border border-zinc-700/70 bg-zinc-800/80 px-2.5 py-1 text-[11px] text-zinc-300">
            Active on {status.activeDevice}
          </span>
        )}
      </div>
      
      <div className="w-full overflow-hidden rounded-xl border border-zinc-700/60 bg-gradient-to-r from-zinc-900/95 to-zinc-900/80 shadow-[0_10px_25px_rgba(0,0,0,0.22)] transition-all md:rounded-2xl">
        <div className="flex items-start gap-3 p-3 sm:p-4 md:gap-4 md:p-5">
          {status?.activity?.image ? (
            <Image
              src={status.activity.image}
              width={64}
              height={64}
              alt={status.activity.name}
              className="h-12 w-12 flex-shrink-0 rounded-md border border-zinc-700/50 object-cover sm:h-14 sm:w-14 md:h-16 md:w-16 md:rounded-lg"
              unoptimized
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-800 sm:h-14 sm:w-14 md:h-16 md:w-16 md:rounded-lg">
              <FiActivity className="h-6 w-6 text-zinc-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <FiActivity className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Discord Activity
              </span>
            </div>
            <div className="mb-1 text-sm font-semibold text-white sm:text-base">
              <span className="block truncate">
                {status?.activity?.name || 'Not Active'}
              </span>
            </div>
            {status?.activity?.name ? (
              <>
                {status.activity.details && (
                  <p className="truncate text-xs text-zinc-300 sm:text-sm">
                    {status.activity.details}
                  </p>
                )}
                {status.activity.name === 'YouTube' && status.activity.state && (
                  <p className="truncate pt-0.5 text-[11px] text-zinc-500 sm:text-xs">
                    {status.activity.state}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-zinc-400 sm:text-sm">
                Not doing anything right now
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscordStatus;
