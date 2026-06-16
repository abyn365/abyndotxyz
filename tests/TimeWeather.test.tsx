import { render, screen, waitFor } from '@testing-library/react';
import TimeWeather from '../components/TimeWeather';
import { vi } from 'vitest';

const sample = {
  time: '2026-06-16T17:45',
  temperature: 26,
  feelsLike: 30,
  weatherCode: 800,
  weatherDescription: 'Clear sky',
  isDay: false,
};

describe('TimeWeather', () => {
  beforeEach(() => {
    // mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(sample) } as Response)
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders moon for time and weather when API reports isDay false (night)', async () => {
    render(<TimeWeather />);

    // wait for mounted and fetch to settle
    await waitFor(() => expect(screen.getByTestId('time-icon')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('weather-icon')).toBeInTheDocument());

    const timeIcon = screen.getByTestId('time-icon');
    const weatherIcon = screen.getByTestId('weather-icon');

    // when night, TimeIcon uses 'text-indigo-300' class
    expect(timeIcon).toHaveClass('text-indigo-300');

    // WeatherIcon should be Moon when code 800 and isDay false -> we expect no 'text-amber-400'
    expect(weatherIcon).not.toHaveClass('text-amber-400');
  });
});
