import { useEffect, useState } from "react";
import { Settings, Sparkles, Grid, EyeOff, MoreHorizontal } from "lucide-react";

const BACKDROP_MODES = [
  { id: "cyber-grid", label: "Cyber Grid", icon: Grid },
  { id: "flowing-dots", label: "Art Dots", icon: MoreHorizontal },
  { id: "space-dust", label: "Space Dust", icon: Sparkles },
  { id: "deep-aura", label: "Deep Aura", icon: Settings },
  { id: "pure-dark", label: "Solid Dark", icon: EyeOff },
];

export default function BackgroundSelector() {
  const [activeMode, setActiveMode] = useState("cyber-grid");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("site-backdrop") || "cyber-grid";
    setActiveMode(saved);
    
    // Dispatch initial load class
    document.documentElement.className = document.documentElement.className
      .split(" ")
      .filter(c => !c.startsWith("bg-mode-"))
      .join(" ");
    document.documentElement.classList.add(`bg-mode-${saved}`);
  }, []);

  useEffect(() => {
    const handleExternalChange = (e: Event) => {
      const mode = (e as CustomEvent).detail;
      if (mode) setActiveMode(mode);
    };
    window.addEventListener("site-backdrop-change", handleExternalChange);
    return () => window.removeEventListener("site-backdrop-change", handleExternalChange);
  }, []);

  const handleSelectMode = (id: string) => {
    setActiveMode(id);
    localStorage.setItem("site-backdrop", id);
    
    // Update document classes
    document.documentElement.className = document.documentElement.className
      .split(" ")
      .filter(c => !c.startsWith("bg-mode-"))
      .join(" ");
    document.documentElement.classList.add(`bg-mode-${id}`);

    // Dispatch event for instant canvas updates
    window.dispatchEvent(new CustomEvent("site-backdrop-change", { detail: id }));
    setIsOpen(false);
  };

  return (
    <div className="fixed top-1/2 right-0 -translate-y-1/2 z-40 select-none print:hidden">
      <div className="relative flex items-center">
        {/* Selector Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-7 top-1/2 -translate-y-1/2 w-40 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1.5 shadow-lg flex flex-col gap-1 backdrop-blur-sm">
            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--card-border)] mb-1">
              Backdrop Theme
            </div>
            {BACKDROP_MODES.map((mode) => {
              const Icon = mode.icon;
              const active = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleSelectMode(mode.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-text)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Toggle Button: Subtle right-edge tab */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-12 w-5 hover:w-7 hover:pl-1 items-center justify-center rounded-l-full border-y border-l border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all duration-200 ${
            isOpen ? "opacity-100 w-7 pl-1" : "opacity-15 hover:opacity-100"
          }`}
          title="Customize Background Backdrop"
        >
          <Sparkles className={`h-3 w-3 transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`} />
        </button>
      </div>
    </div>
  );
}
