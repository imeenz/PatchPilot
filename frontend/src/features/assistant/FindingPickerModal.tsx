import { useEffect, useState } from 'react';
import { FlaskConical, Search, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { findingService } from '@/services/findingService';
import { useDemoMode } from '@/hooks/useDemoMode';
import type { FindingContextSummary, FindingResponse } from '@/types';
import { toContextSummary } from './messageBuilders';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (finding: FindingContextSummary) => void;
  currentFindingId?: number | null;
}

/** Lets the user choose a real workspace finding to send as finding_id with the conversation. */
export function FindingPickerModal({ isOpen, onClose, onSelect, currentFindingId }: Props) {
  const demo = useDemoMode();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<FindingResponse[]>([]);
  const [reload, setReload] = useState(0);
  // Loading/error are derived from which request has completed, so no state is set synchronously in the effect.
  const requestKey = `${debounced}|${reload}|${isOpen}`;
  const [result, setResult] = useState<{ key: string; error: unknown } | null>(null);
  const isLoading = result?.key !== requestKey;
  const error = result?.key === requestKey ? result.error : null;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!isOpen || demo.isActive) return;
    let ignore = false;
    findingService
      .listFindings({ query: debounced || undefined, size: 25 })
      .then((res) => {
        if (ignore) return;
        setItems(res.data.items);
        setResult({ key: requestKey, error: null });
      })
      .catch((e) => !ignore && setResult({ key: requestKey, error: e }));
    return () => {
      ignore = true;
    };
  }, [isOpen, debounced, reload, demo.isActive, requestKey]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attach a workspace finding"
      description="The assistant will receive this finding's stored details as context (sent as finding_id)."
      maxWidth="lg"
    >
      {demo.isActive ? (
        <div className="flex gap-3 rounded-lg border border-medium/35 bg-medium/10 p-4 text-sm text-fg-muted">
          <FlaskConical className="w-5 h-5 text-medium shrink-0" />
          <p>
            Demo findings exist only in this browser tab, so the backend cannot use them as chat context. Exit demo mode
            to attach real findings. You can still paste a finding's text into the chat.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, package or CVE…"
              aria-label="Search findings"
              className="w-full rounded-lg border border-line bg-canvas pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary/60"
            />
          </div>

          {error ? (
            <ErrorState error={error} onRetry={() => setReload((r) => r + 1)} compact />
          ) : isLoading && items.length === 0 ? (
            <LoadingState label="Loading findings…" />
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-sm text-fg-subtle">
              <ShieldAlert className="w-6 h-6 mx-auto mb-2" />
              {debounced ? 'No findings match this search.' : 'No findings in the workspace yet. Import a scanner report first.'}
            </div>
          ) : (
            <ul className="max-h-[50vh] overflow-y-auto divide-y divide-line rounded-lg border border-line">
              {items.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(toContextSummary(f));
                      onClose();
                    }}
                    className="w-full text-left px-3.5 py-3 hover:bg-surface-2 transition-colors cursor-pointer flex items-start gap-3"
                  >
                    <Badge variant={f.severity} size="sm" dot>
                      {f.severity}
                    </Badge>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-fg truncate">
                        #{f.id} {f.title}
                      </span>
                      <span className="block text-xs text-fg-subtle font-mono truncate">
                        {[f.cve_id, f.package_name, f.source].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    {currentFindingId === f.id && <span className="text-[11px] text-accent shrink-0">Attached</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
