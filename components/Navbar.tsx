import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Music, Folder, ChevronRight } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Folder, label: 'Projects', href: '/projects' },
  { icon: Music, label: 'Music', href: '/music' },
];

const Navbar = () => {
  const router = useRouter();

  return (
    <nav
      className="sticky top-0 z-40 w-full transition-colors duration-300"
      style={{
        background: 'var(--bg-primary)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] transition-opacity hover:opacity-80"
        >
          <div className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
          abyn
        </Link>

        {/* Right: Nav links */}
        <div className="flex items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-200 hover:text-[var(--text-primary)]"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
