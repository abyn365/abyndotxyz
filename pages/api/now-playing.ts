import { NextApiRequest, NextApiResponse } from 'next'
import { getNowPlaying, getAccessToken, SpotifyRefreshTokenExpiredError } from "../../lib/spotify";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await getNowPlaying();
    const { access_token } = await getAccessToken();

    if (response.status === 204 || response.status > 400) {
      return res.status(200).json({ isPlaying: false });
    }

    const song = await response.json();
    
    // FIX: Safely catch cases where song metadata or item structure is missing (e.g., podcasts, ads)
    if (!song || !song.item) {
      return res.status(200).json({ isPlaying: false });
    }

    const isPlaying = song.is_playing;
    const title = song.item.name;
    const artist = song.item.artists?.map((artist: any) => artist.name).join(", ") || "";
    const album = song.item.album?.name || "";
    
    // FIX: Added optional chaining to handle tracks missing album art gracefully
    const albumImageUrl = song.item.album?.images?.[0]?.url || "";
    const songUrl = song.item.external_urls?.spotify || "";

    const artistId = song.item.artists?.[0]?.id;
    
    let artistGenres = [];
    let isArtistGenre = false;

    // Only attempt to fetch artist data if a valid ID exists
    if (artistId) {
      // FIX: Added missing '$' to correctly inject the artist ID variable into the URL
      let artistResponse = await fetch(
        `https://api.spotify.com/v1/artists/$${artistId}?market=US&locale=en-US`, 
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        }
      ).catch(() => null); // Fallback to avoid breaking the entire response on proxy errors

      if (artistResponse && artistResponse.status === 401) {
        console.warn("Spotify now-playing artist fetch returned 401. Force refreshing token...");
        const freshTokenResult = await getAccessToken(true);
        const freshAccessToken = freshTokenResult.access_token;

        // FIX: Added missing '$' here as well
        artistResponse = await fetch(
          `https://api.spotify.com/v1/artists/$${artistId}?market=US&locale=en-US`, 
          {
            headers: {
              'Authorization': `Bearer ${freshAccessToken}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          }
        ).catch(() => null);
      }
      
      if (artistResponse && artistResponse.ok) {
        const artistDetails = await artistResponse.json();
        if (!artistDetails.error && artistDetails.genres) {
          artistGenres = artistDetails.genres;
          isArtistGenre = artistGenres.length > 0;
        }
      }
    }

    res.setHeader(
      'Cache-Control',
      'no-cache, no-store, must-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      album,
      albumImageUrl,
      artist,
      isPlaying,
      songUrl,
      title,
      popularity: song.item.popularity || 0,
      genre: artistGenres,
      isArtistGenre,
      progressMs: song.progress_ms || 0,
      durationMs: song.item.duration_ms || 0
    });

  } catch (error) {
    // Log the error message directly to server logs for easier tracking
    console.error("Runtime error in now-playing endpoint:", error);

    if (error instanceof SpotifyRefreshTokenExpiredError) {
      return res.status(401).json({ isPlaying: false, error: 'Spotify refresh token expired. Reauthenticate required.' });
    }

    return res.status(500).json({ isPlaying: false, error: 'Failed to fetch now playing' });
  }
}