import { NextApiRequest, NextApiResponse } from 'next';
import { getAccessToken } from '../../lib/spotify';
import { kv } from '@vercel/kv';

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
}

interface SpotifyTrack {
  name: string;
  popularity: number;
  duration_ms: number;
  external_urls: { spotify: string };
  album: {
    release_date: string;
    images: { url: string }[];
  };
  artists: {
    id: string;
    name: string;
  }[];
}

const CACHE_DURATION_MAP: Record<string, number> = {
  short_term: 6 * 60 * 60 * 1000,        // 6 hours
  medium_term: 2 * 24 * 60 * 60 * 1000,  // 2 days
  long_term: 7 * 24 * 60 * 60 * 1000,    // 7 days
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const period = (req.query.period as string) || 'short';

  const timeRange =
    {
      short: 'short_term',
      medium: 'medium_term',
      long: 'long_term',
    }[period] || 'short_term';

  const cacheKey = `top-tracks-${timeRange}`;
  const CACHE_DURATION = CACHE_DURATION_MAP[timeRange];

  // ---------- KV CACHE HIT ----------
  const cached = await kv.get<{ tracks: any[] }>(cacheKey);

  if (cached) {
    res.setHeader('x-cache', 'KV_HIT');
    res.setHeader('cache-control', 'public, max-age=300');
    return res.status(200).json(cached);
  }

  try {
    const { access_token } = await getAccessToken();

    // ---------- TOP TRACKS ----------
    const tracksRes = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!tracksRes.ok) {
      throw new Error(`Spotify error ${tracksRes.status}`);
    }

    const tracksData: { items: SpotifyTrack[] } =
      await tracksRes.json();

    // ---------- BATCH ARTIST FETCH ----------
    const artistIds = [
      ...new Set(tracksData.items.map((t) => t.artists[0].id)),
    ];

    const artistsRes = await fetch(
      `https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const artistsData: { artists: SpotifyArtist[] } =
      await artistsRes.json();

    const artistMap = new Map<string, SpotifyArtist>(
      artistsData.artists.map((a) => [a.id, a])
    );

    // ---------- BUILD RESPONSE ----------
    const tracks = tracksData.items.map((track) => {
      const artistDetails = artistMap.get(track.artists[0].id);

      return {
        artist: track.artists.map((a) => a.name).join(', '),
        cover: track.album.images[0].url,
        songUrl: track.external_urls.spotify,
        title: track.name,
        albumYear: track.album.release_date.split('-')[0],
        popularity: track.popularity,
        genre: artistDetails?.genres ?? [],
        isArtistGenre: Boolean(artistDetails?.genres?.length),
        duration: track.duration_ms,
      };
    });

    const responseData = { tracks };

    // ---------- STORE IN KV ----------
    await kv.set(cacheKey, responseData, {
      ex: Math.floor(CACHE_DURATION / 1000), // seconds
    });

    res.setHeader('x-cache', 'KV_MISS');
    res.setHeader('cache-control', 'public, max-age=300');
    return res.status(200).json(responseData);
  } catch (err) {
    console.error('Spotify fetch failed:', err);

    // ---------- KV STALE FALLBACK ----------
    const cached = await kv.get(cacheKey);

    if (cached) {
      res.setHeader('x-cache', 'KV_STALE');
      return res.status(200).json(cached);
    }

    return res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
}
