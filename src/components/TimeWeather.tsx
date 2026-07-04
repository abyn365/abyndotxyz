import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudMoonRain,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  Moon,
  Sun,
} from "lucide-react";

type WeatherData = {
  time: string;
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  city: string;
  country: string;
  timezone: string;
  locationUpdatedAt: string;
};

const DEFAULT_TIMEZONE = "Asia/Jakarta";
const WEATHER_REFRESH_MS = 10 * 60 * 1000;

const getWeatherIcon = (code: number, isNight: boolean): LucideIcon => {
  if (code === 0) return isNight ? Moon : Sun;

  if (code >= 1 && code <= 3) return isNight ? CloudMoon : CloudSun;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 51 && code <= 67) return isNight ? CloudMoonRain : CloudSunRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return isNight ? CloudMoonRain : CloudSunRain;
  if (code >= 95 && code <= 99) return CloudLightning;

  return Cloud;
};

const getIconStyle = (code: number, isNight: boolean) => {
  if (code === 0) {
    return {
      className: isNight ? "text-indigo-300" : "text-amber-400",
      animate: { rotate: [0, 4, 0, -4, 0] },
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  if (code >= 51 && code <= 67) {
    return {
      className: "text-[var(--accent)]",
      animate: { y: [0, -1.5, 0, 1.5, 0] },
      transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  if (code >= 80 && code <= 82) {
    return {
      className: "text-[var(--accent)]",
      animate: { y: [0, -2, 0, 2, 0] },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  if (code >= 71 && code <= 77) {
    return {
      className: "text-slate-300",
      animate: { y: [0, -1, 0, 1, 0] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  if (code >= 95 && code <= 99) {
    return {
      className: "text-violet-400",
      animate: { x: [0, -1, 1, -1, 1, 0], rotate: [0, -2, 2, -2, 2, 0] },
      transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  if (code >= 45 && code <= 48) {
    return {
      className: "text-slate-300",
      animate: { y: [0, -1, 0, 1, 0] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  return {
    className: isNight ? "text-indigo-300" : "text-amber-400",
    animate: { y: [0, -1, 0, 1, 0] },
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" as const },
  };
};

const getShortOffset = (timeZone: string) => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());

    return parts.find((part) => part.type === "timeZoneName")?.value || "";
  } catch {
    return "";
  }
};

const formatLocationUpdatedAt = (timestamp?: string) => {
  if (!timestamp) return "Location update time unavailable";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Location update time unavailable";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getTimePartsInZone = (timeZone: string) => {
  const now = new Date();

  try {
    const date = new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(now);

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

    const time = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);

    const offset = getShortOffset(timeZone);

    return {
      text: `${date} · ${time}${offset ? ` ${offset}` : ""}`,
      hour,
      minute,
    };
  } catch {
    return {
      text: now.toLocaleString("en-US"),
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  }
};

const TimeWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeText, setTimeText] = useState("");
  const [timeIsNight, setTimeIsNight] = useState(false);
  const [isAwake, setIsAwake] = useState(true);

  const timeZone = weather?.timezone || DEFAULT_TIMEZONE;
  const isNight = weather ? !weather.isDay : timeIsNight;

  const iconCode = weather?.weatherCode ?? (isNight ? 1 : 0);
  const WeatherIcon = getWeatherIcon(iconCode, isNight);
  const iconStyle = getIconStyle(iconCode, isNight);

  useEffect(() => {
    const updateTime = () => {
      const { text, hour, minute } = getTimePartsInZone(timeZone);

      setTimeText(text);

      const hourDecimal = hour + minute / 60;
      setTimeIsNight(hourDecimal >= 18 || hourDecimal < 6);
      setIsAwake(hourDecimal >= 6 && hourDecimal < 22.5);
    };

    updateTime();
    const interval = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(interval);
  }, [timeZone]);

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        const response = await fetch("/api/weather", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data: WeatherData = await response.json();

        if (!cancelled && data && typeof data.temperature === "number") {
          setWeather(data);
        }
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWeather();
    const interval = window.setInterval(fetchWeather, WEATHER_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const locationTooltip = weather
    ? `${weather.city}, ${weather.country} · updated ${formatLocationUpdatedAt(
        weather.locationUpdatedAt
      )}`
    : "";

  return (
    <div className="space-y-1 text-sm text-[var(--text-secondary)]">
      <div className="group relative flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
        <motion.div
          className="inline-flex"
          animate={iconStyle.animate}
          transition={iconStyle.transition}
        >
          {loading ? (
            <Clock
              data-testid="time-icon"
              className="h-3.5 w-3.5 text-[var(--text-secondary)]"
            />
          ) : (
            <WeatherIcon
              data-testid="time-icon"
              className={`h-3.5 w-3.5 ${iconStyle.className}`}
            />
          )}
        </motion.div>

        <span>{timeText}</span>

        <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 origin-bottom-left scale-95 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
          <div
            className="whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs shadow-lg backdrop-blur-xl"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <span className="font-medium text-[var(--text-primary)]">
              I&apos;m{" "}
              {isAwake
                ? "probably awake right now."
                : "probably asleep right now... 😴"}
            </span>
          </div>

          <div
            className="absolute left-3 top-full -mt-px"
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--card-border)",
            }}
          />
        </div>
      </div>

      {!loading && weather && (
        <p>
          It&apos;s{" "}
          <span className="group relative inline-flex items-center">
            <span className="font-semibold text-[var(--text-primary)]">
              {weather.temperature}°C
            </span>

            <span className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-xs text-[var(--text-secondary)] shadow-lg backdrop-blur-xl group-hover:block">
              Feels like {weather.feelsLike}°C
            </span>

            <span className="absolute left-1/2 top-full -mt-px hidden -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[var(--card-border)] group-hover:block" />
          </span>{" "}
          with{" "}
          <span className="text-[var(--text-secondary)]">
            {weather.weatherDescription.toLowerCase()}
          </span>{" "}
          in{" "}
          <span className="group/location relative inline-flex items-center font-semibold text-[var(--text-primary)]">
            {weather.city}
            <span className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-xs font-normal text-[var(--text-secondary)] shadow-lg backdrop-blur-xl group-hover/location:block">
              {locationTooltip}
            </span>
          </span>
          .
        </p>
      )}
    </div>
  );
};

export default TimeWeather;
