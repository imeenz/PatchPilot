import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Menu, X } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon?: LucideIcon;
  /** Exact match only (used for "/"). */
  end?: boolean;
  /** Hash links on the landing page are never shown as "active". */
  isAnchor?: boolean;
}

interface TopNavProps {
  brand: ReactNode;
  items: NavItem[];
  /** Controls shown on the right (desktop) and at the bottom of the mobile menu. */
  actions?: ReactNode;
  /** Controls that stay visible next to the menu button on small screens. */
  compactActions?: ReactNode;
  ariaLabel: string;
  /** Width at which the full horizontal menu replaces the mobile menu. */
  breakpoint?: 'lg' | 'xl';
}

// Literal class names so Tailwind can see them.
const BP = {
  lg: { desktop: 'hidden lg:flex', mobile: 'flex lg:hidden', panel: 'lg:hidden' },
  xl: { desktop: 'hidden xl:flex', mobile: 'flex xl:hidden', panel: 'xl:hidden' },
} as const;

const linkBase =
  'inline-flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60';

function linkClass(isActive: boolean) {
  return `${linkBase} ${
    isActive ? 'bg-primary/15 text-accent' : 'text-fg-muted hover:text-fg hover:bg-surface-2'
  }`;
}

export function TopNav({ brand, items, actions, compactActions, ariaLabel, breakpoint = 'lg' }: TopNavProps) {
  const bp = BP[breakpoint];
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const menuId = useId();

  // Close the mobile menu after navigation (adjusting state during render, not in an effect).
  const locationKey = `${location.pathname}${location.hash}`;
  const [lastLocationKey, setLastLocationKey] = useState(locationKey);
  if (locationKey !== lastLocationKey) {
    setLastLocationKey(locationKey);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center gap-4">
        {brand}

        <nav aria-label={ariaLabel} className={`${bp.desktop} items-center gap-1 ml-4 flex-1`}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => linkClass(isActive && !item.isAnchor)}
              >
                {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={`${bp.desktop} items-center gap-2 ml-auto shrink-0`}>{actions}</div>

        <div className={`${bp.mobile} items-center gap-2 ml-auto`}>
          {compactActions}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line text-fg-muted hover:text-fg hover:bg-surface-2 cursor-pointer"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id={menuId} className={`${bp.panel} border-t border-line bg-canvas`}>
          <nav aria-label={`${ariaLabel} (mobile)`} className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => linkClass(isActive && !item.isAnchor)}
                >
                  {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            {actions && <div className="pt-3 mt-2 border-t border-line flex flex-wrap items-center gap-2">{actions}</div>}
          </nav>
        </div>
      )}
    </header>
  );
}
