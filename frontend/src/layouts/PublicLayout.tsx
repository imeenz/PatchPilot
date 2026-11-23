import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { TopNav } from '@/components/navigation/TopNav';
import type { NavItem } from '@/components/navigation/TopNav';
import { ThemeToggle } from '@/components/navigation/ThemeToggle';
import { buttonSizeClasses, buttonVariantClasses } from '@/components/ui/Button';
import { SiteFooter } from '@/components/navigation/SiteFooter';

const PUBLIC_NAV: NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/#features', label: 'Features', isAnchor: true },
  { to: '/#how-it-works', label: 'How It Works', isAnchor: true },
  { to: '/#about', label: 'About', isAnchor: true },
];

export function PublicLayout() {
  const { hash, pathname } = useLocation();

  // Scroll to in-page sections for hash links (#features, #how-it-works, #about).
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [hash, pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg">
      <TopNav
        ariaLabel="Main navigation"
        brand={<Logo to="/" />}
        items={PUBLIC_NAV}
        compactActions={<ThemeToggle />}
        actions={
          <>
            <span className="hidden lg:inline-flex"><ThemeToggle /></span>
            <Link
              to="/overview"
              className={`inline-flex items-center ${buttonSizeClasses.md} ${buttonVariantClasses.primary}`}
            >
              Enter Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        }
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
