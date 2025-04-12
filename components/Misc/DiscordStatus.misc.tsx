import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useState, MouseEvent, useCallback } from "react";

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
};

// Throttle function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  // Handle mouse movement for tilt effect
  const onMouseMove = useCallback(
    throttle((e: MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      const box = card.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;
      const centerX = box.width / 2;
      const centerY = box.height / 2;
      const rotateX = (y - centerY) / 10; // Reduced intensity
      const rotateY = (centerX - x) / 10; // Reduced intensity

      setRotate({ x: rotateX, y: rotateY });
    }, 100),
    []
  );

  const onMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

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
        // Trigger animation after data loads
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-64 mx-auto font-sen mb-4 flex flex-col items-center gap-1 text-xs text-gray-300">
        <p className="text-white text-xs">Loading status...</p>
      </div>
    );
  }

  return (
    <div className="w-64 mx-auto font-sen mb-4 flex flex-col items-center gap-1.5 text-xs text-gray-300">
      <p className="text-white text-xs">
        See what I&apos;m currently doing
      </p>
      {status?.isActive ? (
        <div 
          className={`w-full transform transition-all duration-300 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)`,
            transition: "all 400ms cubic-bezier(0.03, 0.98, 0.52, 0.99) 0s",
          }}
        >
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-800 opacity-75 blur-sm" />
          <div className="relative flex items-center gap-2 p-2 rounded-lg bg-zinc-900 shadow-md">
            {status.activity?.image && (
              <div className="relative flex-shrink-0 w-10 h-10">
                <Image
                  src={status.activity.image}
                  width={40}
                  height={40}
                  alt={status.activity.name || 'Activity'}
                  className="rounded-md"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <p className="text-white text-xs font-medium truncate">
                {status.activity?.name}
              </p>
              <p className="text-gray-400 text-[10px] truncate">
                {status.activity?.details || status.activity?.state}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`w-full transition-all duration-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)`,
            transition: "all 400ms cubic-bezier(0.03, 0.98, 0.52, 0.99) 0s",
          }}
        >
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-800 opacity-75 blur-sm" />
          <div className="relative flex items-center justify-center p-2 rounded-lg bg-zinc-900 shadow-md">
            <span className="text-xs text-gray-400">
              {status?.message || 'Not doing anything'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscordStatus;