import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const ThemeToggle = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      type="button"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-zinc-400" />
      ) : (
        <Moon className="h-5 w-5 text-zinc-500" />
      )}
    </button>
  );
};

export default ThemeToggle;