import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiHome, FiMusic, FiFolder, FiChevronRight } from 'react-icons/fi';

const navItems = [
  { icon: FiHome, label: 'Home', href: '/' },
  { icon: FiFolder, label: 'Projects', href: '/projects' },
  { icon: FiMusic, label: 'Music', href: '/music' },
];

const Navbar = () => {
  const router = useRouter();

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-300"
      style={{
        background: 'var(--bg-primary)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-80"
        >
          <FiChevronRight className="h-4 w-4" style={{ color: 'var(--accent)' }} />
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
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
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
