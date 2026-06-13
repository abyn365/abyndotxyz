import { useEffect, useState } from 'react';
import Image from "next/image";
import Banners from "../components/Banner";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";
import Squares from "../components/Squares";
import VisitorStats from "../components/Misc/VisitorStats.misc";
import Projects from "../components/Projects";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiMusic, FiGithub, FiInstagram } from "react-icons/fi";
import {
  SiTiktok,
  SiSpotify,
  SiPinterest,
  SiDiscord,
} from "react-icons/si";

type Track = {
  artist: string;
  title: string;
  songUrl: string;
  cover: string;
  albumYear: string;
  popularity: number;
};

type Period = "short" | "medium" | "long";

type CustomStatus = {
  emoji?: {
    id: string;
    name: string;
    animated: boolean;
  };
  state?: string;
};

const belowLink = "";
const bio = "The biolink of a dumbass 🗿";

const getDiscordAvatar = (userId: string, avatarId: string) => {
  const isAnimated = avatarId.startsWith('a_');
  const extension = isAnimated ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${extension}?size=256`;
};

const getStatusImage = (status: string) => {
  const statusMap = {
    online: 'https://cdn3.emoji.gg/emojis/1514-online-blank.png',
    idle: 'https://cdn3.emoji.gg/emojis/5204-idle-blank.png',
    dnd: 'https://cdn3.emoji.gg/emojis/4431-dnd-blank.png',
    offline: 'https://cdn3.emoji.gg/emojis/6610-invisible-offline-blank.png'
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.offline;
};

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export default function Home() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customStatus, setCustomStatus] = useState<CustomStatus | null>(null);
  const [username, setUsername] = useState('');
  const [discordStatus, setDiscordStatus] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [period, setPeriod] = useState<Period>("short");
  const [tracksLoading, setTracksLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Discord user
  useEffect(() => {
    const fetchDiscordUser = async () => {
      try {
        const response = await fetch('https://api.lanyard.rest/v1/users/877018055815868426');
        const data = await response.json();
        if (data.success) {
          const { id, avatar, username } = data.data.discord_user;
          setAvatarUrl(getDiscordAvatar(id, avatar));
          setUsername(username);
          setDiscordStatus(data.data.discord_status);
          const customStatusActivity = data.data.activities.find(
            (activity: any) => activity.type === 4
          );
          if (customStatusActivity) {
            setCustomStatus({
              emoji: customStatusActivity.emoji,
              state: customStatusActivity.state,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch Discord user:', error);
      }
    };

    fetchDiscordUser();
    const interval = setInterval(fetchDiscordUser, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch top tracks
  useEffect(() => {
    const fetchTracks = async () => {
      setTracksLoading(true);
      try {
        const res = await fetch(`/api/top-tracks?period=${period}`);
        const data = await res.json();
        if (!data.error) setTracks(data.tracks);
      } finally {
        setTracksLoading(false);
      }
    };
    fetchTracks();
  }, [period]);

  const getTrackIdFromUrl = (songUrl: string) => {
    const match = songUrl.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background squares effect */}
      <div className="fixed inset-0 z-0">
        <Squares
          speed={0.15}
          squareSize={40}
          direction="diagonal"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          {/* Bento Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 auto-rows-min"
          >
            {/* Profile Card - Spans 2 cols */}
            <motion.div variants={itemVariants} className="bento-spotlight md:col-span-2">
              <div className="bento-card flex flex-col items-center gap-4 p-5 sm:p-6">
                {/* Visitor Stats */}
                <div className="self-start">
                  <VisitorStats />
                </div>

                {/* Avatar with status indicators */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  <Image
                    className="rounded-full border-2 border-[var(--card-border)] object-cover transition-transform hover:scale-105"
                    src={avatarUrl || '/profile.png'}
                    alt="profile"
                    fill
                    sizes="(max-width: 640px) 96px, 112px"
                    priority
                  />
                  {/* Status indicators */}
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-1">
                    {customStatus?.state && (
                      <div
                        className="rounded-full px-2 py-0.5 border max-w-[90px]"
                        style={{
                          background: 'var(--card-bg)',
                          borderColor: 'var(--card-border)',
                        }}
                      >
                        <span className="text-[9px] text-[var(--text-secondary)] block truncate">
                          {customStatus.state}
                        </span>
                      </div>
                    )}
                    {customStatus?.emoji && (
                      <div
                        className="rounded-full p-0.5 border flex-shrink-0"
                        style={{
                          background: 'var(--card-bg)',
                          borderColor: 'var(--card-border)',
                        }}
                      >
                        <Image
                          src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${
                            customStatus.emoji.animated ? 'gif' : 'png'
                          }`}
                          alt={customStatus.emoji.name}
                          width={14}
                          height={14}
                          className="w-3.5 h-3.5"
                        />
                      </div>
                    )}
                    <div
                      className="rounded-full p-0.5 border flex-shrink-0"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                      }}
                    >
                      <Image
                        src={getStatusImage(discordStatus)}
                        alt={discordStatus}
                        width={14}
                        height={14}
                        className="rounded-full"
                        unoptimized
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h1 className="text-lg font-bold text-[var(--text-primary)]">
                    {username || 'Loading...'}
                  </h1>
                  {belowLink && (
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)] italic">{belowLink}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{bio}</p>
                </div>

                {/* Banners / Tags */}
                <Banners />
              </div>
            </motion.div>

            {/* Discord Status Card - Spans 2 cols */}
            <motion.div variants={itemVariants} className="md:col-span-2">
              <div className="bento-card h-full">
                <DiscordStatus />
              </div>
            </motion.div>

            {/* Social Links Card - Spans 2 cols */}
            <motion.div variants={itemVariants} className="md:col-span-2">
              <div className="bento-card flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Social Links
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/instagram"
                    className="social-link"
                    title="Instagram"
                  >
                    <FiInstagram className="h-3.5 w-3.5 text-pink-400" />
                  </a>

                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/tiktok"
                    className="social-link"
                    title="TikTok"
                  >
                    <SiTiktok className="h-3 w-3 text-[var(--text-primary)]" />
                  </a>

                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/spotify"
                    className="social-link"
                    title="Spotify"
                  >
                    <SiSpotify className="h-3.5 w-3.5 text-emerald-400" />
                  </a>

                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/pinterest"
                    className="social-link"
                    title="Pinterest"
                  >
                    <SiPinterest className="h-3.5 w-3.5 text-red-500" />
                  </a>

                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/discord"
                    className="social-link"
                    title="Discord"
                  >
                    <SiDiscord className="h-3.5 w-3.5 text-indigo-400" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Top Tracks - Spans 3 cols */}
            <motion.div variants={itemVariants} className="md:col-span-3">
              <div className="bento-card">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiMusic className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Top Tracks</h2>
                    </div>
                    <Link
                      href="/music"
                      className="text-[11px] font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--accent)' }}
                    >
                      View all →
                    </Link>
                  </div>

                  {/* Period Selector */}
                  <div className="flex justify-center">
                    <div
                      className="inline-flex rounded-lg p-0.5 gap-0.5"
                      style={{
                        background: 'color-mix(in srgb, var(--text-primary) 4%, transparent)',
                        border: '1px solid var(--card-border)',
                      }}
                    >
                      {(["short", "medium", "long"] as Period[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                          style={
                            period === p
                              ? { background: 'var(--accent)', color: '#fff' }
                              : { color: 'var(--text-secondary)' }
                          }
                          onMouseEnter={(e) => {
                            if (period !== p) {
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (period !== p) {
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }
                          }}
                        >
                          {p === "short" ? "1M" : p === "medium" ? "6M" : "1Y"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tracks */}
                  {tracksLoading ? (
                    <div className="flex justify-center items-center py-5">
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                        Loading tracks...
                      </div>
                    </div>
                  ) : tracks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {tracks.slice(0, 4).map((track, index) => {
                        const trackId = getTrackIdFromUrl(track.songUrl);
                        if (!trackId) return null;

                        return (
                          <motion.div
                            key={track.songUrl}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.04, duration: 0.25 }}
                            className="group overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                              border: '1px solid var(--card-border)',
                              background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
                            }}
                          >
                            <div
                              className="flex items-center justify-between border-b px-3 py-1.5"
                              style={{ borderColor: 'var(--card-border)' }}
                            >
                              <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                                {track.title}
                              </p>
                              <span className="text-[8px] uppercase tracking-wider text-[var(--text-secondary)]">
                                Spotify
                              </span>
                            </div>
                            <iframe
                              style={{
                                borderRadius: "0 0 12px 12px",
                              }}
                              src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                              width="100%"
                              height="152"
                              frameBorder="0"
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex justify-center items-center py-5">
                      <div className="text-xs text-[var(--text-secondary)]">No tracks found</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Projects - Spans 3 cols */}
            <motion.div variants={itemVariants} className="md:col-span-3">
              <div className="bento-card">
                <Projects />
              </div>
            </motion.div>

            {/* Music Page Link - Spans 3 cols */}
            <motion.div variants={itemVariants} className="md:col-span-3">
              <Link href="/music">
                <div
                  className="bento-card flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                      }}
                    >
                      <FiMusic className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        Music Library
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Explore my top tracks and what&apos;s playing now
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    }}
                  >
                    <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* GitHub Card - Spans 3 cols */}
            <motion.div variants={itemVariants} className="md:col-span-3">
              <a
                href="https://github.com/abyn365"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div
                  className="bento-card flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
                        border: '1px solid var(--card-border)',
                      }}
                    >
                      <FiGithub className="h-5 w-5 text-[var(--text-primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        GitHub
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Check out my open source work @abyn365
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
                    }}
                  >
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-10 text-center"
          >
            <p className="text-xs text-[var(--text-secondary)]">
              Copyright ©{' '}
              <span className="inline-block mx-1 relative group cursor-help">
                <span
                  className="transition-colors hover:opacity-80"
                  style={{ color: 'var(--accent)' }}
                >
                  {mounted ? new Date().getFullYear() : "----"}
                </span>
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border"
                  style={{
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  {mounted
                    ? new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Loading date...'}
                </span>
              </span>
              <a
                href="https://github.com/abyn365"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                abyn.xyz
              </a>
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}