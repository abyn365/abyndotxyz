export const DISCORD_ID = "877018055815868426";

export const statusImages = {
  online: "https://cdn3.emoji.gg/emojis/1514-online-blank.png",
  idle: "https://cdn3.emoji.gg/emojis/5204-idle-blank.png",
  dnd: "https://cdn3.emoji.gg/emojis/4431-dnd-blank.png",
  offline: "https://cdn3.emoji.gg/emojis/6610-invisible-offline-blank.png",
} as const;

export const getStatusImage = (status: string, isActive: boolean) => {
  if (!isActive) return statusImages.offline;
  return statusImages[status as keyof typeof statusImages] || statusImages.offline;
};

export const isPreMiDText = (text?: string) =>
  typeof text === "string" && /pre.?mid/i.test(text);

export const sanitizeActivityText = (text?: string) => {
  if (!text) return null;
  return isPreMiDText(text) ? null : text;
};

export const getActiveDevice = (presence: {
  active_on_discord_desktop?: boolean;
  active_on_discord_web?: boolean;
  active_on_discord_mobile?: boolean;
}) => {
  if (presence.active_on_discord_desktop) return "Desktop";
  if (presence.active_on_discord_web) return "Web";
  if (presence.active_on_discord_mobile) return "Mobile";
  return null;
};

export const resolveDiscordAsset = (
  applicationId?: string,
  asset?: string
) => {
  if (!asset) {
    return applicationId
      ? `https://dcdn.dstn.to/app-icons/${applicationId}.webp?size=512`
      : null;
  }

  if (asset.startsWith("http://") || asset.startsWith("https://")) {
    return asset;
  }

  const parts = asset.split(":");

  if (parts.length > 1) {
    switch (parts[0]) {
      case "spotify":
        return parts[1] ? `https://i.scdn.co/image/${parts[1]}` : null;
      case "mp":
        return `https://media.discordapp.net/${parts.slice(1).join(":")}`;
      case "twitch":
        return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${parts[1]}.png`;
      case "youtube":
        return `https://i.ytimg.com/vi/${parts[1]}/hqdefault_live.jpg`;
      default:
        return null;
    }
  }

  return applicationId
    ? `https://cdn.discordapp.com/app-assets/${applicationId}/${asset}.webp?size=512`
    : null;
};

export const buildSpotifyTrackUrl = (trackId?: string | null) => {
  if (!trackId) return null;
  return `https://open.spotify.com/track/${trackId}`;
};

export const getPrimaryActivity = (activities: any[] = []) => {
  const candidates = activities.filter(
    (activity) =>
      [0, 2, 3].includes(activity.type) &&
      activity.name !== "Spotify" &&
      !isPreMiDText(activity.name)
  );

  return (
    candidates.find(
      (activity) =>
        !isPreMiDText(activity.assets?.large_text) &&
        !isPreMiDText(activity.assets?.small_text)
    ) ||
    candidates[0] ||
    null
  );
};

export const transformPresence = (presence: any) => {
  const activity = getPrimaryActivity(presence.activities ?? []);

  return {
    activeDevice: getActiveDevice(presence),
    activity: activity
      ? {
          name: activity.name,
          type: activity.type,
          details: sanitizeActivityText(activity.details),
          state: sanitizeActivityText(activity.state),
          image: resolveDiscordAsset(
            activity.application_id,
            activity.assets?.large_image
          ),
          smallImage: activity.assets?.small_image
            ? resolveDiscordAsset(
                activity.application_id,
                activity.assets.small_image
              )
            : null,
          largeText: sanitizeActivityText(activity.assets?.large_text),
          smallText: sanitizeActivityText(activity.assets?.small_text),
          timestamps: activity.timestamps || null,
        }
      : null,
    spotify: presence.spotify
      ? {
          album: presence.spotify.album,
          albumArtUrl: presence.spotify.album_art_url,
          artist: presence.spotify.artist,
          song: presence.spotify.song,
          timestamps: presence.spotify.timestamps || null,
          trackId: presence.spotify.track_id || null,
          songUrl: buildSpotifyTrackUrl(presence.spotify.track_id),
        }
      : null,
  };
};
