import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const SHORTCUTS = [
  { key: "h", label: "Home", description: "Go to /" },
  { key: "p", label: "Projects", description: "Go to /projects" },
  { key: "m", label: "Music", description: "Go to /music" },
  { key: "u", label: "Uses", description: "Go to /uses" },
  { key: "g", label: "GitHub", description: "Open GitHub profile" },
  { key: "/?", label: "/?", description: "Open / close this panel" },
  { key: "Esc", label: "Esc", description: "Close panel" },
];

const OFFSET = 18;
const VIEWPORT_MARGIN = 16;

export default function KeyboardShortcuts() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const panelRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef({
    x: 0,
    y: 0,
  });

  const [panelSize, setPanelSize] = useState({
    width: 340,
    height: 360,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    const updateSize = () => {
      const rect = panelRef.current?.getBoundingClientRect();

      if (!rect) return;

      setPanelSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);

    observer.observe(panelRef.current);

    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      if (target?.isContentEditable) return;
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
        case "/":
          if (!open) {
            setMenuPos(mouseRef.current);
          }

          setOpen((o) => !o);
          break;

        case "Escape":
          setOpen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [router, open]);

  const position = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        left: 0,
        top: 0,
        origin: "top left",
        flippedX: false,
        flippedY: false,
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = menuPos.x + OFFSET;
    let top = menuPos.y + OFFSET;

    let flippedX = false;
    let flippedY = false;

    const wouldOverflowRight =
      left + panelSize.width + VIEWPORT_MARGIN > viewportWidth;

    const wouldOverflowBottom =
      top + panelSize.height + VIEWPORT_MARGIN > viewportHeight;

    if (wouldOverflowRight) {
      left = menuPos.x - panelSize.width - OFFSET;
      flippedX = true;
    }

    if (wouldOverflowBottom) {
      top = menuPos.y - panelSize.height - OFFSET;
      flippedY = true;
    }

    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(left, viewportWidth - panelSize.width - VIEWPORT_MARGIN)
    );

    top = Math.max(
      VIEWPORT_MARGIN,
      Math.min(top, viewportHeight - panelSize.height - VIEWPORT_MARGIN)
    );

    const origin = `${flippedY ? "bottom" : "top"} ${
      flippedX ? "right" : "left"
    }`;

    return {
      left,
      top,
      origin,
      flippedX,
      flippedY,
    };
  }, [menuPos, panelSize]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60]"
            style={{
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setOpen(false)}
          />

          <motion.div
            ref={panelRef}
            key="panel"
            initial={{
              opacity: 0,
              scale: 0.88,
              x: position.flippedX ? 10 : -10,
              y: position.flippedY ? 10 : -10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.88,
              x: position.flippedX ? 10 : -10,
              y: position.flippedY ? 10 : -10,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 28,
            }}
            className="fixed z-[70] w-full max-w-xs overflow-hidden rounded-2xl border p-5 shadow-2xl"
            style={{
              left: position.left,
              top: position.top,
              transformOrigin: position.origin,
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05), transparent 60%)",
              }}
            />

            <div className="relative">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
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

              {/* Rows */}
              <div className="space-y-1">
                {SHORTCUTS.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between gap-4 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <span className="text-sm text-[var(--text-secondary)]">
                      {s.description}
                    </span>

                    <kbd
                      className="shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] text-[var(--text-primary)]"
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

              {/* Footer */}
              <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                press /? to toggle
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
