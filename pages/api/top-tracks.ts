import { NextApiRequest, NextApiResponse } from 'next';
import { getTopTracks, getAccessToken } from "../../lib/spotify";

// Cache storage
let cache: {
  [key: string]: {
    data: any;
    timestamp: number;
  };
} = {};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const period = (req.query.period as string) || 'short';
  
  const timeRange = {
    short: 'short_term',
    medium: 'medium_term',
    long: 'long_term'
  }[period] || 'short_term';

  // Check cache first
  const cacheKey = `top-tracks-${timeRange}`;
  const now = Date.now();
  
  if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_DURATION) {
    res.setHeader('x-cache', 'HIT');
    res.setHeader('cache-control', 'public, max-age=300');
    return res.status(200).json(cache[cacheKey].data);
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

    res.setHeader('x-cache', 'MISS');
    res.setHeader('cache-control', 'public, max-age=300');
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error fetching top tracks:', error);
    
    // If cache exists but is stale, return stale data on error
    if (cache[cacheKey]) {
      res.setHeader('x-cache', 'STALE');
      res.setHeader('cache-control', 'public, max-age=300');
      return res.status(200).json(cache[cacheKey].data);
    }

    return res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
}