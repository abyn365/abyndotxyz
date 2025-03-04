import type { NextComponentType } from "next";
import type { NowPlayingSong } from "../../@types/now-playing-song.type";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";

const SpotifyCard: NextComponentType = () => {
  const { data, error } = useSWR<NowPlayingSong>("/api/now-playing", fetcher);

  function truncateTitle(title) {
    if (!title) return;
    const words = title.split(" ");
    if (words.length <= 7) return title;
    return `${words[0]} ${words[1]} ${words[2]} ${words[3]} ...`;
  }

  const truncatedTitle = truncateTitle(data?.title);
  const truncatedArtist = truncateTitle(data?.artist);

  return (
    <>
      <div className="font-sen mb-8 flex flex-col items-center gap-2 text-sm text-gray-300 fade-in">
        <p className="text-white">See what I&apos;m currently listening on Spotify</p>
        {data?.isPlaying ? (
          <div className="flex flex-col w-full gap-2">
            <Link 
              href={data?.songUrl}
              className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={data.albumImageUrl}
                width={40}
                height={40}
                alt={data.title}
                className="rounded top-fade-in"
              />
              <div className="flex flex-col overflow-hidden">
                <p className="text-white truncate hover:text-[#ff6347] transition-colors top-no-caret-typing-animation">
                  {truncatedTitle}
                </p>
                <p className="text-gray-400 text-xs truncate top-no-caret-typing-animation">
                  {truncatedArtist}
                </p>
              </div>
            </Link>
            
            {/* Stats section */}
            <div className="ml-11 grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <span className="opacity-50">Album:</span>
                <span className="top1-no-caret-typing-animation truncate">{data.album}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="opacity-50">Popularity:</span>
                <div className="w-16 h-1.5 bg-gray-700 rounded-full">
                  <div 
                    className="h-full bg-[#ff6347] rounded-full top-fade-in" 
                    style={{ width: `${data.popularity || 0}%` }}
                  />
                </div>
              </div>
              {data.genre && data.genre.length > 0 ? (
                <div className="col-span-2 flex flex-wrap gap-1">
                  <span className="opacity-50 mr-1 top1-no-caret-typing-animation">
                    {data.isArtistGenre ? 'Artist Genre:' : 'Track Genre:'}
                  </span>
                  {data.genre.slice(0, 3).map((genre) => (
                    <span 
                      key={genre}
                      className="px-1.5 py-0.5 bg-white/5 rounded-full text-[10px] top1-no-caret-typing-animation"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <span className="fade-in">Not listening to anything</span>
        )}
      </div>
    </>
  );
};

export default SpotifyCard;