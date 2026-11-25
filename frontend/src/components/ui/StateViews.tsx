import { AlertTriangle, FlaskConical, Loader2, RefreshCw, ServerCrash, Wifi } from 'lucide-react';
import { Button } from './Button';
import { API_BASE_URL, isNetworkError } from '@/services/api';
import { getApiErrorPresentation } from '@/services/apiPresentation.mjs';
import type { DataSourceState } from '@/services/apiPresentation.mjs';

/** Inline loading indicator for sections and pages. */
export function LoadingState({ label = 'Loading…', className = '' }: { label?: string; className?: string }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-2.5 py-12 text-sm text-fg-subtle ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin text-accent" />
      <span>{label}</span>
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Explicit error display. Network failures are reported as a backend
 * connection problem — live data is never replaced with sample data.
 */
export function ErrorState({ error, onRetry, title, className = '', compact = false }: ErrorStateProps) {
  const network = isNetworkError(error);
  const presentation = getApiErrorPresentation(error);
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const Icon = network ? ServerCrash : AlertTriangle;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-critical/30 bg-critical/8 text-fg ${compact ? 'p-3.5' : 'p-5'} flex flex-col sm:flex-row sm:items-start gap-3 ${className}`}
    >
      <Icon className="w-5 h-5 text-critical shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-fg">
          {title ?? presentation.title}
        </p>
        {network ? (
          <p className="text-xs text-fg-muted leading-relaxed">
            Live data cannot be loaded right now. No sample data is shown in its place. Check that the
            backend is running at <code className="font-mono text-accent break-all">{API_BASE_URL}</code>{' '}
            and try again.
          </p>
        ) : (
          <p className="text-xs text-fg-muted leading-relaxed break-words">{message}</p>
        )}
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="shrink-0 self-start"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

/** Small pill describing where the data on screen comes from. */
const DATA_SOURCE_BADGE = {
  demo: { icon: FlaskConical, label: 'Demo dataset (sample data)', styles: 'bg-medium/12 border-medium/35 text-medium' },
  checking: { icon: Loader2, label: 'Checking backend', styles: 'bg-surface-2 border-line text-fg-subtle' },
  offline: { icon: ServerCrash, label: 'Backend offline', styles: 'bg-critical/8 border-critical/30 text-critical' },
  degraded: { icon: AlertTriangle, label: 'Live data unavailable', styles: 'bg-medium/12 border-medium/35 text-medium' },
  live: { icon: Wifi, label: 'Live backend', styles: 'bg-success/10 border-success/30 text-success' },
} as const;

export function DataSourceBadge({ isDemo, state }: { isDemo: boolean; state?: DataSourceState }) {
  const resolvedState = state ?? (isDemo ? 'demo' : 'live');
  const badge = DATA_SOURCE_BADGE[resolvedState];
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-medium ${badge.styles}`}>
      <Icon className={`w-3.5 h-3.5 ${resolvedState === 'checking' ? 'animate-spin' : ''}`} />
      <span>{badge.label}</span>
    </span>
  );
}
