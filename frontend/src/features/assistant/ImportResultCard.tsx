import { Link } from 'react-router-dom';
import { CheckCircle2, MessageSquare, Search, XCircle } from 'lucide-react';
import type { FindingImportResponse } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buildImportQuestion } from './messageBuilders';

interface Props {
  result: FindingImportResponse;
  fileName: string;
  format: string;
  onAsk?: (text: string) => void;
  onAnalyzeFinding?: (findingId: number) => void;
}

export function ImportResultCard({ result, fileName, format, onAsk, onAnalyzeFinding }: Props) {
  const top = [...result.imported_findings].sort((a, b) => b.risk_score - a.risk_score).slice(0, 8);
  return (
    <div className="rounded-xl border border-line bg-surface shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-fg">Import result: {fileName}</p>
          <p className="text-xs text-fg-subtle">{format} · response from POST /api/v1/findings/import</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="success" size="sm">
            {result.imported_count} imported
          </Badge>
          <Badge variant={result.rejected_count ? 'critical' : 'neutral'} size="sm">
            {result.rejected_count} rejected
          </Badge>
          <Badge variant="neutral" size="sm">
            {result.total_records} sent
          </Badge>
        </div>
      </div>

      {top.length > 0 && (
        <ul className="divide-y divide-line">
          {top.map((f) => (
            <li key={f.id} className="px-4 py-2.5 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <Badge variant={f.severity} size="sm">
                {f.severity}
              </Badge>
              <Link to={`/vulnerabilities/${f.id}`} className="flex-1 min-w-0 text-sm text-fg hover:text-accent truncate">
                #{f.id} {f.title}
              </Link>
              {onAnalyzeFinding && (
                <button
                  type="button"
                  onClick={() => onAnalyzeFinding(f.id)}
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" /> Analyze
                </button>
              )}
            </li>
          ))}
          {result.imported_findings.length > top.length && (
            <li className="px-4 py-2 text-xs text-fg-subtle">
              + {result.imported_findings.length - top.length} more.{' '}
              <Link to="/vulnerabilities" className="text-accent hover:underline">
                View all in Vulnerabilities
              </Link>
            </li>
          )}
        </ul>
      )}

      {result.rejected_findings.length > 0 && (
        <details className="border-t border-line">
          <summary className="px-4 py-2.5 text-xs font-medium text-critical cursor-pointer">
            {result.rejected_findings.length} record(s) rejected by the backend
          </summary>
          <ul className="px-4 pb-3 space-y-1.5">
            {result.rejected_findings.map((r) => (
              <li key={r.index} className="flex gap-2 text-xs text-fg-muted">
                <XCircle className="w-3.5 h-3.5 text-critical shrink-0 mt-0.5" />
                <span>
                  Record {r.index + 1}: {r.reason}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {onAsk && result.imported_count > 0 && (
        <div className="px-4 py-3 border-t border-line bg-surface-2/40">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            onClick={() => onAsk(buildImportQuestion(result, fileName, format))}
          >
            Ask PatchPilot to prioritise the imported findings
          </Button>
        </div>
      )}
    </div>
  );
}
