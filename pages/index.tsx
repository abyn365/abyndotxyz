import { useEffect, useRef, useState } from 'react';
import Image from "next/image";
import { motion } from "framer-motion";
import { FiGithub, FiMail, FiInstagram } from "react-icons/fi";
import { SiDiscord, SiTiktok, SiSpotify } from "react-icons/si";
import VisitorStats from "../components/Misc/VisitorStats.misc";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";
import TimeWeather from "../components/TimeWeather";
import Squares from "../components/Squares";

const BIRTH_YEAR = 2009;
const BIRTH_MONTH = 3; // April (0-based)
const BIRTH_DAY = 8;

function getCurrentAge() {
  const now = new Date();

  // Local/browser timezone dates
  const birth = new Date(BIRTH_YEAR, BIRTH_MONTH, BIRTH_DAY);
  const thisYearBirthday = new Date(now.getFullYear(), BIRTH_MONTH, BIRTH_DAY);

  const hasHadBirthdayThisYear = now >= thisYearBirthday;

  const lastBirthday = hasHadBirthdayThisYear
    ? thisYearBirthday
    : new Date(now.getFullYear() - 1, BIRTH_MONTH, BIRTH_DAY);

  const nextBirthday = hasHadBirthdayThisYear
    ? new Date(now.getFullYear() + 1, BIRTH_MONTH, BIRTH_DAY)
    : thisYearBirthday;

  const fullYears = hasHadBirthdayThisYear
    ? now.getFullYear() - birth.getFullYear()
    : now.getFullYear() - birth.getFullYear() - 1;

  const fractionOfYear =
    (now.getTime() - lastBirthday.getTime()) /
    (nextBirthday.getTime() - lastBirthday.getTime());

  return (fullYears + fractionOfYear).toFixed(10);
}

const CurrentAge = () => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const update = () => {
      if (ref.current) {
        ref.current.textContent = getCurrentAge();
      }
    };

    update();
    const interval = window.setInterval(update, 50); // update at ms

    return () => window.clearInterval(interval);
  }, []);

  return <span ref={ref} />;
};

type CustomStatus = {
  emoji?: {
    id: string;
    name: string;
    animated: boolean;
  };
  state?: string;
};

const getDiscordAvatar = (userId: string, avatarId: string) => {
  const isAnimated = avatarId.startsWith('a_');
  const extension = isAnimated ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${extension}?size=256`;
};

export default function Home() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customStatus, setCustomStatus] = useState<CustomStatus | null>(null);
  const [username, setUsername] = useState('');
  const [discordStatus, setDiscordStatus] = useState('');
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

  const socialLinks = [
    { icon: FiGithub, href: '/github', label: 'GitHub', color: 'text-[var(--text-primary)]' },
    { icon: FiMail, href: 'mailto:abyn@abyn.xyz', label: 'Email', color: 'text-[var(--text-primary)]' },
    { icon: SiDiscord, href: '/discord', label: 'Discord', color: 'text-[var(--text-primary)]' },
    { icon: FiInstagram, href: '/instagram', label: 'Instagram', color: 'text-[var(--text-primary)]' },
    { icon: SiTiktok, href: '/tiktok', label: 'TikTok', color: 'text-[var(--text-primary)]' },
    { icon: SiSpotify, href: '/spotify', label: 'Spotify', color: 'text-[var(--text-primary)]' },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background effect */}
      <div className="fixed inset-0 z-0">
        <Squares
          speed={0.15}
          squareSize={40}
          direction="diagonal"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col">
        <div className="mx-auto w-full max-w-2xl px-6 pt-24 pb-12 sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16"
          >
            {/* Header */}
            <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-8 mb-12">
              <div className="flex-1 min-w-0 space-y-6">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-[var(--text-primary)] mb-3">
                    {username || 'Abyan'}
                  </h1>
                  <p className="text-lg text-[var(--text-secondary)] font-normal">
                    Software developer & builder
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <VisitorStats />
                  {discordStatus && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            discordStatus === 'online'
                              ? '#10b981'
                              : discordStatus === 'idle'
                              ? '#f59e0b'
                              : discordStatus === 'dnd'
                              ? '#ef4444'
                              : '#9ca3af',
                        }}
                      />
                      <span className="capitalize">{discordStatus}</span>
                    </div>
                  )}
                </div>

                <TimeWeather />
              </div>

              {avatarUrl && (
                <div className="flex-shrink-0">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                    <Image
                      className="rounded-full border border-[var(--card-border)] object-cover grayscale-[0.2]"
                      src={avatarUrl}
                      alt="profile"
                      fill
                      sizes="(max-width: 640px) 96px, 112px"
                      priority
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-6 text-[var(--text-secondary)] text-lg leading-relaxed max-w-2xl">
              <p>
                Hello! I'm Abyan (/uh-bee-an/), a student with a passion for software development.
                I'm{' '}
                <span className="group relative font-medium text-[var(--text-primary)]">
                  <CurrentAge />
                  <span className="absolute bottom-full left-0 mb-3 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none origin-bottom-left">
                    <span
                      className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs border bg-[var(--bg-secondary)] border-[var(--border-color)] shadow-xl"
                    >
                      <span className="font-medium text-[var(--text-primary)]">
                        Born: April 8, 2009
                      </span>
                    </span>
                  </span>
                </span>{' '}
                years old.
              </p>
            </div>

            {/* Live activity */}
            <div className="mt-16 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--text-secondary)]">
                  Active Now
                </span>
                <div className="h-px flex-1 bg-[var(--border-color)] opacity-50" />
              </div>
              <DiscordStatus />
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="mb-20"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-6">
              Links
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-300 hover:border-[var(--text-primary)] group"
                  >
                    <Icon className={`h-4 w-4 ${social.color} opacity-70 group-hover:opacity-100`} />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {social.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-12 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--text-secondary)]"
          >
            <p>
              &copy; {mounted ? new Date().getFullYear() : '2024'} Abyan. Built with Next.js.
            </p>
            <div className="flex items-center gap-4">
              <a href="/github" className="hover:text-[var(--text-primary)] transition-colors">GitHub</a>
              <a href="/spotify" className="hover:text-[var(--text-primary)] transition-colors">Spotify</a>
            </div>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
