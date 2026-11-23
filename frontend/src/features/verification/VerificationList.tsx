import { ExternalLink, Clock, ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import type { VerificationResponse } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface VerificationListProps {
  verifications: VerificationResponse[];
}

export function VerificationList({ verifications }: VerificationListProps) {
  if (verifications.length === 0) {
    return (
      <Card className="p-8 text-center text-fg-subtle">
        <ShieldCheck className="w-8 h-8 text-fg-subtle mx-auto mb-2" />
        <p className="text-xs sm:text-sm font-medium text-fg-muted">
          No verification evidence recorded for this finding yet.
        </p>
        <p className="text-xs text-fg-subtle mt-1 max-w-md mx-auto">
          Submit automated scanner output, PR links, or regression test evidence once
          remediation is implemented.
        </p>
      </Card>
    );
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'Verified Fixed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'Failed':
        return <AlertTriangle className="w-4 h-4 text-critical" />;
      case 'Partially Fixed':
        return <AlertTriangle className="w-4 h-4 text-medium" />;
      default:
        return <HelpCircle className="w-4 h-4 text-accent" />;
    }
  };

  return (
    <div className="space-y-3">
      {verifications.map((v) => (
        <Card key={v.id} className="p-4 border border-line shadow-card space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-surface-2 border border-line">
                {getResultIcon(v.verification_result)}
              </div>
              <Badge variant={v.verification_result} size="sm" dot>
                {v.verification_result}
              </Badge>
              {v.task_id && (
                <span className="text-[11px] font-mono text-fg-subtle bg-surface-2 px-2 py-0.5 rounded">
                  Linked to Task #{v.task_id}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-fg-subtle">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(v.created_at).toLocaleString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-fg leading-relaxed whitespace-pre-wrap pl-1">
            {v.evidence_description}
          </p>

          {v.evidence_url && (
            <div className="pt-1 pl-1">
              <a
                href={v.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent font-mono underline"
              >
                <span>{v.evidence_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
