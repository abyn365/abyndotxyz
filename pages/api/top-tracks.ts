import { getTopTracks, getAccessToken } from "../../lib/spotify";
export const runtime = 'edge';

export default async function handler(req: Request) {
  try {
    // Get a fresh access token first
    const { access_token } = await getAccessToken();
    
    const response = await getTopTracks();
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch top tracks: ${data.error?.message || 'Unknown error'}`);
    }

    const tracks = await Promise.all(data.items.slice(0, 10).map(async (track: any) => {
      const artistId = track.artists[0].id;
      
      const artistDetails = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }).then(res => res.json());

      if (artistDetails.error) {
        console.error('Error fetching artist details:', artistDetails.error);
        return {
          artist: track.artists.map((_artist: any) => _artist.name).join(", "),
          cover: track.album.images[0].url,
          songUrl: track.external_urls.spotify,
          title: track.name,
          albumYear: track.album.release_date.split('-')[0],
          popularity: track.popularity,
          genre: [],
          isArtistGenre: false,
          duration: track.duration_ms,
        };
      }
      
      const artistGenres = Array.isArray(artistDetails.genres) ? artistDetails.genres : [];
      const isArtistGenre = artistGenres.length > 0;
    
      return {
        artist: track.artists.map((_artist: any) => _artist.name).join(", "),
        cover: track.album.images[0].url,
        songUrl: track.external_urls.spotify,
        title: track.name,
        albumYear: track.album.release_date.split('-')[0],
        popularity: track.popularity,
        genre: artistGenres,
        isArtistGenre: isArtistGenre,
        duration: track.duration_ms,
      };
    }));

    return new Response(JSON.stringify({ tracks }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
      }
    });
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch top tracks' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}