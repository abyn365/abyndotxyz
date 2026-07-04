import { NextApiRequest, NextApiResponse } from 'next'
import { getNowPlaying, getQueue, getAccessToken, SpotifyRefreshTokenExpiredError } from "../../lib/spotify";
import { NowPlayingSong, UpcomingQueueItem } from "../../@types/now-playing-song.type";
import { kv } from "../../lib/kv";

export default async function handler(req: NextApiRequest, res: NextApiResponse<NowPlayingSong | { error: string }>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [response, queueResponse] = await Promise.all([
      getNowPlaying(),
      getQueue().catch(() => null),
    ]);
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
    const trackId = song.item.id;
    
    let canvasUrl = "";
    if (trackId) {
      try {
        const cacheKey = `spotify_canvas:${trackId}`;
        const cachedCanvas = await kv.get<string>(cacheKey);
        
        if (cachedCanvas !== null) {
          canvasUrl = cachedCanvas;
        } else {
          const apiKey = process.env.PAXSENIX_API_KEY as string;
          const canvasRes = await fetch(`https://api.paxsenix.org/spotify/canvas?id=${trackId}`, {
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            cache: "no-store"
          });
          if (canvasRes.ok) {
            const canvasData = await canvasRes.json();
            if (canvasData?.ok && canvasData?.data?.canvasesList?.length > 0) {
              canvasUrl = canvasData.data.canvasesList[0].canvasUrl || "";
              await kv.set(cacheKey, canvasUrl, { ex: 7 * 24 * 60 * 60 }); // Cache 7 days
            } else {
              await kv.set(cacheKey, "", { ex: 24 * 60 * 60 }); // Cache empty for 24h
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch Spotify canvas:", err);
      }
    }
    let artistGenres: string[] = [];
    let isArtistGenre = false;

    // Only attempt to fetch artist data if a valid ID exists
    if (artistId) {
      // FIX: Added missing '$' to correctly inject the artist ID variable into the URL
      let artistResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}?market=US&locale=en-US`, 
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
          `https://api.spotify.com/v1/artists/${artistId}?market=US&locale=en-US`, 
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

    // Extract next items from queue
    let upcomingQueue: UpcomingQueueItem[] = [];
    if (queueResponse && queueResponse.ok) {
      try {
        const queueData = await queueResponse.json();
        if (queueData && Array.isArray(queueData.queue)) {
          upcomingQueue = queueData.queue.slice(0, 20).map((track: any) => ({
            title: track.name,
            artist: track.artists?.map((a: any) => a.name).join(", ") || "",
            album: track.album?.name || "",
            cover: track.album?.images?.[0]?.url || "",
            songUrl: track.external_urls?.spotify || "",
            durationMs: track.duration_ms || 0,
          }));
        }
      } catch (err) {
        console.error("Failed to parse Spotify queue:", err);
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
      durationMs: song.item.duration_ms || 0,
      upcomingQueue,
      canvasUrl,
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