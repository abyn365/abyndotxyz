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

The location API stores the site owner's current city/country in Vercel KV, geocodes it with Open-Meteo, and lets `/api/weather` automatically use the saved coordinates and timezone. If KV is unavailable or no location has been stored yet, the app falls back to Yogyakarta, Indonesia.

### Environment variables

| Variable            | Required                  | Description                                                                               |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `LOCATION_SECRET`   | Yes for updates           | Shared secret that must be sent in the `Authorization` header when updating location.     |
| Vercel KV variables | Yes outside fallback mode | `@vercel/kv` connection variables used to persist the current location and weather cache. |

### `GET /api/location`

Returns the currently stored location.

```sh
curl https://your-domain.com/api/location
```

Example response:

```json
{
  "city": "Yogyakarta",
  "country": "Indonesia",
  "latitude": -7.8014,
  "longitude": 110.3647,
  "timezone": "Asia/Jakarta",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### `POST /api/location`

Updates the stored location. Send a city and country; the API geocodes them before saving normalized coordinates/timezone data.

```sh
curl -X POST https://your-domain.com/api/location \
  -H "Content-Type: application/json" \
  -H "Authorization: $LOCATION_SECRET" \
  -d '{"city":"Paris","country":"France"}'
```

Example response:

```json
{
  "message": "Location updated",
  "location": {
    "city": "Paris",
    "country": "France",
    "latitude": 48.85341,
    "longitude": 2.3488,
    "timezone": "Europe/Paris",
    "timestamp": "2026-06-18T17:40:00.000Z"
  }
}
```

### `GET /api/weather`

`/api/weather` calls the shared location helper, then requests Open-Meteo weather using the stored `latitude`, `longitude`, and `timezone`. The weather response also includes:

- `city`
- `country`
- `timezone`
- `locationUpdatedAt`

The frontend uses those fields to render text like:

```txt
Jun 19, 2026 · 00:23:18 GMT+7
I'm probably asleep right now... 😴
It's 23°C with clear sky in Yogyakarta.
```

Hovering the city name shows a tooltip with the country and last location update time.

### Location/weather error responses

| Status | Cause                                                                             |
| ------ | --------------------------------------------------------------------------------- |
| `400`  | Missing or invalid `city`/`country` in the update body.                           |
| `401`  | Missing or invalid `Authorization` header.                                        |
| `405`  | Unsupported HTTP method.                                                          |
| `502`  | The location could not be geocoded or saved, or the weather API returned no data. |
| `500`  | Weather fetch failed and no stale cache is available.                             |
