import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiGithub, FiInstagram, FiMusic } from "react-icons/fi";

// Calculate age with decimal precision
const calculateAge = (birthDate: string): number => {
  const [day, month, year] = birthDate.split("/").map(Number);
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
  const daysInYear =
    (nextYearStart.getTime() - currentYearStart.getTime()) /
    (1000 * 60 * 60 * 24);
  const dayOfYear =
    (now.getTime() - currentYearStart.getTime()) / (1000 * 60 * 60 * 24);
  const decimalPart = dayOfYear / daysInYear;

  return Math.floor((age + decimalPart) * 1000000000) / 1000000000; // Limit precision
};
import { SiTiktok, SiSpotify, SiPinterest, SiDiscord } from "react-icons/si";
import Projects from "../components/Projects";
import VisitorStats from "../components/Misc/VisitorStats.misc";
import TimeWeather from "../components/TimeWeather";
import SideRays from "../components/SideRays/SideRays";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";

type CustomStatus = {
  emoji?: {
    id: string;
    name: string;
    animated: boolean;
  };
  state?: string;
};

const bio = "The biolink of a dumbass 🗿";

const getDiscordAvatar = (userId: string, avatarId: string) => {
  const isAnimated = avatarId.startsWith("a_");
  const extension = isAnimated ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${extension}?size=256`;
};

const getStatusImage = (status: string) => {
  const statusMap = {
    online: "https://cdn3.emoji.gg/emojis/1514-online-blank.png",
    idle: "https://cdn3.emoji.gg/emojis/5204-idle-blank.png",
    dnd: "https://cdn3.emoji.gg/emojis/4431-dnd-blank.png",
    offline: "https://cdn3.emoji.gg/emojis/6610-invisible-offline-blank.png",
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.offline;
};

export default function Home() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [customStatus, setCustomStatus] = useState<CustomStatus | null>(null);
  const [username, setUsername] = useState("");
  const [discordStatus, setDiscordStatus] = useState("");
  const [mounted, setMounted] = useState(false);
  const [age, setAge] = useState(0);

  useEffect(() => {
    // Update age calculation every second for decimal precision
    const updateAge = () => {
      const birthDate = "08/04/2009"; // Format: DD/MM/YYYY
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
        const response = await fetch(
          "https://api.lanyard.rest/v1/users/877018055815868426"
        );
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
        console.error("Failed to fetch Discord user:", error);
      }
    };

    fetchDiscordUser();
    const interval = setInterval(fetchDiscordUser, 10000);
    return () => clearInterval(interval);
  }, []);

  const socialLinks = [
    {
      icon: FiInstagram,
      href: "/instagram",
      label: "Instagram",
      color: "text-pink-400",
    },
    {
      icon: SiTiktok,
      href: "/tiktok",
      label: "TikTok",
      color: "text-[var(--text-primary)]",
    },
    {
      icon: SiSpotify,
      href: "/spotify",
      label: "Spotify",
      color: "text-emerald-400",
    },
    {
      icon: SiPinterest,
      href: "/pinterest",
      label: "Pinterest",
      color: "text-red-500",
    },
    {
      icon: SiDiscord,
      href: "/discord",
      label: "Discord",
      color: "text-indigo-400",
    },
    {
      icon: FiGithub,
      href: "https://github.com/abyn365",
      label: "GitHub",
      color: "text-[var(--text-primary)]",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background effect */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_34%),var(--bg-primary)]">
        <SideRays
          speed={1.65}
          rayColor1="#ff6347"
          rayColor2="#96c8ff"
          intensity={1.55}
          spread={2.2}
          origin="top-right"
          tilt={-5}
          saturation={1.25}
          blend={0.72}
          falloff={1.75}
          opacity={0.42}
          className="h-full w-full"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-primary)_4%,transparent),var(--bg-primary)_92%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 lg:mb-14"
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
              <div className="bento-card bento-spotlight p-5 sm:p-7">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="mb-2 text-4xl font-bold text-[var(--text-primary)] sm:text-5xl">
                      {username || "Loading..."}
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)]">
                      Software developer & builder
                    </p>
                  </div>
                  {avatarUrl && (
                    <div className="flex-shrink-0">
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                        <Image
                          className="rounded-2xl border-2 border-[var(--card-border)] object-cover"
                          src={avatarUrl}
                          alt="profile"
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          priority
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats & Status */}
                <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <VisitorStats />
                  {discordStatus && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            discordStatus === "online"
                              ? "#10b981"
                              : discordStatus === "idle"
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                      <span className="capitalize">{discordStatus}</span>
                    </div>
                  )}
                </div>

                {/* Time & Weather */}
                <div className="mb-8">
                  <TimeWeather />
                </div>

                {/* Bio */}
                <p className="mb-6 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
                  Hello! I'm Abyn, I'm a student with a passion for software
                  development. I'm {age.toFixed(10)} years old
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/music"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all duration-300 hover:scale-105"
                    style={{
                      background: "var(--accent)",
                    }}
                  >
                    <FiMusic className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">
                      More music
                    </span>
                  </Link>
                </div>
              </div>

              <aside className="bento-card bento-spotlight p-4 sm:p-5 lg:sticky lg:top-8">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                      Live activity
                    </p>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                      Discord & Spotify
                    </h2>
                  </div>
                  <FiMusic className="h-5 w-5 text-[var(--text-secondary)]" />
                </div>
                <DiscordStatus />
              </aside>
            </div>
          </motion.div>

          {/* Projects Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-14"
          >
            <h2 className="mb-8 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
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
            <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">
              Connect
            </h2>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                const isExternal = social.href.startsWith("http");
                const Component = isExternal ? "a" : Link;

                return (
                  <Component
                    key={social.label}
                    href={social.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all duration-300 hover:scale-105"
                    style={{
                      background:
                        "color-mix(in srgb, var(--text-primary) 4%, transparent)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <Icon className={`h-4 w-4 ${social.color}`} />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {social.label}
                    </span>
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
            className="border-t border-[var(--card-border)] pt-8 text-center text-sm text-[var(--text-secondary)]"
          >
            <p>
              © {mounted ? new Date().getFullYear() : "2024"}{" "}
              <a
                href="https://github.com/abyn365"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--accent)]"
                style={{ color: "var(--accent)" }}
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
