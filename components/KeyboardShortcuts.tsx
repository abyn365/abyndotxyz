import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const SHORTCUTS = [
  { key: "h", label: "Home", description: "Go to /" },
  { key: "p", label: "Projects", description: "Go to /projects" },
  { key: "m", label: "Music", description: "Go to /music" },
  { key: "u", label: "Uses", description: "Go to /uses" },
  { key: "g", label: "GitHub", description: "Open GitHub profile" },
  { key: "?", label: "?", description: "Open / close this panel" },
  { key: "Esc", label: "Esc", description: "Close panel" },
];

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignore when typing in form elements
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target.isContentEditable) return;
      // Ignore modified combos
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "h":
        case "H":
          router.push("/");
          break;
        case "g":
        case "G":
          window.open("/github", "_blank", "noopener,noreferrer");
          break;
        case "p":
        case "P":
          router.push("/projects");
          break;
        case "m":
        case "M":
          router.push("/music");
          break;
        case "u":
        case "U":
          router.push("/uses");
          break;
        case "?":
          setOpen((o) => !o);
          break;
        case "Escape":
          setOpen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [router]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60]"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-[70] w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-5 shadow-2xl"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                Keyboard shortcuts
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Shortcut rows */}
            <div className="space-y-1">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between gap-4 rounded-lg px-2 py-2"
                >
                  <span className="text-sm text-[var(--text-secondary)]">
                    {s.description}
                  </span>
                  <kbd
                    className="shrink-0 rounded border px-2 py-1 font-mono text-[10px] text-[var(--text-primary)]"
                    style={{
                      borderColor: "var(--card-border)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            {/* Hint */}
            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)]">
              press ? to toggle
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
