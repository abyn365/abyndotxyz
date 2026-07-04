import { mock, describe, expect, it, beforeEach, afterEach } from "bun:test";
import { render, screen, waitFor } from '@testing-library/react';
import TimeWeather from '../components/TimeWeather';

const sample = {
  time: '2026-06-16T17:45',
  temperature: 26,
  feelsLike: 30,
  weatherCode: 800,
  weatherDescription: 'Clear sky',
  isDay: false,
};

describe('TimeWeather', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // mock fetch
    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sample),
      } as Response)
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders moon for time and weather when API reports isDay false (night)', async () => {
    render(<TimeWeather />);

    // wait for mounted and fetch to settle
    await waitFor(() => expect(screen.getByTestId('time-icon')).toBeInTheDocument());

    const timeIcon = screen.getByTestId('time-icon');

    // when night, status icon uses 'text-indigo-300' class
    expect(timeIcon).toHaveClass('text-indigo-300');

    // WeatherIcon should be Moon/Cloud when code 800 and isDay false -> we expect no 'text-amber-400'
    expect(timeIcon).not.toHaveClass('text-amber-400');
  });
});
