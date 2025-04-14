import { getTopTracks, getAccessToken } from "../../lib/spotify";
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

// Cache storage
let cache: {
  [key: string]: {
    data: any;
    timestamp: number;
  };
} = {};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'short';
  
  const timeRange = {
    short: 'short_term',
    medium: 'medium_term',
    long: 'long_term'
  }[period] || 'short_term';

  // Check cache first
  const cacheKey = `top-tracks-${timeRange}`;
  const now = Date.now();
  
  if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_DURATION) {
    return new Response(
      JSON.stringify(cache[cacheKey].data),
      { 
        status: 200, 
        headers: { 
          'content-type': 'application/json',
          'cache-control': 'public, max-age=300', // 5 minutes browser cache
          'x-cache': 'HIT'
        } 
      }
    );
  }

  try {
    const { access_token } = await getAccessToken();
    
    const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const tracks = await Promise.all(data.items.map(async (track: any) => {
      const artistId = track.artists[0].id;
      
      const artistDetails = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }).then(res => res.json());

      return {
        artist: track.artists.map((_artist: any) => _artist.name).join(", "),
        cover: track.album.images[0].url,
        songUrl: track.external_urls.spotify,
        title: track.name,
        albumYear: track.album.release_date.split('-')[0],
        popularity: track.popularity,
        genre: artistDetails.genres || [],
        isArtistGenre: Boolean(artistDetails.genres?.length),
        duration: track.duration_ms,
      };
    }));

    // Store in cache
    const responseData = { tracks };
    cache[cacheKey] = {
      data: responseData,
      timestamp: now
    };

    return new Response(
      JSON.stringify(responseData), 
      { 
        status: 200, 
        headers: { 
          'content-type': 'application/json',
          'cache-control': 'public, max-age=300', // 5 minutes browser cache
          'x-cache': 'MISS'
        } 
      }
    );

  } catch (error) {
    console.error('Error fetching top tracks:', error);
    
    // If cache exists but is stale, return stale data on error
    if (cache[cacheKey]) {
      return new Response(
        JSON.stringify(cache[cacheKey].data),
        { 
          status: 200, 
          headers: { 
            'content-type': 'application/json',
            'cache-control': 'public, max-age=300',
            'x-cache': 'STALE'
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to fetch top tracks' }), 
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}