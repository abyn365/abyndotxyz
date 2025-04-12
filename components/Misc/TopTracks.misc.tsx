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
  albumYear: string;
  popularity: number;
  genre: string[];
  isArtistGenre: boolean;
  duration: number;
};

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

const TopTracks: NextComponentType = () => {
  const { data } = useSWR<{ tracks: Track[] }>("/api/top-tracks", fetcher);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data?.tracks) return null;

  return (
    <div className="font-sen -mt-4 flex flex-col gap-2 text-sm text-gray-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-2 bg-zinc-900/50 rounded-lg hover:bg-zinc-900/70 transition-all"
      >
        <span className="text-white hover:text-[#ff6347] transition-colors truncate">My Top Tracks</span>
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
            <div key={track.songUrl} className="flex flex-col">
              <Link 
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
                className="rounded top"
              />
              <div className="flex flex-col overflow-hidden">
                <p className="text-white truncate hover:text-[#ff6347] transition-colors ">
                  {track.title}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {track.artist}
                </p>
              </div>
            </Link>
              
              {/* Add stats section */}
              <div className="ml-11 mt-1 grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="opacity-50">Year:</span>
                  <span>{track.albumYear || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="opacity-50">Duration:</span>
                  <span>{formatDuration(track.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="opacity-50">Popularity:</span>
                  <div className="w-16 h-1.5 bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-[#ff6347] rounded-full top" 
                      style={{ width: `${track.popularity || 0}%` }}
                    />
                  </div>
                </div>
                {track.genre && track.genre.length > 0 ? (
                  <div className="col-span-3 flex flex-wrap gap-1">
                    <span>
                      {track.isArtistGenre ? 'Artist Genre:' : 'Track Genre:'}
                    </span>
                    {track.genre.slice(0, 3).map((genre) => (
                      <span 
                        key={genre}
                        className="px-1.5 py-0.5 bg-white/5 rounded-full text-[10px]"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopTracks;