import { useEffect, useState } from "react";
import { Settings, Sparkles, Grid, EyeOff, MoreHorizontal, Compass, Cloud, LayoutGrid } from "lucide-react";

const BACKDROP_MODES = [
  { id: "cyber-grid", label: "Cyber Grid", icon: Grid },
  { id: "flowing-dots", label: "Art Dots", icon: MoreHorizontal },
  { id: "space-dust", label: "Space Dust", icon: Sparkles },
  { id: "nexus-waves", label: "Nexus Waves", icon: Compass },
  { id: "cosmic-nebula", label: "Cosmic Nebula", icon: Cloud },
  { id: "pure-dark", label: "Solid Dark", icon: EyeOff },
];

// Default setting for Weather FX if no saved user preference is found (true/false)
const DEFAULT_WEATHER_ENABLED = false;

export default function BackgroundSelector() {
  const [activeMode, setActiveMode] = useState("cyber-grid");
  const [isOpen, setIsOpen] = useState(false);
  const [weatherEnabled, setWeatherEnabled] = useState(DEFAULT_WEATHER_ENABLED);

  useEffect(() => {
    const saved = localStorage.getItem("site-backdrop") || "cyber-grid";
    setActiveMode(saved);
    
    const savedWeatherStr = localStorage.getItem("site-weather-overlay");
    const savedWeather = savedWeatherStr !== null ? savedWeatherStr === "true" : DEFAULT_WEATHER_ENABLED;
    setWeatherEnabled(savedWeather);

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
  };

  const handleToggleWeather = () => {
    const nextVal = !weatherEnabled;
    setWeatherEnabled(nextVal);
    localStorage.setItem("site-weather-overlay", nextVal ? "true" : "false");
    window.dispatchEvent(new CustomEvent("site-weather-overlay-change", { detail: nextVal }));
  };

  return (
    <div className="fixed top-1/2 right-0 -translate-y-1/2 z-40 select-none print:hidden">
      <div className="relative flex items-center">
        {/* Selector Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-7 top-1/2 -translate-y-1/2 w-44 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1.5 shadow-lg flex flex-col gap-1 backdrop-blur-sm">
            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--card-border)] mb-1">
              Effects & Backdrops
            </div>
            <div className="flex flex-col gap-0.5 max-h-[220px] overflow-y-auto scrollbar-none">
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

            {/* Weather Overlay Toggle */}
            <div className="border-t border-[var(--card-border)] mt-1 pt-1.5 px-2 mb-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Weather FX</span>
                <button
                  onClick={handleToggleWeather}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    weatherEnabled ? "bg-[var(--accent)]" : "bg-neutral-800"
                  }`}
                  aria-label="Toggle Weather Overlay"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[var(--card-bg)] shadow ring-0 transition duration-200 ease-in-out ${
                      weatherEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button: Subtle right-edge tab */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-12 w-5 hover:w-7 hover:pl-1 items-center justify-center rounded-l-full border-y border-l border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all duration-200 ${
            isOpen ? "opacity-100 w-7 pl-1" : "opacity-15 hover:opacity-100"
          }`}
          title="Theme Effects & Backdrops"
        >
          <Sparkles className={`h-3 w-3 transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`} />
        </button>
      </div>
    </div>
  );
}
