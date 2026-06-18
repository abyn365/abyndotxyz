# API Docs

This document summarizes the public Next.js API routes used by the site. All examples use `https://your-domain.com`; replace it with the deployed domain or `http://localhost:3000` during local development.

## `GET /api/discord-status`

Returns a normalized Discord presence payload for the configured Discord user. The endpoint reads Lanyard over HTTP, removes PreMiD/internal labels where possible, resolves Discord/Spotify/media asset URLs, and separates general activity from Spotify data.

```sh
curl https://your-domain.com/api/discord-status
```

Example response:

```json
{
  "isActive": true,
  "status": "dnd",
  "activeDevice": "Desktop",
  "isOnline": true,
  "activity": {
    "name": "Comix",
    "type": 0,
    "details": "Viewing \"The Horizon\" mainpage",
    "state": "Chapter: 1",
    "image": "https://media.discordapp.net/external/...",
    "smallImage": "https://media.discordapp.net/external/...",
    "largeText": null,
    "smallText": null,
    "timestamps": {
      "start": 1781799980000
    }
  },
  "spotify": {
    "album": "Album name",
    "albumArtUrl": "https://i.scdn.co/image/...",
    "artist": "Artist name",
    "song": "Song title",
    "timestamps": {
      "start": 1781799986336,
      "end": 1781800138002
    },
    "trackId": "spotifyTrackId",
    "songUrl": "https://open.spotify.com/track/spotifyTrackId"
  }
}
```

### Notes

- Method: `GET` only.
- Upstream dependency: `https://api.lanyard.rest/v1/users/:id`.
- `activity` is `null` when no non-Spotify activity is available.
- `spotify` is `null` when Lanyard reports that Spotify is not playing.
- Error responses can include `400` when Lanyard returns `success: false`, `405` for unsupported methods, or `500` for fetch/processing failures.

## `GET /api/visitor-stats`

Returns daily visitor statistics from Umami. If Umami is not configured or fails, the route returns zeroed stats so the UI can render safely.

```sh
curl https://your-domain.com/api/visitor-stats
```

Required environment variables:

| Variable           | Description                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `UMAMI_BASE_URL`   | Base URL for the Umami instance, for example `https://analytics.example.com`. |
| `UMAMI_WEBSITE_ID` | Umami website ID to query.                                                    |
| `UMAMI_AUTH_TOKEN` | Bearer token used to call Umami API endpoints.                                |

Example response:

```json
{
  "active": 3,
  "pageviews": 128,
  "uniques": 42
}
```

### Notes

- Method: `GET` only.
- `active` comes from Umami's active visitors endpoint.
- `pageviews` and `uniques` are scoped to the current local day on the server.
- On missing configuration or upstream errors, the response is still `200` with all values set to `0`.
- Unsupported methods return `405`.

## `GET /api/top-tracks`

Returns Spotify top tracks for the authenticated Spotify account. Results are cached in Vercel KV and include artist genre details fetched from Spotify's artists endpoint.

```sh
curl 'https://your-domain.com/api/top-tracks?period=short'
```

Query parameters:

| Parameter | Values                    | Default | Description                                                  |
| --------- | ------------------------- | ------- | ------------------------------------------------------------ |
| `period`  | `short`, `medium`, `long` | `short` | Maps to Spotify `short_term`, `medium_term`, or `long_term`. |

Required environment/configuration:

- Spotify credentials used by `lib/spotify` to refresh an access token.
- Vercel KV for track caches and Spotify rate-limit retry metadata.

Example response:

```json
{
  "tracks": [
    {
      "title": "Song title",
      "artist": "Artist One, Artist Two",
      "cover": "https://i.scdn.co/image/...",
      "songUrl": "https://open.spotify.com/track/...",
      "albumYear": "2026",
      "popularity": 70,
      "genre": ["soundtrack"],
      "isArtistGenre": true,
      "duration": 180000
    }
  ]
}
```

### Cache and rate-limit behavior

- Cache keys are per Spotify time range.
- Cache TTLs are approximately 6 hours for `short`, 2 days for `medium`, and 7 days for `long`.
- Responses may include `x-cache` values such as `KV_HIT`, `KV_MISS`, `KV_RATE_LIMIT`, or `KV_STALE`.
- When Spotify returns `429`, the route stores retry metadata in KV and may send a `retry-after` response header.
- If fresh Spotify requests fail but cached data exists, stale cached data is returned.
- Unsupported methods return `405`; complete failures without cache return `500`.

## Location and weather APIs

Location and weather are documented in detail in [`docs/location-api.md`](./location-api.md). In short:

- `GET /api/location` reads the stored location.
- `POST /api/location` updates the stored location with `Authorization: $LOCATION_SECRET`.
- `GET /api/weather` uses the stored location's coordinates and timezone for weather and time display.
