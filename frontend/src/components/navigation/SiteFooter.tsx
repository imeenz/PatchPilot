import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/#features', label: 'Features' },
      { to: '/#how-it-works', label: 'How It Works' },
      { to: '/#about', label: 'About' },
    ],
  },
  {
    title: 'Workspace',
    links: [
      { to: '/overview', label: 'Overview' },
      { to: '/assistant', label: 'AI Assistant' },
      { to: '/vulnerabilities', label: 'Vulnerabilities' },
      { to: '/tasks', label: 'Remediation Tasks' },
      { to: '/verification', label: 'Verification' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-semibold text-fg">PatchPilot</span>
          </div>
          <p className="text-sm text-fg-subtle leading-relaxed">
            Intelligent Security Remediation Assistant. Helps developers and security analysts understand
            vulnerability findings, prioritise risk, plan remediation and record verification evidence.
          </p>
          <p className="text-xs text-fg-subtle leading-relaxed">
            AI and rule-based guidance requires human review. PatchPilot does not modify source code, deploy
            changes or mark issues as fixed without recorded evidence.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle mb-3">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-fg-muted hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs text-fg-subtle flex flex-col sm:flex-row gap-1 sm:justify-between">
          <span>PatchPilot · TrustChain project</span>
          <span>Academic project · React + FastAPI</span>
        </div>
      </div>
    </footer>
  );
}
