import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Activity,
  CheckCircle2,
  Monitor,
  Smartphone,
  Laptop,
  MessageSquare,
  Heart,
  Crown,
  Code,
  Mail,
} from "lucide-react";
import {
  SiSpotify,
  SiGithub,
  SiRoblox,
  SiTiktok,
  SiPinterest,
  SiDiscord,
} from "react-icons/si";
import { FiInstagram } from "react-icons/fi";
import { useLanyard } from "../hooks/useLanyard";
import { useMusicPlayer } from "../components/music/MusicPlayerContext";
import { useTheme } from "../components/ThemeProvider";
import { DISCORD_ID, transformPresence } from "../lib/discord";
import TimeWeather from "../components/TimeWeather";
import VisitorStats from "../components/Misc/VisitorStats.misc";
import Projects from "../components/Projects";
import { PageFooter } from "../components/PageFooter";
import ActivityHistory from "../components/Misc/ActivityHistory";
import GameDetailsModal from "../components/Misc/GameDetailsModal";
import GuildDetailsModal from "../components/Misc/GuildDetailsModal";

// Guestbook Message Type
interface GuestbookMessage {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  likes?: string[];
}

// Dustin API Response Types
interface DiscordBadge {
  id: string;
  description: string;
  icon: string;
  link?: string;
}

interface ConnectedAccount {
  type: string;
  id: string;
  name: string;
  verified: boolean;
}

interface ProfileData {
  user: {
    username: string;
    global_name: string;
    avatar: string;
    banner: string | null;
    banner_color: string | null;
  };
  user_profile: {
    bio: string;
    pronouns: string;
  };
  connected_accounts: ConnectedAccount[];
  badges: DiscordBadge[];
}

/* ─── Age counter ─────────────────────────────────────── */
const BIRTH = new Date(2009, 3, 8);

function getAge() {
  const now = Date.now();
  const start = BIRTH.getTime();
  const yearMs =
    new Date(
      BIRTH.getFullYear() + 1,
      BIRTH.getMonth(),
      BIRTH.getDate()
    ).getTime() - start;
  return ((now - start) / yearMs).toFixed(10);
}

function LiveAge() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tick = () => {
      if (ref.current) ref.current.textContent = getAge();
    };
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, []);
  return <span ref={ref} className="font-mono text-xs tabular-nums" />;
}

/* ─── Discord status dots & icons ─────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  online: "bg-[#23a55a]",
  idle: "bg-[#f0b232]",
  dnd: "bg-[#f23f43]",
  offline: "bg-[#80848e]",
};

const STATUS_TEXT: Record<string, string> = {
  online: "online",
  idle: "idle",
  dnd: "busy",
  offline: "offline",
};

/* ─── Social Connection Assets ─────────────────────────── */
const CONNECTION_ICONS: Record<string, any> = {
  github: SiGithub,
  spotify: SiSpotify,
  roblox: SiRoblox,
  tiktok: SiTiktok,
  domain: Globe,
};

const CONNECTION_URLS: Record<string, (name: string) => string> = {
  github: () => `/github`,
  spotify: () => `/spotify`,
  roblox: () => `/roblox`,
  tiktok: () => `/tiktok`,
  domain: (name) => `https://${name}`,
};

const SOCIAL_LINKS = [
  { label: "Discord", name: "@abynb", url: "/discord", icon: SiDiscord },
  { label: "Instagram", name: "@abyb.1", url: "/instagram", icon: FiInstagram },
  { label: "Pinterest", name: "@abyn6", url: "/pinterest", icon: SiPinterest },
  {
    label: "Email",
    name: "abyn@abyn.xyz",
    url: "mailto:abyn@abyn.xyz",
    icon: Mail,
  },
];

