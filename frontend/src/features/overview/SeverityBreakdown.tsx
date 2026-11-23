import { ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const LEVELS = [
  { key: 'Critical', bar: 'bg-critical' },
  { key: 'High', bar: 'bg-high' },
  { key: 'Medium', bar: 'bg-medium' },
  { key: 'Low', bar: 'bg-low' },
  { key: 'Informational', bar: 'bg-info' },
] as const;

export function SeverityBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const total = LEVELS.reduce((s, l) => s + (breakdown[l.key] ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-fg-muted" />
          <h3 className="text-sm font-semibold text-fg">Severity distribution</h3>
        </div>
        <span className="text-[11px] font-mono text-fg-subtle">Total: {total}</span>
      </CardHeader>
      <CardBody className="space-y-4">
        <div
          className="h-3 w-full rounded-full bg-surface-2 flex overflow-hidden"
          role="img"
          aria-label={LEVELS.map((l) => `${l.key}: ${breakdown[l.key] ?? 0}`).join(', ')}
        >
          {total > 0 &&
            LEVELS.map((l) => {
              const n = breakdown[l.key] ?? 0;
              return n > 0 ? (
                <div key={l.key} style={{ width: `${(n / total) * 100}%` }} className={`${l.bar} transition-all`} title={`${l.key}: ${n}`} />
              ) : null;
            })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {LEVELS.map((l) => (
            <div key={l.key} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-2/60 border border-line">
              <Badge variant={l.key} size="sm" dot>
                {l.key === 'Informational' ? 'Info' : l.key}
              </Badge>
              <span className="text-sm font-semibold text-fg font-mono">{breakdown[l.key] ?? 0}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
