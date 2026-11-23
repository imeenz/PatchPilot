import { useBackendHealth } from '@/hooks/useBackendHealth';

const STYLES = {
  checking: { dot: 'bg-fg-subtle animate-pulse', text: 'Checking backend…' },
  online: { dot: 'bg-success', text: 'Backend online' },
  degraded: { dot: 'bg-medium', text: 'Backend degraded' },
  offline: { dot: 'bg-critical', text: 'Backend offline' },
} as const;

/** Connection indicator based on GET /api/v1/health. Click to re-check. */
export function BackendStatusPill() {
  const { status, health, recheck } = useBackendHealth();
  const s = STYLES[status];
  const title =
    status === 'offline'
      ? 'The backend could not be reached. Click to check again.'
      : health
        ? `${health.app} ${health.version} · database: ${health.database} · AI provider: ${health.ai_provider}. Click to re-check.`
        : 'Click to re-check.';

  return (
    <button
      type="button"
      onClick={recheck}
      title={title}
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-line text-[11px] font-mono text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
    >
      <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
      <span>{s.text}</span>
    </button>
  );
}
