import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { X, Navigation, PlayCircle, Settings } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const CATEGORIES = [
  {
    title: "Navigation",
    icon: Navigation,
    items: [
      { key: "Alt + H", description: "Go to home page" },
      { key: "Alt + M", description: "Go to music page" },
      { key: "Alt + U", description: "Go to uses page" },
      { key: "Alt + B", description: "Go to blog page" },
      { key: "Alt + P", description: "Go to photos page" },
      { key: "Alt + G", description: "Open GitHub profile" },
    ],
  },
  {
    title: "Music Player",
    icon: PlayCircle,
    items: [
      { key: "Space", description: "Toggle playback" },
      { key: "Shift + ← / →", description: "Seek ±10 seconds" },
      { key: "M", description: "Mute / unmute audio" },
      { key: "L", description: "Toggle immersive lyrics" },
    ],
  },
  {
    title: "General",
    icon: Settings,
    items: [
      { key: "/ or ?", description: "Toggle shortcuts overlay" },
      { key: "Esc", description: "Dismiss this overlay" },
    ],
  },
];

export default function KeyboardShortcuts() {
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey) return;

      const isDesktop = window.matchMedia("(min-width: 640px)").matches;
      const key = e.key.toLowerCase();

      // Navigation and actions require Alt modifier
      if (e.altKey) {
        switch (key) {
          case "h":
            e.preventDefault();
            router.push("/");
            break;

          case "g":
            e.preventDefault();
            window.open(
              "https://github.com/abyn365",
              "_blank",
              "noopener,noreferrer"
            );
            break;

          case "b":
            e.preventDefault();
            router.push("/blog");
            break;

          case "m":
            e.preventDefault();
            router.push("/music");
            break;

          case "p":
            e.preventDefault();
            router.push("/photos");
            break;


          case "u":
            e.preventDefault();
            router.push("/uses");
            break;
        }
        return;
      }

      // Panel triggers do not require Alt
      switch (e.key) {
        case "?":
        case "/":
          e.preventDefault();
          setOpen((o) => !o);
          break;

        case "Escape":
          setOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router, toggleTheme]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          {/* Centered Shortcuts Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-50 flex max-h-[85vh] w-full max-w-lg select-none flex-col rounded-2xl border p-6 shadow-2xl"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b pb-4"
              style={{ borderColor: "var(--card-border)" }}
            >
              <div>
                <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                  Keyboard Shortcuts
                </h3>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  Press /? anywhere to close
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border p-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                style={{ borderColor: "var(--card-border)" }}
                aria-label="Close keyboard shortcuts dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Categories Content */}
            <div
              className="scrollbar-none flex-1 space-y-6 overflow-y-auto py-4"
              style={{ scrollbarWidth: "none" }}
            >
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.title} className="space-y-2.5">
                    <h4 className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] opacity-80">
                      <Icon className="h-3.5 w-3.5" />
                      {category.title}
                    </h4>
                    <div
                      className="divide-y divide-[var(--card-border)] overflow-hidden rounded-xl border"
                      style={{ borderColor: "var(--card-border)" }}
                    >
                      {category.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[var(--bg-secondary)]"
                        >
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {item.description}
                          </span>
                          <kbd
                            className="shrink-0 rounded-md border bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--text-primary)] shadow-sm"
                            style={{
                              borderColor: "var(--card-border)",
                              background: "var(--bg-secondary)",
                            }}
                          >
                            {item.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
