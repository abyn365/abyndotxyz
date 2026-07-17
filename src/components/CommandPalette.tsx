import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useMusicPlayer } from "./music/MusicPlayerContext";
import {
  Search,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mic2,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Compass,
  Cpu,
  CornerDownLeft,
  Cloud,
  Music
} from "lucide-react";

interface CommandItem {
  id: string;
  category: "Pages" | "Themes" | "Music" | "Blog Posts";
  label: string;
  sublabel?: string;
  icon: any;
  action: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    pause,
    resume,
    next,
    prev,
    toggleLyrics,
    accentColor
  } = useMusicPlayer();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | "Pages" | "Themes" | "Music" | "Blog Posts">("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const accent = accentColor?.primary || "#6366f1";

  // 1. Trigger palette toggling & bind Alt navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle keybind: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      // Alt shortcuts for pages
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "h") {
          e.preventDefault();
          router.push("/");
          setIsOpen(false);
        } else if (key === "m") {
          e.preventDefault();
          router.push("/music");
          setIsOpen(false);
        } else if (key === "u") {
          e.preventDefault();
          router.push("/uses");
          setIsOpen(false);
        } else if (key === "b") {
          e.preventDefault();
          router.push("/blog");
          setIsOpen(false);
        } else if (key === "p") {
          e.preventDefault();
          router.push("/photos");
          setIsOpen(false);
        }
      }
    };

    const handleToggleEvent = () => setIsOpen((prev) => !prev);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-command-palette", handleToggleEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-command-palette", handleToggleEvent);
    };
  }, [router]);

  // 2. Prevent body scrolling when the palette is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  // 3. Focus and data loading on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setActiveCategory("All");
      setActiveIndex(0);

      // Pre-fetch blog posts for search integration
      fetch("/api/blog")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBlogPosts(data.posts || []);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleBackdropSelect = (id: string) => {
    localStorage.setItem("site-backdrop", id);
    document.documentElement.className = document.documentElement.className
      .split(" ")
      .filter((c) => !c.startsWith("bg-mode-"))
      .join(" ");
    document.documentElement.classList.add(`bg-mode-${id}`);
    window.dispatchEvent(new CustomEvent("site-backdrop-change", { detail: id }));
  };

  // Define commands
  const pagesCommands: CommandItem[] = [
    { id: "page-home", category: "Pages", label: "Home", sublabel: "Return to the main page · Alt + H", icon: Compass, action: () => router.push("/") },
    { id: "page-music", category: "Pages", label: "Music", sublabel: "Interactive Last.fm replay dashboard · Alt + M", icon: Music, action: () => router.push("/music") },
    { id: "page-uses", category: "Pages", label: "Uses", sublabel: "My stack, setups, and hardware gear · Alt + U", icon: Cpu, action: () => router.push("/uses") },
    { id: "page-blog", category: "Pages", label: "Blog", sublabel: "Thoughts, engineering articles, and writeups · Alt + B", icon: FileText, action: () => router.push("/blog") },
    { id: "page-photos", category: "Pages", label: "Photos", sublabel: "Visual photography gallery log · Alt + P", icon: ImageIcon, action: () => router.push("/photos") },
  ];

  const themeCommands: CommandItem[] = [
    { id: "theme-grid", category: "Themes", label: "Cyber Grid", sublabel: "Retro tech matrix style grid backdrop", icon: Sparkles, action: () => handleBackdropSelect("cyber-grid") },
    { id: "theme-dots", category: "Themes", label: "Art Dots", sublabel: "Drifting Perlin noise canvas points", icon: Sparkles, action: () => handleBackdropSelect("flowing-dots") },
    { id: "theme-dust", category: "Themes", label: "Space Dust", sublabel: "Floating stardust field overlay", icon: Sparkles, action: () => handleBackdropSelect("space-dust") },
    { id: "theme-waves", category: "Themes", label: "Nexus Waves", sublabel: "Color-synced interactive node waves", icon: Sparkles, action: () => handleBackdropSelect("nexus-waves") },
    { id: "theme-nebula", category: "Themes", label: "Cosmic Nebula", sublabel: "Moving space nebula cloud simulation", icon: Sparkles, action: () => handleBackdropSelect("cosmic-nebula") },
    { id: "theme-dark", category: "Themes", label: "Solid Dark", sublabel: "Pure minimal dark static canvas backdrop", icon: Sparkles, action: () => handleBackdropSelect("pure-dark") },
    {
      id: "weather-toggle",
      category: "Themes",
      label: "Toggle Weather Overlay",
      sublabel: "Turn ambient weather particles on/off",
      icon: Cloud,
      action: () => {
        const current = localStorage.getItem("site-weather-overlay") !== "false";
        const nextVal = !current;
        localStorage.setItem("site-weather-overlay", nextVal ? "true" : "false");
        window.dispatchEvent(new CustomEvent("site-weather-overlay-change", { detail: nextVal }));
      }
    }
  ];

  const musicCommands: CommandItem[] = [
    { id: "music-go", category: "Music", label: "Open Replay Dashboard", sublabel: "View detailed Last.fm listening analytics · Alt + M", icon: Music, action: () => router.push("/music") },
    ...(currentTrack ? [
      {
        id: "music-toggle",
        category: "Music",
        label: isPlaying ? "Pause Track" : "Play Track",
        sublabel: `Currently playing: ${currentTrack.title} — ${currentTrack.artist}`,
        icon: isPlaying ? Pause : Play,
        action: () => (isPlaying ? pause() : resume())
      },
      { id: "music-next", category: "Music", label: "Next Track", sublabel: "Skip forward in playlist queue", icon: SkipForward, action: () => next() },
      { id: "music-prev", category: "Music", label: "Previous Track", sublabel: "Return to last played track", icon: SkipBack, action: () => prev() },
      { id: "music-lyrics", category: "Music", label: "Toggle Lyrics Panel", sublabel: "Show/hide synchronized lyrics drawer", icon: Mic2, action: () => toggleLyrics() },
    ] : [])
  ];

  // Map searched blog posts into commands
  const baseBlogCommands: CommandItem[] = blogPosts.map((post) => ({
    id: `blog-${post.slug}`,
    category: "Blog Posts" as const,
    label: post.title,
    sublabel: post.description || "Read blog post",
    icon: FileText,
    action: () => router.push(`/blog/${post.slug}`),
  }));

  // Combine commands matching query and filter category
  const allCommands = [...pagesCommands, ...themeCommands, ...musicCommands, ...baseBlogCommands];

  const filteredCommands = allCommands.filter((cmd) => {
    // 1. Category Filter
    if (activeCategory !== "All" && cmd.category !== activeCategory) {
      return false;
    }

    // 2. Hide blog posts from "All" view if search query is empty (keeps UI clean)
    if (activeCategory === "All" && cmd.category === "Blog Posts" && !query.trim()) {
      return false;
    }

    // 3. Search Query Filter
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const matchesLabel = cmd.label.toLowerCase().includes(q);
    const matchesSublabel = cmd.sublabel ? cmd.sublabel.toLowerCase().includes(q) : false;
    const matchesCategory = cmd.category.toLowerCase().includes(q);

    return matchesLabel || matchesSublabel || matchesCategory;
  });

  // Handle key navigations
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const nextIdx = filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0;
        scrollToActive(nextIdx);
        return nextIdx;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const nextIdx = filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0;
        scrollToActive(nextIdx);
        return nextIdx;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[activeIndex]) {
        filteredCommands[activeIndex].action();
        setIsOpen(false);
      }
    }
  };

  const scrollToActive = (index: number) => {
    const activeEl = itemRefs.current[index];
    if (!activeEl || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const elemTop = activeEl.offsetTop;
    const elemHeight = activeEl.clientHeight;
    const containerHeight = container.clientHeight;

    if (elemTop + elemHeight > container.scrollTop + containerHeight) {
      container.scrollTop = elemTop + elemHeight - containerHeight;
    } else if (elemTop < container.scrollTop) {
      container.scrollTop = elemTop;
    }
  };

  // Group commands under category headers for cleaner listing
  let lastCategory = "";
  itemRefs.current = [];

  const categoryTags: Array<"All" | "Pages" | "Themes" | "Music" | "Blog Posts"> = [
    "All",
    "Pages",
    "Themes",
    "Music",
    "Blog Posts"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[12vh] px-4 backdrop-blur-md transition-all print:hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={handleKeyDown}
            className="w-full max-w-xl overflow-hidden rounded-2xl border bg-neutral-950/90 shadow-2xl flex flex-col backdrop-blur-xl"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 20%, rgba(255, 255, 255, 0.08))`,
              boxShadow: `0 30px 60px rgba(0, 0, 0, 0.6), 0 0 1px color-mix(in srgb, ${accent} 15%, transparent)`
            }}
          >
            {/* Search header input */}
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, themes, or blog posts..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                className="w-full bg-transparent text-sm text-neutral-200 outline-none placeholder-neutral-500 font-sans"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                ESC
              </kbd>
            </div>

            {/* Quick Filter Categories Ribbon */}
            <div className="flex gap-1.5 px-4 py-2 border-b border-white/5 bg-neutral-900/10 overflow-x-auto scrollbar-none select-none">
              {categoryTags.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveIndex(0);
                      inputRef.current?.focus();
                    }}
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
                      active
                        ? "bg-white/10 text-white border border-white/15"
                        : "border border-transparent text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Scrollable list items */}
            <div
              ref={scrollContainerRef}
              className="max-h-[340px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10"
              onWheel={(e) => e.stopPropagation()} // stops wheel propagation to main page
            >
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, index) => {
                  const Icon = cmd.icon;
                  const isSelected = index === activeIndex;
                  const showCategoryHeader = activeCategory === "All" && cmd.category !== lastCategory;
                  lastCategory = cmd.category;

                  return (
                    <div key={cmd.id} className="flex flex-col">
                      {showCategoryHeader && (
                        <div className="px-3.5 py-2 text-[9px] font-bold uppercase tracking-wider text-neutral-500 font-mono mt-1 first:mt-0 select-none">
                          {cmd.category}
                        </div>
                      )}
                      <button
                        ref={(el) => {
                          itemRefs.current[index] = el;
                        }}
                        onClick={() => {
                          cmd.action();
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`w-full flex items-center justify-between gap-3 text-left px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                          isSelected
                            ? "bg-white/5 text-white"
                            : "text-neutral-400 hover:text-neutral-200"
                        }`}
                        style={
                          isSelected
                            ? {
                                borderLeft: `3px solid ${accent}`,
                                paddingLeft: "11px",
                                borderTopLeftRadius: "4px",
                                borderBottomLeftRadius: "4px"
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-white/10 text-white"
                                : "bg-white/5 text-neutral-400"
                            }`}
                            style={isSelected ? { color: accent } : undefined}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold leading-normal truncate">
                              {cmd.label}
                            </p>
                            {cmd.sublabel && (
                              <p className="text-[10px] text-neutral-500 leading-normal truncate mt-0.5 font-medium">
                                {cmd.sublabel}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected && (
                            <CornerDownLeft className="h-3 w-3 opacity-60 animate-pulse text-neutral-300" />
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-xs text-neutral-500 select-none">
                  No matching commands or blog posts found.
                </div>
              )}
            </div>

            {/* Footer info helper */}
            <div className="border-t border-white/5 bg-neutral-950/40 px-4 py-2.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-neutral-500 select-none">
              <div className="flex items-center gap-2.5">
                <span>↑↓ to navigate</span>
                <span className="opacity-30">·</span>
                <span>enter to select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1 py-0.5 rounded border border-white/5 bg-white/5">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1 py-0.5 rounded border border-white/5 bg-white/5">K</kbd>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
