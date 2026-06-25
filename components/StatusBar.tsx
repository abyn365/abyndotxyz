import { useEffect, useState } from "react";

type DiscordStatus = "online" | "idle" | "dnd" | "offline" | "";
type NowPlaying = { song: string; artist: string } | null;
type WeatherInfo = { temp: number } | null;
type LocationInfo = { city: string; country: string; timezone: string } | null;

const STATUS_COLOR: Record<string, string> = {
  online: "var(--status-online)",
  idle: "var(--status-idle)",
  dnd: "var(--status-dnd)",
  offline: "var(--status-offline)",
};

const STATUS_LABEL: Record<string, string> = {
  online: "online",
  idle: "idle",
  dnd: "busy",
  offline: "offline",
};

export default function StatusBar() {
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [location, setLocation] = useState<LocationInfo>(null);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus>("");
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>(null);
  const [weather, setWeather] = useState<WeatherInfo>(null);

  // Clock — updates every second using the resolved timezone
  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  // Location — provides city, country, and timezone
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("/api/location");
        if (!res.ok) return;
        const data = await res.json();
        if (data.city && data.timezone) {
          setLocation({
            city: data.city,
            country: data.country,
            timezone: data.timezone,
          });
          setTimezone(data.timezone);
        }
      } catch {}
    };
    fetchLocation();
    const id = setInterval(fetchLocation, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.temperature === "number") {
          setWeather({ temp: data.temperature });
        }
      } catch {}
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const res = await fetch(
          "https://api.lanyard.rest/v1/users/877018055815868426"
        );
        const json = await res.json();
        if (!json.success) return;
        const d = json.data;
        setDiscordStatus(d.discord_status ?? "offline");
        setNowPlaying(
          d.spotify ? { song: d.spotify.song, artist: d.spotify.artist } : null
        );
      } catch {}
    };
    fetchPresence();
    const id = setInterval(fetchPresence, 15_000);
    return () => clearInterval(id);
  }, []);

  const dotColor = STATUS_COLOR[discordStatus] ?? STATUS_COLOR.offline;
  const dotLabel = STATUS_LABEL[discordStatus] ?? "";

  return (
    <div
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="mx-auto flex h-8 max-w-5xl items-center gap-3 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
          {/* Discord status dot */}
          {discordStatus && (
            <span className="flex shrink-0 items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: dotColor }}
              />
              <span className="hidden sm:inline">abynb</span>
              <span className="hidden text-[var(--border-color)] sm:inline">
                ·
              </span>
              <span>{dotLabel}</span>
            </span>
          )}

          <span
            className="hidden h-3 w-px shrink-0 sm:block"
            style={{ background: "var(--card-border)" }}
          />

          {/* Time + location + weather */}
          <span className="shrink-0 tabular-nums">
            {time}
            {location && (
              <span className="hidden sm:inline"> · {location.city}</span>
            )}
            {weather && <> · {weather.temp}°C</>}
          </span>

          {/* Now playing */}
          {nowPlaying && (
            <>
              <span
                className="hidden h-3 w-px shrink-0 sm:block"
                style={{ background: "var(--card-border)" }}
              />
              <span className="hidden min-w-0 items-center gap-1.5 sm:flex">
                <span
                  className="shrink-0 text-[10px]"
                  style={{ color: "var(--accent)" }}
                >
                  ▶
                </span>
                <span className="truncate">
                  {nowPlaying.song}
                  <span style={{ color: "var(--card-border)" }}> — </span>
                  {nowPlaying.artist}
                </span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
