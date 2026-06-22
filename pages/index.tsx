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
    { icon: FiMail, href: 'mailto:abyn@abyn.xyz', label: 'Email', color: 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]' },
    { icon: SiDiscord, href: '/discord', label: 'Discord', color: 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]' },
    { icon: FiInstagram, href: '/instagram', label: 'Instagram', color: 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]' },
    { icon: SiTiktok, href: '/tiktok', label: 'TikTok', color: 'text-[var(--text-primary)]' },
    { icon: SiSpotify, href: '/spotify', label: 'Spotify', color: 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]' },
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
        <div className="mx-auto w-full max-w-3xl px-4 pt-16 pb-8 sm:px-6 lg:px-8 lg:pt-24 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            {/* Header */}
            <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-6 sm:gap-10 mb-8">
              <div className="flex-1 min-w-0 space-y-4">
                <div className="pt-1">
                  <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-2">
                    {username || 'Loading...'}
                  </h1>
                  <p className="text-lg text-[var(--text-secondary)]">
                    Software developer & builder
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <VisitorStats />
                  {discordStatus && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <div
                        className="w-2 h-2 rounded-full"
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
                <div className="flex-shrink-0 self-center sm:self-start">
                  <div className="relative h-28 w-28 sm:h-36 sm:w-36">
                    <Image
                      className="rounded-[2rem] border border-[var(--card-border)] object-cover shadow-sm"
                      src={avatarUrl}
                      alt="profile"
                      fill
                      sizes="(max-width: 640px) 112px, 144px"
                      priority
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-6">
              Hello! I'm Abyan (/uh-bee-an/), a student with a passion for software development.
              I'm{' '}
              <span className="group relative font-mono font-medium text-[var(--text-primary)]">
                <CurrentAge />
                <span className="absolute bottom-full left-0 mb-2 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none origin-bottom-left">
                  <span
                    className="whitespace-nowrap rounded-xl px-4 py-2.5 text-xs border shadow-lg backdrop-blur-xl"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }}
                  >
                    <span className="font-medium text-[var(--text-primary)]">
                      Born: April 8, 2009
                    </span>
                  </span>
                  <span
                    className="absolute left-3 top-full -mt-px"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid var(--card-border)',
                    }}
                  />
                </span>
              </span>{' '}
              years old.
            </p>

            {/* Live activity */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Live activity
                </span>
              </div>
              <DiscordStatus />
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10"
          >
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              Connect
            </h2>

            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex flex-col items-center justify-center gap-1.5 px-2.5 py-2 min-h-16 rounded-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto sm:flex-row sm:gap-2 sm:px-4 sm:py-2.5 sm:min-h-0 sm:rounded-lg"
                    style={{
                      background: 'var(--social-bg-mix)',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    <Icon className={`h-5 w-5 sm:h-4 sm:w-4 ${social.color}`} />
                    <span className="text-[9px] leading-none sm:text-sm font-medium text-[var(--text-primary)] text-center">
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
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-6 border-t border-[var(--card-border)] text-center text-sm text-[var(--text-secondary)]"
          >
            <p>
              &copy; {mounted ? new Date().getFullYear() : '2024'}{' '}
              <a
                href="https://github.com/abyn365"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--accent)]"
                style={{ color: 'var(--accent)' }}
              >
                abyn
              </a>
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
