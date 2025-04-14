import { useEffect, useState } from 'react';
import Image from "next/image";
import Banners from "../components/Banner";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";
import Squares from "../components/Squares";
import AOS from 'aos';
import 'aos/dist/aos.css';
import VisitorStats from "../components/Misc/VisitorStats.misc";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiMusic } from "react-icons/fi";

type CustomStatus = {
  emoji?: {
    id: string;
    name: string;
    animated: boolean;
  };
  state?: string; // Add state for custom status text
};

const belowLink = "Когда огонь погаснет, останется ли тепло?";
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

const getActiveDevice = (data: any) => {
  // Priority order: desktop > web > mobile
  if (data.active_on_discord_desktop) return 'Desktop';
  if (data.active_on_discord_web) return 'Web';
  if (data.active_on_discord_mobile) return 'Mobile';
  return null;
};

export default function Home() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customStatus, setCustomStatus] = useState<CustomStatus | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [discordStatus, setDiscordStatus] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 600, // Reduced animation duration
      once: true,
      easing: 'ease-out',
      disable: 'mobile' // Disable AOS on mobile for better performance
    });

    const fetchDiscordUser = async () => {
      try {
        const response = await fetch('https://api.lanyard.rest/v1/users/877018055815868426');
        const data = await response.json();
        if (data.success) {
          const { id, avatar, username } = data.data.discord_user;
          setAvatarUrl(getDiscordAvatar(id, avatar));
          setUsername(username);
          
          // Set Discord status
          setDiscordStatus(data.data.discord_status);
          // Check active state with priority
          setIsOnline(Boolean(getActiveDevice(data.data)));

          // Get custom status
          const customStatusActivity = data.data.activities.find(
            (activity: any) => activity.type === 4
          );
          if (customStatusActivity) {
            setCustomStatus({
              emoji: customStatusActivity.emoji,
              state: customStatusActivity.state
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch Discord user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscordUser();
    // Add interval to refresh status
    const interval = setInterval(fetchDiscordUser, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-900">
      {/* Background squares effect */}
      <div className="fixed inset-0 z-0 sm:block">
        <Squares 
          speed={0.2}
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255,255,255,0.1)'
          hoverFillColor='rgba(255, 99, 71, 0.1)'
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col">
        <div className="mx-auto py-8 sm:py-12 flex w-full max-w-2xl flex-col items-center px-4 sm:px-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full backdrop-blur-sm bg-zinc-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl"
          >
            <div className="flex flex-col items-center justify-center gap-8">
              {/* Profile Section */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="elegant-card glow-effect p-6 w-full"
              >
                <div className="relative flex flex-col items-center">
                  {/* Add VisitorStats here */}
                  <VisitorStats />
                  
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                    <Image
                      className="rounded-full border-2 border-zinc-800/50 object-cover transition-transform hover:scale-105"
                      src={avatarUrl || '/profile.png'}
                      alt="profile"
                      fill
                      sizes="(max-width: 640px) 128px, 160px"
                      priority
                    />
                    {/* Status Group - Bottom Right */}
                    <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
                      {/* Custom Status Text - Show first if exists */}
                      {customStatus?.state && (
                        <div className="order-1 flex-shrink rounded-full bg-zinc-900/90 px-2 py-1 border border-zinc-800/50">
                          <div className="max-w-[120px] sm:max-w-[150px]">
                            <span className="text-xs text-zinc-300 block truncate">
                              {customStatus.state}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Custom Status Emoji - Show second with fixed width */}
                      {customStatus?.emoji && (
                        <div className="order-2 flex-shrink-0 bg-zinc-900 rounded-full p-1 border border-zinc-800/50">
                          <Image
                            src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${
                              customStatus.emoji.animated ? 'gif' : 'png'
                            }`}
                            alt={customStatus.emoji.name}
                            width={16}
                            height={16}
                            className="w-4 h-4"
                          />
                        </div>
                      )}
                      {/* Discord Status Indicator - Show last with fixed width */}
                      <div className="order-3 flex-shrink-0 bg-zinc-900 rounded-full p-0.5 border border-zinc-800/50">
                        <Image
                          src={getStatusImage(discordStatus)}
                          alt={discordStatus}
                          width={16}
                          height={16}
                          className="rounded-full"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <h1 className="text-2xl font-bold text-zinc-100">{username || 'Loading...'}</h1>
                    <p className="mt-3 text-sm text-zinc-400 italic">{belowLink}</p>
                    <p className="mt-4 text-sm text-zinc-500">{bio}</p>
                  </div>
                </div>
              </motion.div>

              {/* Banners */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-full"
              >
                <Banners />
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="grid grid-cols-5 items-center gap-4 w-full"
              >
                <div className="elegant-card glow-effect p-2 w-full flex justify-center">
                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/instagram"
                    className="flex cursor-pointer items-center justify-center rounded-full border-white border-opacity-10 bg-opacity-10 p-1.5 transition-all"
                  >
                    <svg
                      className="social-icon fill-current text-pink-400"
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>Instagram</title>
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"></path>
                    </svg>
                  </a>
                </div>
                <div className="elegant-card glow-effect p-2 w-full flex justify-center">
                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/github"
                    className="flex cursor-pointer items-center justify-center rounded-full border-white border-opacity-10 bg-opacity-10 p-1.5 transition-all"
                  >
                    <svg
                      className="social-icon fill-current text-primary transition-all dark:text-gray-100"
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>GitHub</title>
                      <path
                        d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.5-1.3-1.3-1.6-1.3-1.6-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.5-.3-5-1.3-5-5.8 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.5.1-3.1 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.7 1.6.2 2.8.1 3.1.8.8 1.3 1.9 1.3 3.2 0 4.6-2.5 5.5-4.9 5.8.4.4.7 1.1.7 2.2v3.3c0 .4.2.7.8.6 4.7-1.6 8.1-6.1 8.1-11.4C24 5.4 18.6 0 12 0z"
                      />
                    </svg>
                  </a>
                </div>
                <div className="elegant-card glow-effect p-2 w-full flex justify-center">
                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/spotify"
                    className="flex cursor-pointer items-center justify-center rounded-full border-white border-opacity-10 bg-opacity-10 p-1.5 transition-all"
                  >
                    <svg
                      className="social-icon fill-current text-green-400"
                      role="img"
                      viewBox="0 0 64 64"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>Spotify</title>
                      <path d="M32 0C14.3 0 0 14.337 0 32c0 17.7 14.337 32 32 32 17.7 0 32-14.337 32-32S49.663 0 32 0zm14.68 46.184c-.573.956-1.797 1.223-2.753.65-7.532-4.588-16.975-5.62-28.14-3.097-1.07.23-2.14-.42-2.37-1.49s.42-2.14 1.49-2.37c12.196-2.79 22.67-1.606 31.082 3.556a2 2 0 0 1 .688 2.753zm3.9-8.717c-.726 1.185-2.256 1.53-3.44.84-8.602-5.276-21.716-6.805-31.885-3.747-1.338.382-2.714-.344-3.097-1.644-.382-1.338.344-2.714 1.682-3.097 11.622-3.517 26.074-1.835 35.976 4.244 1.147.688 1.49 2.217.765 3.403zm.344-9.1c-10.323-6.117-27.336-6.69-37.2-3.708-1.568.497-3.25-.42-3.747-1.988s.42-3.25 1.988-3.747c11.317-3.44 30.127-2.753 41.98 4.282 1.415.84 1.873 2.676 1.032 4.09-.765 1.453-2.638 1.912-4.053 1.07z"></path>
                    </svg>
                  </a>
                </div>
                <div className="elegant-card glow-effect p-2 w-full flex justify-center">
                  <a
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    href="/pinterest"
                    className="flex cursor-pointer items-center justify-center rounded-full border-white border-opacity-10 bg-opacity-10 p-1.5 transition-all group"
                  >
                    <svg
                      className="social-icon h-6"
                      viewBox="0 0 32 32"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M16.132 0a16 16 0 0 0-5.771 30.952c-.13-1.312-.262-3.148 0-4.6l1.836-8a5.771 5.771 0 0 1-.525-2.361c0-2.23 1.312-3.935 2.885-3.935s1.967 1.05 1.967 2.23-.918 3.4-1.312 5.377.787 2.885 2.36 2.885 4.984-3.016 4.984-7.344-2.754-6.558-6.69-6.558-7.082 3.54-7.082 7.082c0 1.312.525 2.885 1.18 3.672a.525.525 0 0 1 .131.393l-.393 1.836c-.13.262-.262.393-.525.262-1.967-.918-3.28-3.803-3.28-6.164 0-4.984 3.672-9.705 10.623-9.705s9.836 3.935 9.836 9.18-3.54 9.968-8.263 9.968c-1.574 0-3.148-.787-3.672-1.836l-1.05 3.803c-.393 1.443-1.312 3.148-1.967 4.197A16 16 0 1 0 16.132 0z"
                        className="fill-[#E60023] group-hover:fill-[#ff6347] transition-colors pointer-events-none"
                      />
                      <title>Pinterest</title>
                    </svg>
                  </a>
                </div>
                <div className="elegant-card glow-effect p-2 w-full">
                  <div className="flex items-center justify-center">
                    <a
                      rel="noopener noreferrer nofollow"
                      target="_blank"
                      href="/discord"
                      className="flex cursor-pointer items-center justify-center space-x-2 rounded-full border-white border-opacity-10 px-2 py-2 hover:bg-white hover:bg-opacity-5"
                    >
                      <svg
                        className="social-icon h-5 fill-current text-indigo-500"
                        role="img"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>Discord</title>
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path>
                      </svg>
                      <span className="hidden sm:inline text-sm font-medium text-indigo-100 truncate">
                        {username || 'Loading...'}
                      </span>
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Discord Status */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="w-full max-w-md"
              >
                <DiscordStatus />
              </motion.div>

              {/* Music Button */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="w-full"
              >
                <Link href="/music">
                  <motion.button
                    className="elegant-card glow-effect w-full px-4 py-3 flex items-center justify-between"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="flex items-center gap-2">
                      <FiMusic className="h-4 w-4 text-[#ff6347]" />
                      <span className="text-white hover:text-[#ff6347] transition-colors">
                        Music I Listen To
                      </span>
                    </span>
                    <svg 
                      className="w-4 h-4 text-zinc-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.footer 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-8 text-center text-zinc-500"
          >
            <div className="container mx-auto">
              <p className="text-sm">
                Copyright © 2025 <a href="https://abyn.xyz"
                className="hover:text-[#ff6347] transition-colors"> abyn.xyz </a>
              </p>
              <p className="mt-2 text-xs faded-in">
                Made by abyn with ♥︎
              </p>
            </div>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}