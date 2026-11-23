import { Link } from 'react-router-dom';

/** PatchPilot mark: a shield with a check-path, drawn inline so it follows the theme. */
export function LogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M16 6.5 8.5 9.4v6.1c0 4.6 3.1 8.6 7.5 9.9 4.4-1.3 7.5-5.3 7.5-9.9V9.4L16 6.5Z"
        fill="none"
        stroke="white"
        strokeOpacity="0.95"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="m12.6 16 2.5 2.5 4.6-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ to = '/', subtitle }: { to?: string; subtitle?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60" aria-label="PatchPilot home">
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="font-semibold tracking-tight text-fg">PatchPilot</span>
        {subtitle && <span className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">{subtitle}</span>}
      </span>
    </Link>
  );
}
