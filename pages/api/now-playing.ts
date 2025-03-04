import { NextApiRequest, NextApiResponse } from 'next'
import { getNowPlaying, getAccessToken } from "../../lib/spotify";

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
    if (song.item === null) {
      return res.status(200).json({ isPlaying: false });
    }

    const isPlaying = song.is_playing;
    const title = song.item.name;
    const artist = song.item.artists.map((artist: any) => artist.name).join(", ");
    const album = song.item.album.name;
    const albumImageUrl = song.item.album.images[0].url;
    const songUrl = song.item.external_urls.spotify;

    const artistId = song.item.artists[0].id;
    
    const artistResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}?market=US&locale=en-US`, 
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );
    
    let artistGenres = [];
    let isArtistGenre = false;

    if (artistResponse.ok) {
      const artistDetails = await artistResponse.json();
      if (!artistDetails.error && artistDetails.genres) {
        artistGenres = artistDetails.genres;
        isArtistGenre = artistGenres.length > 0;
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
      popularity: song.item.popularity,
      genre: artistGenres,
      isArtistGenre
    });

  } catch (error) {
    return res.status(500).json({ isPlaying: false, error: 'Failed to fetch now playing' });
  }
}