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
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <p className="text-white text-sm">
          See what I&apos;m currently doing
        </p>
        {status?.activeDevice && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            Active on {status.activeDevice}
          </span>
        )}
      </div>
      
      <div className="w-full max-w-sm rounded-lg border border-zinc-800/50 overflow-hidden bg-zinc-900">
        <div className="p-3 flex items-center gap-2">
          {status?.activity?.image ? (
            <Image
              src={status.activity.image}
              width={48}
              height={48}
              alt={status.activity.name}
              className="rounded-md flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-12 h-12 bg-zinc-800 rounded-md flex items-center justify-center flex-shrink-0">
              <FiActivity className="h-6 w-6 text-zinc-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Discord Activity Header */}
            <div className="flex items-center gap-1">
              <FiActivity className="h-3 w-3 text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-medium text-white truncate">
                {status?.activity?.name || 'Not Active'}
              </span>
            </div>
            {status?.activity?.name ? (
              <>
                {/* Only show details and state */}
                {status.activity.details && (
                  <p className="text-[10px] text-gray-400 truncate">
                    {status.activity.details}
                  </p>
                )}
                {/* Add channel name for YouTube */}
                {status.activity.name === 'YouTube' && status.activity.state && (
                  <p className="text-[10px] text-gray-500 truncate">
                    {status.activity.state}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[10px] text-gray-400">
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