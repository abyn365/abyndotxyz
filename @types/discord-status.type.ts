export interface DiscordStatus {
  data: {
    discord_user: {
      username: string;
      avatar: string;
    };
    activities: Array<{
      name: string;
      type: number;
      state?: string;
      details?: string;
      assets?: {
        large_image: string;
        large_text: string;
        small_image?: string;
        small_text?: string;
      };
      timestamps?: {
        start: number;
        end?: number;
      };
    }>;
    discord_status: string;
    spotify?: {
      album: string;
      album_art_url: string;
      artist: string;
      song: string;
    };
  };
}