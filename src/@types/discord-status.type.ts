export interface LanyardActivity {
  application_id?: string;
  name: string;
  type?: number;
  details?: string;
  state?: string;
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  timestamps?: {
    start: number;
    end?: number;
  };
}

export interface LanyardPresence {
  active_on_discord_desktop?: boolean;
  active_on_discord_web?: boolean;
  active_on_discord_mobile?: boolean;
  discord_status?: string;
  activities?: LanyardActivity[];
  spotify?: {
    album: string;
    album_art_url: string;
    artist: string;
    song: string;
    track_id?: string;
    timestamps?: {
      start: number;
      end?: number;
    };
  } | null;
}

export interface StatusData {
  activity?: {
    name: string;
    type?: number;
    details?: string;
    state?: string;
    image?: string | null;
    smallImage?: string | null;
    largeText?: string;
    smallText?: string;
    timestamps?: {
      start: number;
      end?: number;
    } | null;
  } | null;
  activeDevice?: string | null;
  spotify?: {
    album: string;
    albumArtUrl: string;
    artist: string;
    song: string;
    trackId?: string | null;
    songUrl?: string | null;
    spotifyUrl?: string | null;
    timestamps?: {
      start: number;
      end?: number;
    } | null;
  } | null;
}

export interface DiscordStatus {
  data: {
    discord_user: {
      username: string;
      avatar: string;
    };
    activities: LanyardActivity[];
    discord_status: string;
    spotify?: LanyardPresence["spotify"];
  };
}

export interface LanyardResponse {
  data: {
    discord_status: "online" | "idle" | "dnd" | "offline";
    listening_to_spotify: boolean;
    spotify: {
      track_id: string;
      song: string;
      artist: string;
      album: string;
      album_art_url: string;
    } | null;
  };
  success: boolean;
}
