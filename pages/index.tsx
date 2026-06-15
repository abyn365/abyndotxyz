import { useEffect, useState, useRef } from 'react';
import Image from "next/image";
import { motion } from "framer-motion";
import { FiGithub, FiInstagram, FiMail } from "react-icons/fi";
import {
  SiTiktok,
  SiSpotify,
  SiDiscord,
} from "react-icons/si";
import VisitorStats from "../components/Misc/VisitorStats.misc";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";
import TimeWeather from "../components/TimeWeather";
import Squares from "../components/Squares";

// Calculate age with decimal precision
const calculateAge = (birthDate: string): number => {
  const [day, month, year] = birthDate.split('/').map(Number);
  const birth = new Date(year, month - 1, day);
  const now = new Date();
  
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  
  // Calculate decimal precision (days into current year as fraction)
  const currentYearStart = new Date(now.getFullYear(), 0, 1);
  const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);
  const daysInYear = (nextYearStart.getTime() - currentYearStart.getTime()) / (1000 * 60 * 60 * 24);
  const dayOfYear = (now.getTime() - currentYearStart.getTime()) / (1000 * 60 * 60 * 24);
  const decimalPart = dayOfYear / daysInYear;
  
  return Math.floor((age + decimalPart) * 1000000000) / 1000000000; // Limit precision
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
  const ageRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Direct DOM writing via ref for zero re-render overhead
    const birthDate = '08/04/2009'; // Format: DD/MM/YYYY
    const tick = () => {
      if (ageRef.current) {
        ageRef.current.textContent = calculateAge(birthDate).toFixed(10);
      }
    };
    tick();
    const ageInterval = setInterval(tick, 50);
    
    setMounted(true);
    return () => clearInterval(ageInterval);
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
    { icon: FiMail, href: 'mailto:abyn@abyn.xyz', label: 'Email', color: 'text-amber-400' },
    { icon: SiDiscord, href: '/discord', label: 'Discord', color: 'text-indigo-400' },
    { icon: FiInstagram, href: '/instagram', label: 'Instagram', color: 'text-pink-400' },
    { icon: SiTiktok, href: '/tiktok', label: 'TikTok', color: 'text-[var(--text-primary)]' },
    { icon: SiSpotify, href: '/spotify', label: 'Spotify', color: 'text-emerald-400' },
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
            {/* Header with nested left column grouping */}
            <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-6 sm:gap-10 mb-8">
              {/* Nested Left Column Grouping */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="pt-1">
                  <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-2">
                    {username || 'Loading...'}
                  </h1>
                  <p className="text-lg text-[var(--text-secondary)]">
                    Software developer & builder
                  </p>
                </div>

                {/* Stats & Status nested inside the left column */}
                <div className="flex flex-wrap items-center gap-4">
                  <VisitorStats />
                  {discordStatus && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <div className="w-2 h-2 rounded-full" style={{
                        backgroundColor: discordStatus === 'online' ? '#10b981' : discordStatus === 'idle' ? '#f59e0b' : discordStatus === 'dnd' ? '#ef4444' : '#9ca3af'
                      }} />
                      <span className="capitalize">{discordStatus}</span>
                    </div>
                  )}
                </div>

                {/* Time & Weather directly in the left column */}
                <TimeWeather />
              </div>

              {/* Avatar on the right */}
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
              Hello! I'm Abyan (/uh-bye-an/), a student with a passion for software development.
I'm <span className="group relative font-mono font-medium text-[var(--text-primary)]">
  <span ref={ageRef}></span>
  {/* Age tooltip */}
  <span className="absolute bottom-full left-0 mb-2 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none origin-bottom-left">
    <span className="whitespace-nowrap rounded-xl px-4 py-2.5 text-xs border shadow-lg backdrop-blur-xl"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      <span className="font-medium text-[var(--text-primary)]">Born: April 8, 2009</span>
    </span>
    {/* Arrow */}
    <span className="absolute left-3 top-full -mt-px"
      style={{
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid var(--card-border)',
      }}
    />
  </span>
</span> years old.
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
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                    style={{
                      background: 'var(--social-bg-mix)',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    <Icon className={`h-4 w-4 sm:h-4 sm:w-4 ${social.color}`} />
                    <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">{social.label}</span>
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
