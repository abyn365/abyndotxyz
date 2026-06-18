# Location API

The location API stores the site owner's current city/country in Vercel KV, geocodes it with Open-Meteo, and lets `/api/weather` automatically use the saved coordinates and timezone.

## Environment variables

| Variable            | Required                  | Description                                                                               |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `LOCATION_SECRET`   | Yes for updates           | Shared secret that must be sent in the `Authorization` header when updating location.     |
| Vercel KV variables | Yes outside fallback mode | `@vercel/kv` connection variables used to persist the current location and weather cache. |

If KV is unavailable or no location has been stored yet, the app falls back to Yogyakarta, Indonesia.

## `GET /api/location`

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

## `POST /api/location`

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

## How weather uses location

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

## Error responses

| Status | Cause                                                   |
| ------ | ------------------------------------------------------- |
| `400`  | Missing or invalid `city`/`country` in the update body. |
| `401`  | Missing or invalid `Authorization` header.              |
| `405`  | Unsupported HTTP method.                                |
| `502`  | The location could not be geocoded or saved.            |
