import { kv } from "./kv";

export const LOCATION_KV_KEY = "current-location";

export type StoredLocation = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  timestamp: string;
};

export const DEFAULT_LOCATION: StoredLocation = {
  city: "Yogyakarta",
  country: "Indonesia",
  latitude: -7.8014,
  longitude: 110.3647,
  timezone: "Asia/Jakarta",
  timestamp: "2026-01-01T00:00:00.000Z",
};

type GeocodingResult = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

const normalizeLocationName = (value: string) =>
  value.trim().replace(/\s+/g, " ");

export const getCurrentLocation = async () => {
  try {
    const stored = await kv.get<StoredLocation>(LOCATION_KV_KEY);
    return stored || DEFAULT_LOCATION;
  } catch (error) {
    console.warn("Location KV read failed, using default location:", error);
    return DEFAULT_LOCATION;
  }
};

export const geocodeLocation = async (city: string, country: string) => {
  const normalizedCity = normalizeLocationName(city);
  const normalizedCountry = normalizeLocationName(country);
  const search = `${normalizedCity}, ${normalizedCountry}`;
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", search);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Geocoding API returned ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  const exactCountryMatch = results.find(
    (result: GeocodingResult) =>
      result.country?.toLowerCase() === normalizedCountry.toLowerCase()
  );
  const result = exactCountryMatch || results[0];

  if (!result) {
    throw new Error("Location could not be geocoded");
  }

  return {
    city: result.name || normalizedCity,
    country: result.country || normalizedCountry,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone || DEFAULT_LOCATION.timezone,
    timestamp: new Date().toISOString(),
  } satisfies StoredLocation;
};

export const setCurrentLocation = async (location: StoredLocation) => {
  await kv.set(LOCATION_KV_KEY, location);
  return location;
};
