import { AlertTriangle, FlaskConical, Loader2, RefreshCw, ServerCrash, Wifi } from 'lucide-react';
import { Button } from './Button';
import { API_BASE_URL, isNetworkError } from '@/services/api';

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
          {title ?? (network ? 'Cannot connect to the PatchPilot backend' : 'Request failed')}
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
export function DataSourceBadge({ isDemo }: { isDemo: boolean }) {
  return isDemo ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-medium/12 border border-medium/35 text-medium text-[11px] font-mono font-medium">
      <FlaskConical className="w-3.5 h-3.5" />
      <span>Demo dataset (sample data)</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-success text-[11px] font-mono font-medium">
      <Wifi className="w-3.5 h-3.5" />
      <span>Live backend</span>
    </span>
  );
}
