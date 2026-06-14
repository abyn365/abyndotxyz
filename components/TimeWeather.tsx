import { useEffect, useState, useRef } from 'react';
import { FiClock, FiCloud } from 'react-icons/fi';

type WeatherData = {
  time: string;
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
};

const TimeWeather = () => {
  const timeRef = useRef<HTMLSpanElement>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Direct DOM writing via ref for zero re-render overhead
    const updateTime = () => {
      const now = new Date();
      const gmt7Time = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
      const timeStr = gmt7Time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateStr = gmt7Time.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      if (timeRef.current) {
        timeRef.current.textContent = `${dateStr} · ${timeStr} GMT+7`;
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch weather for Yogyakarta via cached API route
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather');
        const data = await response.json();

        if (data && data.temperature !== undefined) {
          setWeather(data);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 600000); // Update every 10 minutes
    return () => clearInterval(weatherInterval);
  }, []);

  return (
    <div className="text-sm text-[var(--text-secondary)] space-y-1">
      <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
        <FiClock className="h-3.5 w-3.5" />
        <span ref={timeRef}></span>
      </div>
      {!loading && weather && (
        <div className="flex items-center gap-1.5">
          <FiCloud className="h-3.5 w-3.5" />
          <p>
            It's <span className="font-semibold text-[var(--text-primary)]">{weather.temperature}°C</span> with{' '}
            <span className="text-[var(--text-secondary)]">{weather.weatherDescription.toLowerCase()}</span> in{' '}
            <span className="font-semibold text-[var(--text-primary)]">Yogyakarta</span>.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeWeather;
