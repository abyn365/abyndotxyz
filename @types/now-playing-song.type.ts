export interface NowPlayingSong {
  album: string;
  albumImageUrl: string;
  artist: string;
  isPlaying: boolean;
  songUrl: string;
  title: string;
  popularity: number;
  genre: string[];
  isArtistGenre: boolean;
}