import useSWR from "swr";
import { fetcher } from "../lib/fetcher";
import {
  DEFAULT_MUSIC_PERIOD,
  type MusicPeriod,
  type MusicTrack,
} from "../lib/music";

type TopTracksResponse = {
  tracks: MusicTrack[];
};

export function useTopTracks(period: MusicPeriod = DEFAULT_MUSIC_PERIOD) {
  const { data, error } = useSWR<TopTracksResponse>(
    `/api/top-tracks?period=${period}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    tracks: data?.tracks ?? [],
    error,
    isLoading: !data && !error,
  };
}
