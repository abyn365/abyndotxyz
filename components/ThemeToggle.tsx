import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

type ThemeToggleProps = {
  inline?: boolean;
};

export default function ThemeToggle({ inline = false }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  if (!mounted) return null;

  const isDark = theme === "dark";

  if (inline) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-200 hover:border-[var(--accent)]"
        style={{
          borderColor: "var(--card-border)",
          background: "var(--card-bg)",
          color: "var(--text-secondary)",
        }}
      >
        {isDark ? (
          <Sun className="h-3.5 w-3.5" />
        ) : (
          <Moon className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="fixed bottom-5 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all duration-200 hover:scale-110"
      style={{
        borderColor: "var(--card-border)",
        background: "var(--card-bg)",
        color: "var(--text-secondary)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
