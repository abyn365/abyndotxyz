import type { NextComponentType } from "next";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import { useState } from "react";

type Track = {
  artist: string;
  title: string;
  songUrl: string;
  cover: string;
};

const TopTracks: NextComponentType = () => {
  const { data } = useSWR<{ tracks: Track[] }>("/api/top-tracks", fetcher);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data?.tracks) return null;

  return (
    <div className="font-sen -mt-4 flex flex-col gap-2 text-sm text-gray-300 fade-in">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-2 bg-zinc-900/50 rounded-lg hover:bg-zinc-900/70 transition-all"
      >
        <span className="text-white hover:text-[#ff6347] transition-colors">My Top Tracks</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="flex flex-col gap-y-3 mt-2">
          {data.tracks.map((track, index) => (
            <Link 
              key={track.songUrl}
              href={track.songUrl}
              className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-gray-400 w-4">{index + 1}</span>
              <Image
                src={track.cover}
                width={40}
                height={40}
                alt={track.title}
                className="rounded"
              />
              <div className="flex flex-col overflow-hidden">
                <p className="text-white truncate hover:text-[#ff6347] transition-colors">
                  {track.title}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {track.artist}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopTracks;