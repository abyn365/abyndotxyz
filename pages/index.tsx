import { useEffect, useState } from 'react';
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiGithub, FiInstagram, FiMusic } from "react-icons/fi";

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
import {
  SiTiktok,
  SiSpotify,
  SiPinterest,
  SiDiscord,
} from "react-icons/si";
import Projects from "../components/Projects";
import VisitorStats from "../components/Misc/VisitorStats.misc";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";
import TimeWeather from "../components/TimeWeather";
import Squares from "../components/Squares";

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
  const [age, setAge] = useState(0);

  useEffect(() => {
    // Update age calculation every second for decimal precision
    const updateAge = () => {
      const birthDate = '08/04/2009'; // Format: DD/MM/YYYY
      setAge(calculateAge(birthDate));
    };
    
    updateAge();
    const ageInterval = setInterval(updateAge, 1000);
    
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
    { icon: FiInstagram, href: '/instagram', label: 'Instagram', color: 'text-pink-400' },
    { icon: SiTiktok, href: '/tiktok', label: 'TikTok', color: 'text-[var(--text-primary)]' },
    { icon: SiSpotify, href: '/spotify', label: 'Spotify', color: 'text-emerald-400' },
    { icon: SiPinterest, href: '/pinterest', label: 'Pinterest', color: 'text-red-500' },
    { icon: SiDiscord, href: '/discord', label: 'Discord', color: 'text-indigo-400' },
    { icon: FiGithub, href: 'https://github.com/abyn365', label: 'GitHub', color: 'text-[var(--text-primary)]' },
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
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-6 sm:gap-10">
              <div className="min-w-0 flex-1 pt-1">
                <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-2">
                  {username || 'Loading...'}
                </h1>
                <p className="text-lg text-[var(--text-secondary)]">
                  Software developer & builder
                </p>
              </div>
              {avatarUrl && (
                <div className="flex-shrink-0">
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

            {/* Stats & Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <VisitorStats />
              {discordStatus && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <div className="w-2 h-2 rounded-full" style={{
                    backgroundColor: discordStatus === 'online' ? '#10b981' : discordStatus === 'idle' ? '#f59e0b' : '#ef4444'
                  }} />
                  <span className="capitalize">{discordStatus}</span>
                </div>
              )}
            </div>

            {/* Time & Weather */}
            <div className="mb-8">
              <TimeWeather />
            </div>

            {/* Bio */}
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-6">
              Hello! I'm Abyn, I'm a student with a passion for software development. I'm {age.toFixed(10)} years old
            </p>

            {/* Music + live activity */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/music" className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'var(--accent)',
                  }}>
                  <FiMusic className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">My Music</span>
                </Link>
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Live activity
                </span>
              </div>
              <div className="mx-auto w-full max-w-md">
                <DiscordStatus />
              </div>
            </div>
          </motion.div>

          {/* Projects Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-20"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-8">
              Projects
            </h2>
            <Projects />
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              Connect
            </h2>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                const isExternal = social.href.startsWith('http');
                const Component = isExternal ? 'a' : Link;

                return (
                  <Component
                    key={social.label}
                    href={social.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'color-mix(in srgb, var(--text-primary) 4%, transparent)',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    <Icon className={`h-4 w-4 ${social.color}`} />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{social.label}</span>
                  </Component>
                );
              })}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-8 border-t border-[var(--card-border)] text-center text-sm text-[var(--text-secondary)]"
          >
            <p>
              © {mounted ? new Date().getFullYear() : '2024'}{' '}
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
