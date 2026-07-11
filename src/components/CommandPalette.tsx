import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useMusicPlayer } from "./music/MusicPlayerContext";
import {
  Search,
  ChevronRight,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mic2,
  Sparkles,
  Monitor,
  FileText,
  Image as ImageIcon,
  Compass,
  Cpu,
  CornerDownLeft
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const accent = accentColor?.primary || "#38bdf8";

  // Trigger palette toggling on window shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleToggleEvent = () => setIsOpen((prev) => !prev);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-command-palette", handleToggleEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-command-palette", handleToggleEvent);
    };
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
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
    { id: "page-home", category: "Pages", label: "Home", sublabel: "Return to the main page, Alt + H", icon: Compass, action: () => router.push("/") },
    { id: "page-music", category: "Pages", label: "Music", sublabel: "Interactive audio player, Alt + M", icon: MusicIcon, action: () => router.push("/music") },
    { id: "page-uses", category: "Pages", label: "Uses", sublabel: "My software, stack, and hardware toolkits, Alt + U", icon: Cpu, action: () => router.push("/uses") },
    { id: "page-blog", category: "Pages", label: "Blog", sublabel: "Thoughts, notes, and tutorials, Alt + B", icon: FileText, action: () => router.push("/blog") },
    { id: "page-photos", category: "Pages", label: "Photos", sublabel: "Personal visual masonry grid gallery, Alt + P", icon: ImageIcon, action: () => router.push("/photos") },
  ];

  const themeCommands: CommandItem[] = [
    { id: "theme-grid", category: "Themes", label: "Cyber Grid", sublabel: "Retro tech matrix style grid", icon: Sparkles, action: () => handleBackdropSelect("cyber-grid") },
    { id: "theme-dots", category: "Themes", label: "Art Dots", sublabel: "Drifting Perlin canvas points", icon: Sparkles, action: () => handleBackdropSelect("flowing-dots") },
    { id: "theme-dust", category: "Themes", label: "Space Dust", sublabel: "Floating stardust field canvas", icon: Sparkles, action: () => handleBackdropSelect("space-dust") },
    { id: "theme-aura", category: "Themes", label: "Deep Aura", sublabel: "Drifting smooth blurred gradient blobs", icon: Sparkles, action: () => handleBackdropSelect("deep-aura") },
    { id: "theme-dark", category: "Themes", label: "Solid Dark", sublabel: "Pure solid dark backdrop", icon: Sparkles, action: () => handleBackdropSelect("pure-dark") },
  ];

  const musicCommands: CommandItem[] = currentTrack ? [
    {
      id: "music-toggle",
      category: "Music",
      label: isPlaying ? "Pause Track" : "Play Track",
      sublabel: `Currently: ${currentTrack.title} — ${currentTrack.artist}`,
      icon: isPlaying ? Pause : Play,
      action: () => (isPlaying ? pause() : resume())
    },
    { id: "music-next", category: "Music", label: "Next Track", sublabel: "Skip forward in queue", icon: SkipForward, action: () => next() },
    { id: "music-prev", category: "Music", label: "Previous Track", sublabel: "Return to previous track", icon: SkipBack, action: () => prev() },
    { id: "music-lyrics", category: "Music", label: "Toggle Lyrics Panel", sublabel: "Show/hide synchronized lyrics drawer", icon: Mic2, action: () => toggleLyrics() },
  ] : [];

  // Map searched blog posts into commands
  const matchedBlogPosts: CommandItem[] = blogPosts
    .filter((post) => {
      const q = query.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        (post.tags && post.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    })
    .map((post) => ({
      id: `blog-${post.slug}`,
      category: "Blog Posts" as const,
      label: post.title,
      sublabel: post.description,
      icon: FileText,
      action: () => router.push(`/blog/${post.slug}`),
    }));

  // Combine commands matching query
  const allCommands = [...pagesCommands, ...themeCommands, ...musicCommands, ...matchedBlogPosts];

  const filteredCommands = allCommands.filter((cmd) => {
    if (cmd.category === "Blog Posts") return true; // Already pre-filtered
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      (cmd.sublabel && cmd.sublabel.toLowerCase().includes(q))
    );
  });

  // Handle key navigations
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
      scrollToActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      scrollToActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[activeIndex]) {
        filteredCommands[activeIndex].action();
        setIsOpen(false);
      }
    }
  };

  const scrollToActive = () => {
    if (!scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.children[activeIndex] as HTMLElement;
    if (!activeEl) return;

    const containerHeight = scrollContainerRef.current.clientHeight;
    const elemTop = activeEl.offsetTop;
    const elemHeight = activeEl.clientHeight;

    if (elemTop + elemHeight > scrollContainerRef.current.scrollTop + containerHeight) {
      scrollContainerRef.current.scrollTop = elemTop + elemHeight - containerHeight;
    } else if (elemTop < scrollContainerRef.current.scrollTop) {
      scrollContainerRef.current.scrollTop = elemTop;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) setIsOpen(false);
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh] px-4 backdrop-blur-md transition-all animate-fade-in print:hidden"
    >
      <div
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
            placeholder="Type a command or search blog posts..."
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

        {/* Scrollable list items */}
        <div
          ref={scrollContainerRef}
          className="max-h-[350px] overflow-y-auto p-2 divide-y divide-white/[0.02] scrollbar-thin scrollbar-thumb-white/10"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === activeIndex;

              return (
                <button
                  key={cmd.id}
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
                    {/* Category pill */}
                    <span
                      className={`text-[8px] font-bold font-mono tracking-widest uppercase rounded-full border px-2 py-0.5 opacity-60 ${
                        isSelected ? "border-white/15" : "border-white/5"
                      }`}
                    >
                      {cmd.category}
                    </span>

                    {/* Keyboard enter indicator */}
                    {isSelected && (
                      <CornerDownLeft className="h-3 w-3 opacity-60 animate-pulse text-neutral-300" />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-xs text-neutral-500">
              No matching commands or blog posts found.
            </div>
          )}
        </div>

        {/* Footer info helper */}
        <div className="border-t border-white/5 bg-neutral-950/40 px-4 py-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-neutral-500">
          <div className="flex items-center gap-2.5">
            <span>↑↓ to navigate</span>
            <span className="opacity-30">·</span>
            <span>enter to select</span>
          </div>
          <div>
            <span>ctrl + k</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple placeholder icon in case Lucide's Music is imported slightly differently
function MusicIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
