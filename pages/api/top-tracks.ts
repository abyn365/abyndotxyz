import { getTopTracks } from "../../lib/spotify";

export const runtime = 'edge';

export default async function handler(req: Request) {
  try {
    const response = await getTopTracks();
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch top tracks: ${data.error?.message || 'Unknown error'}`);
    }

    if (!data.items) {
      return new Response(JSON.stringify({ tracks: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const tracks = data.items.slice(0, 10).map((track: any) => ({
      artist: track.artists.map((_artist: any) => _artist.name).join(", "),
      cover: track.album.images[0].url,
      songUrl: track.external_urls.spotify,
      title: track.name,
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