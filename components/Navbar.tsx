import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Music, Folder } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Folder, label: 'Projects', href: '/projects' },
  { icon: Music, label: 'Music', href: '/music' },
];

const Navbar = () => {
  const router = useRouter();

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b transition-colors duration-300"
      style={{
        background: 'var(--bg-primary)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <Link
          href="/"
          className="text-sm font-medium text-[var(--text-primary)] transition-opacity hover:opacity-70"
        >
          abyn
        </Link>

        {/* Right: Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200"
                style={{
                  background: isActive ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
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