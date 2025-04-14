const client_id = process.env.SPOTIFY_CLIENT_ID as string;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET as string;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN as string;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;
const TOP_TRACKS_DEFAULT_PARAMS = {
  time_range: "short_term",
  limit: "5",
  offset: "0",
};
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

// Update the TOKEN_ENDPOINT params to include the new scopes
const params = new URLSearchParams({
  grant_type: 'refresh_token',
  refresh_token: refresh_token,
  scope: 'user-top-read user-read-private user-read-email user-read-currently-playing',
});

export const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  
  return response.json();
};

export const getNowPlaying = async () => {
  const { access_token } = await getAccessToken();

  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return response;
};

export async function getTopTracks(timeRange = 'short_term') {
  const { access_token } = await getAccessToken();

  return fetch(`${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=50`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
}