// Activity Timer helper inside status tab
function ActivityTimer({ start }: { start: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  const timeString =
    h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;

  return <span>{timeString}</span>;
}

// Discord Inline Backtick & Plain URL Markdown Formatter
function parseBio(text: string) {
  if (!text) return null;

  // Split content matching blocks inside single backticks
  const tokens = text.split(/(`[^`]+`)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("`") && token.endsWith("`")) {
      const codeText = token.slice(1, -1);
      return (
        <span
          key={idx}
          className="mx-0.5 inline-flex items-center rounded border border-white/5 bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400"
        >
          {codeText}
        </span>
      );
    }

    // Isolate absolute URLs within structural text content segments
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const subTokens = token.split(urlRegex);

    return subTokens.map((subToken, subIdx) => {
      if (subToken.match(urlRegex)) {
        return (
          <a
            key={`${idx}-${subIdx}`}
            href={subToken}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-0.5 inline-flex items-center break-all font-mono text-[11px] text-blue-400 hover:underline"
          >
            {subToken}
          </a>
        );
      }
      return (
        <span key={`${idx}-${subIdx}`} className="text-neutral-300">
          {subToken}
        </span>
      );
    });
  });
}

export default function Home() {
  const { presence } = useLanyard(DISCORD_ID);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<any[]>([]);

  // Fetch web badges on mount
  useEffect(() => {
    fetch("/api/badges")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBadges(data.badges || []);
        }
      })
      .catch((err) => console.error("Error loading web badges:", err));
  }, []);
  const [activeTab, setActiveTab] = useState<
    "activity" | "projects" | "guestbook"
  >("activity");

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGameName, setSelectedGameName] = useState<string | null>(null);
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const { theme } = useTheme();

  // Update activity history when presence changes
  const serializedActivities = JSON.stringify(presence?.activities || []);
  useEffect(() => {
    if (presence?.activities && presence.activities.length > 0) {
      fetch("/api/discord-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activities: presence.activities }),
      }).catch((err) => console.error("Failed to update activity history:", err));
    }
  }, [serializedActivities]);

  // Copy state
  const [usernameCopied, setUsernameCopied] = useState(false);

  // Guestbook states
  const [guestbookName, setGuestbookName] = useState("");
  const [guestbookMessage, setGuestbookMessage] = useState("");
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [guestbookLoading, setGuestbookLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Visitor Auth states
  const [visitor, setVisitor] = useState<{ username: string } | null>(null);
  const [visitorLoading, setVisitorLoading] = useState(true);
  const [visitorToken, setVisitorToken] = useState("");
  const [showVisitorMenu, setShowVisitorMenu] = useState(false);
  const [visitorTab, setVisitorTab] = useState<"login" | "register">("login");
  const [visitorUsername, setVisitorUsername] = useState("");
  const [visitorPassword, setVisitorPassword] = useState("");
  const [visitorError, setVisitorError] = useState("");
  const [visitorSuccess, setVisitorSuccess] = useState("");
  const [authActionLoading, setAuthActionLoading] = useState(false);

  // Guestbook reply states
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  // Turnstile state for visitor auth
  const visitorTurnstileContainerRef = useRef<HTMLDivElement>(null);
  const [visitorTurnstileToken, setVisitorTurnstileToken] = useState("");

  // Fetch Dustin profile data
  useEffect(() => {
    fetch(`https://dcdn.dstn.to/profile/${DISCORD_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setProfileData(data);
      })
      .catch((err) => console.error("Error loading Dustin profile:", err));
  }, []);

  // Fetch visitor auth status & guestbook messages
  useEffect(() => {
    // 1. Fetch visitor status
    fetch("/api/visitor/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.authenticated && data.user) {
            setVisitor(data.user);
          }
          if (data.csrfToken) {
            setVisitorToken(data.csrfToken);
          }
        }
        setVisitorLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching visitor status:", err);
        setVisitorLoading(false);
      });

    // 2. Fetch guestbook messages
    fetch("/api/guestbook")
      .then((res) => {
        if (!res.ok) throw new Error("API response error");
        return res.json();
      })
      .then((data) => {
        if (data.success) setMessages(data.messages);
        setMessagesLoading(false);
      })
      .catch((err) => {
        console.error("Error loading guestbook:", err);
        setMessagesLoading(false);
      });
  }, []);

  // Sync visitor status with guestbook input name
  useEffect(() => {
    if (visitor) {
      setGuestbookName(visitor.username);
    } else {
      setGuestbookName("");
    }
  }, [visitor]);

  // Initialize Turnstile widget for visitor auth
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initVisitorWidget = () => {
      const win = window as any;
      if (win.turnstile && visitorTurnstileContainerRef.current) {
        try {
          visitorTurnstileContainerRef.current.innerHTML = "";
          win.turnstile.render(visitorTurnstileContainerRef.current, {
            sitekey:
              process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
              "0x4AAAAAADv9KsIrMSbSARa-",
            callback: (token: string) => {
              setVisitorTurnstileToken(token);
            },
          });
        } catch (e) {
          console.error("Visitor Turnstile render error:", e);
        }
      }
    };

    if (showVisitorMenu && !visitor) {
      const win = window as any;
      if (win.turnstile) {
        initVisitorWidget();
      } else {
        checkInterval = setInterval(() => {
          if (win.turnstile) {
            initVisitorWidget();
            clearInterval(checkInterval);
          }
        }, 500);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [showVisitorMenu, visitorTab, visitor]);

  // Initialize Turnstile widget
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initWidget = () => {
      const win = window as any;
      if (win.turnstile && turnstileContainerRef.current) {
        try {
          win.turnstile.render(turnstileContainerRef.current, {
            sitekey:
              process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
              "1x00000000000000000000AA",
            callback: (token: string) => {
              setTurnstileToken(token);
              setErrorMsg("");
            },
          });
          clearInterval(checkInterval);
        } catch (e) {
          console.error("Turnstile render error", e);
        }
      }
    };

    if (activeTab === "guestbook") {
      checkInterval = setInterval(initWidget, 500);
    }

    return () => {
      clearInterval(checkInterval);
    };
  }, [activeTab]);

  // Handle Clipboard Copy
  const handleCopyUsername = () => {
    const rawUsername = profileData?.user?.username || "abynb";
    navigator.clipboard
      .writeText(rawUsername)
      .then(() => {
        setUsernameCopied(true);
        setTimeout(() => setUsernameCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Could not copy username: ", err);
      });
  };

  // Handle Guestbook Submission
  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestbookName.trim() || !guestbookMessage.trim()) {
      setErrorMsg("Please fill in both fields.");
      return;
    }
    if (!turnstileToken) {
      setErrorMsg("Please complete the security check.");
      return;
    }

    setGuestbookLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: guestbookName,
          message: guestbookMessage,
          token: turnstileToken,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Message sent successfully!");
        setGuestbookName(visitor ? visitor.username : "");
        setGuestbookMessage("");
        setTurnstileToken("");
        // Refresh list
        const listRes = await fetch("/api/guestbook");
        const listData = await listRes.json();
        if (listData.success) {
          setMessages(listData.messages);
        }
        // Reset widget
        const win = window as any;
        if (win.turnstile) win.turnstile.reset();
      } else {
        setErrorMsg(data.error || "Failed to submit comment.");
      }
    } catch (err) {
      setErrorMsg("Server error. Please try again later.");
    } finally {
      setGuestbookLoading(false);
    }
  };

  // Toggle Message Like (synced with visitor auth backend)
  const toggleLike = async (msgId: string) => {
    if (!visitor) {
      setVisitorError("Sign in or register to like messages!");
      setShowVisitorMenu(true);
      return;
    }

    try {
      const res = await fetch("/api/guestbook/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": visitorToken,
        },
        body: JSON.stringify({ messageId: msgId }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh messages list to get updated likes
        const listRes = await fetch("/api/guestbook");
        const listData = await listRes.json();
        if (listData.success) {
          setMessages(listData.messages);
        }
      } else {
        setVisitorError(data.error || "Failed to toggle like.");
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  // Visitor Login/Registration
  const handleVisitorAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorUsername.trim() || !visitorPassword.trim()) {
      setVisitorError("Username and password are required.");
      return;
    }

    if (!visitorTurnstileToken) {
      setVisitorError("Please complete the security challenge.");
      return;
    }

    setAuthActionLoading(true);
    setVisitorError("");
    setVisitorSuccess("");

    const endpoint =
      visitorTab === "login"
        ? "/api/visitor/auth/login"
        : "/api/visitor/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": visitorToken,
        },
        body: JSON.stringify({
          username: visitorUsername,
          password: visitorPassword,
          token: visitorTurnstileToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVisitor(data.user);
        setVisitorSuccess(
          visitorTab === "login" ? "Logged in!" : "Registered & logged in!"
        );
        setVisitorUsername("");
        setVisitorPassword("");
        setVisitorTurnstileToken("");

        // Fetch new csrf token (since session ID changed)
        const statusRes = await fetch("/api/visitor/auth/status");
        const statusData = await statusRes.json();
        if (statusData.success && statusData.csrfToken) {
          setVisitorToken(statusData.csrfToken);
        }

        // Refresh messages
        const listRes = await fetch("/api/guestbook");
        const listData = await listRes.json();
        if (listData.success) {
          setMessages(listData.messages);
        }
        // Auto-close menu after 1.5s
        setTimeout(() => setShowVisitorMenu(false), 1500);
      } else {
        setVisitorError(data.error || "Authentication failed.");
        const win = window as any;
        if (win.turnstile) win.turnstile.reset();
        setVisitorTurnstileToken("");
      }
    } catch (err) {
      setVisitorError("Server error. Please try again.");
      const win = window as any;
      if (win.turnstile) win.turnstile.reset();
      setVisitorTurnstileToken("");
    } finally {
      setAuthActionLoading(false);
    }
  };

  // Visitor Logout
  const handleVisitorLogout = async () => {
    setAuthActionLoading(true);
    try {
      const res = await fetch("/api/visitor/auth/logout", {
        method: "POST",
        headers: {
          "x-csrf-token": visitorToken,
        },
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setVisitor(null);
        setVisitorSuccess("Logged out successfully.");
        setVisitorError("");

        // Fetch new anonymous token
        const statusRes = await fetch("/api/visitor/auth/status");
        const statusData = await statusRes.json();
        if (statusData.success && statusData.csrfToken) {
          setVisitorToken(statusData.csrfToken);
        }

        // Refresh messages
        const listRes = await fetch("/api/guestbook");
        const listData = await listRes.json();
        if (listData.success) {
          setMessages(listData.messages);
        }
      }
    } catch (err) {
      console.error("Logout failed:", err);
      setVisitorError("Logout failed. Please reload the page.");
    } finally {
      setAuthActionLoading(false);
    }
  };

  // Handle Guestbook Reply submission
  const handlePostReply = async (e: React.FormEvent, messageId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    if (!visitor) {
      setVisitorError("Sign in or register to reply!");
      setShowVisitorMenu(true);
      return;
    }

    setReplyLoading(true);
    try {
      const res = await fetch("/api/guestbook/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": visitorToken,
        },
        body: JSON.stringify({ messageId, message: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText("");
        setReplyingToId(null);
        // Refresh messages list
        const listRes = await fetch("/api/guestbook");
        const listData = await listRes.json();
        if (listData.success) {
          setMessages(listData.messages);
        }
      } else {
        setVisitorError(data.error || "Failed to submit reply.");
      }
    } catch (err) {
      console.error("Reply submit error:", err);
    } finally {
      setReplyLoading(false);
    }
  };

  // Status variables
  const statusInfo = presence ? transformPresence(presence) : null;
  const currentStatus = presence?.discord_status || "offline";
  const statusColorClass = STATUS_COLORS[currentStatus];

  // Custom Discord Banner Status evaluation (Type 4: Custom Status)
  const customStatus = presence?.activities?.find((act) => act.type === 4);

  // Active Device Icon with color matching the status
  const getDeviceIcon = () => {
    if (currentStatus === "offline") return null;

    let colorClass = "text-neutral-400";
    if (currentStatus === "online")
      colorClass = "text-[#23a55a] fill-[#23a55a]/10";
    else if (currentStatus === "idle")
      colorClass = "text-[#f0b232] fill-[#f0b232]/10";
    else if (currentStatus === "dnd")
      colorClass = "text-[#f23f43] fill-[#f23f43]/10";

    if (presence?.active_on_discord_desktop)
      return <Monitor className={`h-4 w-4 shrink-0 ${colorClass}`} />;
    if (presence?.active_on_discord_mobile)
      return <Smartphone className={`h-4 w-4 shrink-0 ${colorClass}`} />;
    if (presence?.active_on_discord_web)
      return <Laptop className={`h-4 w-4 shrink-0 ${colorClass}`} />;
    return null;
  };

  // Avatar URL
  const avatarHash =
    profileData?.user?.avatar || (presence as any)?.discord_user?.avatar;
  const isAnimatedAvatar = avatarHash?.startsWith("a_");
  const avatarUrl = isAnimatedAvatar
    ? `https://dcdn.dstn.to/avatars/${DISCORD_ID}`
    : avatarHash
    ? `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${avatarHash}.png?size=512`
    : `https://dcdn.dstn.to/avatars/${DISCORD_ID}`;

  // Avatar Decoration
  const decoData = (presence as any)?.discord_user?.avatar_decoration_data;
  const decoUrl = decoData?.asset
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${decoData.asset}.png`
    : null;

  // Banner Style
  const bannerHash = profileData?.user?.banner;
  const isAnimatedBanner = bannerHash?.startsWith("a_");
  const bannerStyle = isAnimatedBanner
    ? {
        backgroundImage: `url(https://dcdn.dstn.to/banners/${DISCORD_ID})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : bannerHash
    ? {
        backgroundImage: `url(https://cdn.discordapp.com/banners/${DISCORD_ID}/${bannerHash}.png?size=1024)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : profileData?.user?.banner_color
    ? { backgroundColor: profileData.user.banner_color }
    : {
        background: "linear-gradient(135deg, #16171a 0%, #0d0e10 100%)",
      };

  const hasTiktokConnection = profileData?.connected_accounts?.some(
    (acc) => acc.type === "tiktok"
  );

  const displayedSocials = [...SOCIAL_LINKS];
  if (!hasTiktokConnection) {
    displayedSocials.push({
      label: "TikTok",
      name: "@abyb.1",
      url: "/tiktok",
      icon: SiTiktok,
    });
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Script for CF Turnstile */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />

      {/* ── Discord Profile Card ── */}
      <motion.div
        className="discord-glass-panel mb-6 flex flex-col overflow-hidden rounded-xl border border-[var(--discord-card-border)] shadow-2xl cursor-default"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        onMouseMove={(e) => {
          const card = e.currentTarget;
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const rotateX = ((y / rect.height) - 0.5) * -6;
          const rotateY = ((x / rect.width) - 0.5) * 6;
          card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
          e.currentTarget.style.transition = "transform 500ms cubic-bezier(0.25, 0.8, 0.25, 1)";
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transition = "transform 120ms ease-out";
        }}
      >
        {/* Banner Section */}
        <div
          className="relative h-32 w-full shrink-0 bg-cover bg-center"
          style={bannerStyle}
        >
          {/* Dark tint overlay */}
          <div className="absolute inset-0 bg-black/15" />

          {/* Dynamic Lanyard Custom Status Pill Floating on Banner */}
          {customStatus && (customStatus.state || customStatus.emoji) && (
            <div className="absolute bottom-3 left-28 flex max-w-[200px] items-center gap-1.5 truncate rounded-full border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)]/80 px-3 py-1 text-[10px] text-[var(--discord-card-text)] backdrop-blur-md sm:max-w-xs">
              {customStatus.emoji &&
                (customStatus.emoji.id ? (
                  <img
                    src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.png`}
                    alt={customStatus.emoji.name || "status-emoji"}
                    className="h-3.5 w-3.5 shrink-0 object-contain"
                    draggable={false}
                  />
                ) : (
                  <span className="shrink-0">{customStatus.emoji.name}</span>
                ))}
              {customStatus.state && (
                <span className="truncate">{customStatus.state}</span>
              )}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="relative flex flex-col px-4 pb-4 pt-0">
          {/* Avatar placement */}
          <div className="relative z-10 -mt-10 mb-3 w-fit">
            <div className="relative h-20 w-20 rounded-full border-4 border-[var(--bg-primary)] bg-neutral-900">
              <div className="h-full w-full overflow-hidden rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              
              {/* Avatar Decoration Overlay */}
              {decoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={decoUrl}
                  alt=""
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[120%] w-[120%] max-w-none pointer-events-none z-20 object-contain"
                  draggable={false}
                />
              )}
            </div>
            {/* Status dot */}
            <span
              className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-4 border-[var(--bg-primary)] z-30 ${statusColorClass}`}
            />
          </div>

          {/* User Display Name, Guild Tag, and Device line with Nameplate collectible background */}
          <div className="relative mb-2 flex min-h-[44px] w-full items-center justify-between overflow-hidden rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)]/60 px-3 py-2.5">
            {/* Thinner Nameplate video banner (Fills only this display name box) */}
            <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
              <video
                src="https://cdn.discordapp.com/assets/collectibles/nameplates/gothica/nevermore/asset.webm"
                autoPlay
                loop
                muted
                playsInline
                className={`h-full w-full object-cover opacity-45 ${theme === "light" ? "mix-blend-multiply" : "mix-blend-screen"}`}
              />
            </div>

            <div className="relative z-10 flex items-center gap-2">
              <h1 className="font-display text-lg font-bold leading-none tracking-tight text-[var(--discord-card-text)]">
                {profileData?.user?.global_name || profileData?.user?.username || "abyn"}
              </h1>

              {/* Guild Tag NBHD */}
              <button
                onClick={() => setSelectedGuildId("811266344397701162")}
                className="inline-flex items-center gap-1 rounded border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] px-1 py-0.5 text-[9px] font-bold leading-none text-[var(--discord-card-text)] cursor-pointer hover:bg-[var(--discord-card-border)] transition-colors select-none"
                title="Click to view server details"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://cdn.discordapp.com/clan-badges/811266344397701162/c8d016eed5c8752316ca38fdd54380c6.png"
                  alt=""
                  className="h-3 w-3 object-contain"
                />
                <span>NBHD</span>
              </button>
            </div>

            {/* Device Status icon and gold Owner Crown */}
            <div className="relative z-10 flex items-center gap-1.5">
              {getDeviceIcon()}
              <Crown className="h-4 w-4 shrink-0 fill-yellow-500/10 text-yellow-500" />
            </div>
          </div>

          {/* Username & Badges row (Rendered OUTSIDE the Nameplate block to prevent clipping) */}
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex select-none items-center gap-2 font-mono text-xs">
              <button
                onClick={handleCopyUsername}
                className={`outline-none transition-colors duration-150 focus:outline-none ${
                  usernameCopied
                    ? "font-semibold text-green-400"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
                title="Click to copy username"
              >
                {usernameCopied
                  ? "Copied username!"
                  : `@${profileData?.user?.username || "abynb"}`}
              </button>
              {!profileData ? (
                <span className="inline-block h-3 w-10 animate-pulse rounded bg-white/5" />
              ) : profileData?.user_profile?.pronouns ? (
                <span className="text-[10px] text-neutral-500">
                  · {profileData.user_profile.pronouns}
                </span>
              ) : null}
            </div>

            {/* Badges icons */}
            {!profileData ? (
              <div className="flex items-center gap-1">
                <div className="h-5 w-5 animate-pulse rounded bg-white/5" />
                <div className="h-5 w-5 animate-pulse rounded bg-white/5" />
              </div>
            ) : profileData?.badges && profileData.badges.length > 0 ? (
              <div className="flex items-center gap-1">
                {profileData.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="group relative shrink-0"
                    title={badge.description}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://cdn.discordapp.com/badge-icons/${badge.icon}.png`}
                      alt={badge.description}
                      className="h-5 w-5 object-contain"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* ABOUT ME SECTION */}
          <div className="mb-4">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--discord-card-secondary)]">
              About Me
            </h3>
            <div className="rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] p-3 text-xs leading-5 text-[var(--discord-card-text)]">
              {/* Dynamic Discord Profile Endpoint Bio Component */}
              {!profileData ? (
                <div className="mb-2.5 mt-0.5 space-y-2 border-b border-[var(--discord-card-border)] pb-2">
                  <div className="h-3 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-white/5" />
                </div>
              ) : profileData?.user_profile?.bio ? (
                <div className="mb-2.5 mt-0.5 flex flex-wrap items-center gap-1.5 border-b border-[var(--discord-card-border)] pb-2 text-xs">
                  {parseBio(profileData.user_profile.bio)}
                </div>
              ) : null}
              <p className="mt-2">
                Student developer from Indonesia. I build small, considered
                things for the web — usually involving live data or music.
                <span className="bio-cursor" aria-hidden="true" />
              </p>
            </div>
          </div>

          {/* CONNECTIONS & SOCIALS SECTION (2 Columns: Left Connections, Right Socials) */}
          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--discord-card-secondary)]">
              Connections & Socials
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Column 1: Discord Connection Accounts */}
              <div className="space-y-1.5">
                {!profileData ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex h-[38px] items-center justify-between rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] px-3 py-2"
                    >
                      <div className="flex items-center gap-2 w-full animate-pulse">
                        <div className="h-4 w-4 rounded bg-white/5" />
                        <div className="h-3 w-2/3 rounded bg-white/5" />
                      </div>
                    </div>
                  ))
                ) : (
                  profileData?.connected_accounts?.map((acc) => {
                    const Icon = CONNECTION_ICONS[acc.type] || Globe;
                    const url = CONNECTION_URLS[acc.type]?.(acc.name) || "#";
                    return (
                      <a
                        key={acc.id}
                        href={url}
                        className="flex h-[38px] items-center justify-between rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] px-3 py-2 text-xs transition-colors hover:bg-[var(--discord-card-border)]/40"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0 text-[var(--discord-card-secondary)]" />
                          <span className="truncate font-mono text-[var(--discord-card-text)]">
                            {acc.name}
                          </span>
                        </div>
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500 opacity-80" />
                      </a>
                    );
                  })
                )}
              </div>

              {/* Column 2: Non-duplicate Social Redirects */}
              <div className="space-y-1.5">
                {displayedSocials.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-[38px] items-center rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] px-3 py-2 text-xs transition-colors hover:bg-[var(--discord-card-border)]/40"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-[var(--discord-card-secondary)]" />
                        <span className="truncate font-mono text-[var(--discord-card-text)]">
                          {s.name}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Sub-navigation Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
      >
      <div className="discord-glass-panel mb-4 flex gap-1 rounded-lg border border-[var(--discord-card-border)] p-1">
        {(["activity", "projects", "guestbook"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-all duration-150 ${
              activeTab === tab
                ? "bg-[var(--accent)] text-[var(--accent-text)]"
                : "text-[var(--discord-card-secondary)] hover:bg-[var(--discord-card-muted)] hover:text-[var(--discord-card-text)]"
            }`}
          >
            {tab === "activity" ? "Activity status" : tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content Area ── */}
      <div
        className="discord-glass-panel flex min-h-[250px] flex-col justify-between rounded-xl border border-[var(--discord-card-border)] p-4"
      >
        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--discord-card-border)] pb-1">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--discord-card-secondary)]">
                <Activity className="h-3.5 w-3.5 text-[var(--discord-card-secondary)]" /> Current
                Activity
              </h3>
            </div>

            {/* Custom Status & metadata row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-neutral-400">
              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusColorClass}`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${statusColorClass}`}
                  />
                </span>
                <span className="text-[10px] uppercase">
                  {STATUS_TEXT[currentStatus]}
                </span>
              </div>
              <div>
                · Age:{" "}
                <span className="text-neutral-200">
                  <LiveAge /> yrs
                </span>
              </div>
            </div>

            {/* Live Discord Activity (Zed / VSC / Games) */}
            {statusInfo?.activity ? (
              <div className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] p-4 backdrop-blur-md">
                {statusInfo.activity.image ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--discord-card-border)] bg-[#1e1f22] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={statusInfo.activity.image}
                      alt={statusInfo.activity.name}
                      className="h-full w-full object-cover"
                    />
                    {statusInfo.activity.smallImage && (
                      <div className="absolute bottom-0 right-0 h-6 w-6 overflow-hidden rounded-full border-2 border-[var(--bg-primary)] bg-[#1e1f22]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={statusInfo.activity.smallImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)]">
                    <Code className="h-6 w-6 text-[var(--discord-card-secondary)]" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-[var(--discord-card-text)]">
                    {statusInfo.activity.name}
                  </h4>
                  {statusInfo.activity.details && (
                    <p className="mt-0.5 truncate text-xs text-[var(--discord-card-secondary)]">
                      {statusInfo.activity.details}
                    </p>
                  )}
                  {statusInfo.activity.state && (
                    <p className="truncate text-xs text-[var(--discord-card-secondary)]">
                      {statusInfo.activity.state}
                    </p>
                  )}
                  {statusInfo.activity.timestamps?.start && (
                    <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-green-400">
                      <span>🎮</span>
                      <ActivityTimer
                        start={statusInfo.activity.timestamps.start}
                      />
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] p-4 py-6 text-center text-xs italic text-[var(--discord-card-secondary)]">
                No active games or coding status right now.
              </div>
            )}

            {/* Recently Active list */}
            <ActivityHistory
              onOpenDetails={(id, name) => {
                setSelectedGameId(id);
                setSelectedGameName(name);
              }}
            />

            <div className="rounded-lg border border-[var(--discord-card-border)] bg-[var(--discord-card-muted)] p-4">
              <TimeWeather />
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                GitHub Contributions
              </h3>
            </div>
            <Projects />
          </div>
        )}

        {/* Guestbook Tab */}
        {activeTab === "guestbook" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Form */}
            <div className="space-y-4">
              <div className="border-b border-white/5 pb-1">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400">
                  <MessageSquare className="h-3.5 w-3.5 text-neutral-500" />{" "}
                  Guestbook
                </h3>
              </div>

              {/* Visitor Account (Optional) dropdown */}
              <div className="rounded-lg border border-white/5 bg-black/10 p-2.5">
                <button
                  type="button"
                  onClick={() => setShowVisitorMenu(!showVisitorMenu)}
                  className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 transition-colors hover:text-neutral-200"
                >
                  <span className="flex items-center gap-1.5">
                    👤{" "}
                    {visitor
                      ? `Logged in as: ${visitor.username}`
                      : "Login/Register (optional)"}
                  </span>
                  <span>{showVisitorMenu ? "▲" : "▼"}</span>
                </button>

                {showVisitorMenu && (
                  <div className="mt-2.5 space-y-2 border-t border-white/5 pt-2.5">
                    {visitor ? (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400">
                          Hi,{" "}
                          <strong className="text-[var(--text-primary)]">
                            {visitor.username}
                          </strong>
                          ! You can now like entries and blog posts.
                        </span>
                        <button
                          type="button"
                          onClick={handleVisitorLogout}
                          disabled={authActionLoading}
                          className="rounded border border-red-900/50 bg-red-950/40 px-2 py-0.5 text-[9px] font-bold text-red-300 transition-colors hover:bg-red-950/70"
                        >
                          LOGOUT
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleVisitorAuth} className="space-y-2">
                        <div className="flex gap-3 border-b border-white/5 pb-1">
                          <button
                            type="button"
                            onClick={() => setVisitorTab("login")}
                            className={`text-[9px] font-bold uppercase ${
                              visitorTab === "login"
                                ? "border-b border-[var(--text-primary)] text-neutral-200"
                                : "text-neutral-500"
                            }`}
                          >
                            Login
                          </button>
                          <button
                            type="button"
                            onClick={() => setVisitorTab("register")}
                            className={`text-[9px] font-bold uppercase ${
                              visitorTab === "register"
                                ? "border-b border-[var(--text-primary)] text-neutral-200"
                                : "text-neutral-500"
                            }`}
                          >
                            Register
                          </button>
                        </div>

                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Username"
                            value={visitorUsername}
                            onChange={(e) => setVisitorUsername(e.target.value)}
                            className="w-full rounded border border-white/5 bg-black/20 px-2.5 py-1.5 text-xs text-[#ededed] focus:border-white/10 focus:outline-none"
                          />
                          <input
                            type="password"
                            required
                            placeholder="Password"
                            value={visitorPassword}
                            onChange={(e) => setVisitorPassword(e.target.value)}
                            className="w-full rounded border border-white/5 bg-black/20 px-2.5 py-1.5 text-xs text-[#ededed] focus:border-white/10 focus:outline-none"
                          />

                          {/* Visitor Turnstile Challenge */}
                          <div className="flex justify-center py-1">
                            <div
                              ref={visitorTurnstileContainerRef}
                              className="origin-center scale-90"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={authActionLoading}
                            className="w-full rounded bg-[var(--accent)] py-1.5 text-[10px] font-bold uppercase text-[var(--accent-text)] transition-colors hover:opacity-90"
                          >
                            {authActionLoading
                              ? "..."
                              : visitorTab === "login"
                              ? "LOGIN"
                              : "SIGNUP"}
                          </button>
                        </div>
                      </form>
                    )}
                    {visitorError && (
                      <p className="text-[10px] font-semibold text-red-400">
                        {visitorError}
                      </p>
                    )}
                    {visitorSuccess && (
                      <p className="text-[10px] font-semibold text-green-400">
                        {visitorSuccess}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handleGuestbookSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  value={guestbookName}
                  onChange={(e) => setGuestbookName(e.target.value)}
                  placeholder="your name"
                  maxLength={35}
                  disabled={!!visitor}
                  className="discord-glass-input w-full rounded-lg px-3 py-2 text-xs text-[#ededed] disabled:cursor-not-allowed disabled:opacity-50"
                />
                <textarea
                  required
                  rows={3}
                  value={guestbookMessage}
                  onChange={(e) => setGuestbookMessage(e.target.value)}
                  placeholder="say something..."
                  maxLength={280}
                  className="discord-glass-input w-full resize-none rounded-lg px-3 py-2 text-xs text-[#ededed]"
                />

                <div className="flex justify-start">
                  <div
                    id="turnstile-container"
                    ref={turnstileContainerRef}
                    className="w-full max-w-full overflow-hidden"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-semibold text-red-400">
                    {errorMsg}
                  </p>
                )}
                {successMsg && (
                  <p className="text-xs font-semibold text-green-400">
                    {successMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={guestbookLoading}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-text)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {guestbookLoading ? "SENDING..." : "SEND →"}
                </button>
              </form>
            </div>

            {/* Message Feed */}
            <div className="flex max-h-[400px] flex-col overflow-hidden">
              <div className="mb-2 flex shrink-0 items-center justify-between border-b border-white/5 pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Recent entries
                </h3>
                <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
                  {messages.length} messages
                </span>
              </div>
              <div className="scrollbar-thin flex-1 space-y-2.5 overflow-y-auto pr-1.5">
                {messagesLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-3.5 w-24 rounded bg-white/5" />
                        <div className="h-2.5 w-16 rounded bg-white/5" />
                      </div>
                      <div className="h-3.5 w-5/6 rounded bg-white/5" />
                    </div>
                  ))
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-xs italic text-neutral-500">
                    No messages yet. Be the first!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const dateString = new Date(
                      msg.timestamp
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const timeString = new Date(
                      msg.timestamp
                    ).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    });
                    const likesList = msg.likes || [];
                    const isLiked = visitor
                      ? likesList.includes(visitor.username)
                      : false;

                    return (
                      <div
                        key={msg.id}
                        className="group relative flex flex-col justify-between gap-1 rounded-lg border border-white/5 bg-black/15 p-2.5 transition-colors hover:bg-black/25"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-neutral-200">
                                {msg.name}
                              </span>
                              <span className="text-[9px] text-neutral-500">
                                {dateString} · {timeString}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-neutral-400">
                              {msg.message}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            {/* Reply button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (replyingToId === msg.id) {
                                  setReplyingToId(null);
                                  setReplyText("");
                                } else {
                                  setReplyingToId(msg.id);
                                  setReplyText("");
                                }
                              }}
                              className="px-1 text-[10px] font-bold uppercase text-neutral-500 transition-colors hover:text-neutral-300"
                              title="Reply to entry"
                            >
                              reply
                            </button>
                            {/* Like button */}
                            <button
                              type="button"
                              onClick={() => toggleLike(msg.id)}
                              className={`shrink-0 rounded-full p-0.5 transition-colors ${
                                isLiked
                                  ? "text-red-500"
                                  : "text-neutral-500 hover:text-red-400"
                              }`}
                              title={visitor ? "Like entry" : "Sign in to like"}
                            >
                              <Heart
                                className={`h-3.5 w-3.5 ${
                                  isLiked ? "fill-red-500" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Likes List */}
                        {likesList.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1 border-l border-neutral-600 pl-2 text-[9px] italic text-neutral-400">
                            ❤️ {likesList.length}{" "}
                            {likesList.length === 1 ? "like" : "likes"} (
                            {likesList.join(", ")})
                          </div>
                        )}

                        {/* Replies List */}
                        {((msg as any).replies || []).length > 0 && (
                          <div className="mt-2 space-y-2 border-l border-white/5 pl-4">
                            {((msg as any).replies || []).map((reply: any) => {
                              const rDate = new Date(
                                reply.timestamp
                              ).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              });
                              return (
                                <div
                                  key={reply.id}
                                  className="text-[11px] leading-relaxed"
                                >
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-neutral-300">
                                      {reply.username}
                                    </span>
                                    {reply.username === "abynb" && (
                                      <span className="py-0.2 scale-90 rounded border border-red-500/20 bg-red-500/10 px-1 text-[8px] font-bold uppercase tracking-wider text-red-500">
                                        Admin
                                      </span>
                                    )}
                                    <span className="text-[9px] text-neutral-500">
                                      {rDate}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 whitespace-pre-wrap text-neutral-400">
                                    {reply.message}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply Form */}
                        {replyingToId === msg.id && (
                          <form
                            onSubmit={(e) => handlePostReply(e, msg.id)}
                            className="mt-2 space-y-2 border-t border-white/5 pt-2"
                          >
                            <input
                              type="text"
                              required
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={
                                visitor
                                  ? `Reply as ${visitor.username}...`
                                  : "Sign in to reply..."
                              }
                              maxLength={200}
                              className="w-full rounded border border-white/5 bg-black/20 px-2 py-1.5 text-xs text-[#ededed] focus:border-white/10 focus:outline-none"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToId(null);
                                  setReplyText("");
                                }}
                                className="rounded bg-white/5 px-2 py-1 text-[9px] font-bold text-neutral-400 transition-colors hover:bg-white/10"
                              >
                                CANCEL
                              </button>
                              <button
                                type="submit"
                                disabled={replyLoading || !replyText.trim()}
                                className="rounded bg-[var(--accent)] px-3 py-1 text-[9px] font-bold text-[var(--accent-text)] transition-colors hover:opacity-90"
                              >
                                {replyLoading ? "..." : "REPLY"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </motion.div>

      {/* Web Badges Zone */}
      {badges.length > 0 && (
        <div className="mt-12 flex flex-wrap justify-center items-center gap-3 px-4 max-w-4xl mx-auto">
          {badges.map((badge) => {
            const imgElement = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={badge.imageUrl}
                alt={badge.title || "Web Badge"}
                title={badge.title}
                style={{
                  width: badge.size === "80x15" ? "80px" : "88px",
                  height: badge.size === "80x15" ? "15px" : "31px",
                  objectFit: "contain",
                  imageRendering: "pixelated",
                }}
                className="transition-transform hover:scale-105 duration-100 cursor-pointer"
              />
            );

            if (badge.linkUrl) {
              return (
                <a
                  key={badge.id}
                  href={badge.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  {imgElement}
                </a>
              );
            }

            return (
              <div key={badge.id} className="inline-block">
                {imgElement}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <PageFooter />
      </div>

      {/* Game Details Modal Overlay */}
      <AnimatePresence>
        {selectedGameId && (
          <GameDetailsModal
            gameId={selectedGameId}
            gameName={selectedGameName || undefined}
            onClose={() => {
              setSelectedGameId(null);
              setSelectedGameName(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Guild Details Modal Overlay */}
      <AnimatePresence>
        {selectedGuildId && (
          <GuildDetailsModal
            guildId={selectedGuildId}
            onClose={() => setSelectedGuildId(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
