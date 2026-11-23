import { Link, Outlet } from 'react-router-dom';
import {
  Bot,
  FlaskConical,
  Home,
  LayoutDashboard,
  ListTodo,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { TopNav } from '@/components/navigation/TopNav';
import type { NavItem } from '@/components/navigation/TopNav';
import { ThemeToggle } from '@/components/navigation/ThemeToggle';
import { BackendStatusPill } from '@/components/navigation/BackendStatusPill';
import { Button } from '@/components/ui/Button';
import { useDemoMode } from '@/hooks/useDemoMode';

const WORKSPACE_NAV: NavItem[] = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/vulnerabilities', label: 'Vulnerabilities', icon: ShieldAlert },
  { to: '/tasks', label: 'Remediation Tasks', icon: ListTodo },
  { to: '/verification', label: 'Verification', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function WorkspaceLayout() {
  const demo = useDemoMode();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg">
      <TopNav
        ariaLabel="Workspace navigation"
        breakpoint="xl"
        brand={<Logo to="/overview" subtitle="Workspace" />}
        items={WORKSPACE_NAV}
        compactActions={<ThemeToggle />}
        actions={
          <>
            <BackendStatusPill />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
              title="Back to the PatchPilot homepage"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <span className="hidden xl:inline-flex"><ThemeToggle /></span>
          </>
        }
      />

      {demo.isActive && (
        <div role="status" className="border-b border-medium/35 bg-medium/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start sm:items-center gap-2 text-fg">
              <FlaskConical className="w-4 h-4 text-medium shrink-0" />
              <span>
                <strong className="font-semibold">Demo dataset active.</strong>{' '}
                <span className="text-fg-muted">
                  The workspace shows sample records held only in this browser tab, not scanner results. Nothing is
                  written to the backend. The AI Assistant still talks to the real backend.
                </span>
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={demo.disable} className="shrink-0 self-start sm:self-auto">
              Exit demo, return to live workspace
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        {/* Remount pages when switching live/demo so no data from one mode leaks into the other. */}
        <Outlet key={demo.isActive ? 'demo' : 'live'} />
      </main>
    </div>
  );
}
