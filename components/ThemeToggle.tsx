import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const ThemeToggle = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-50 flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200"
      style={{
        borderColor: 'var(--card-border)',
        background: 'var(--card-bg)',
        color: 'var(--text-secondary)',
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      type="button"
    >
      {theme === 'dark' ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

export default ThemeToggle;