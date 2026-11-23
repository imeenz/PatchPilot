import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ListTodo, ShieldAlert } from 'lucide-react';
import type { FindingResponse } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface FindingTableProps {
  findings: FindingResponse[];
  page: number;
  totalPages: number;
  total: number;
  size: number;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
}

export function FindingTable({
  findings,
  page,
  totalPages,
  total,
  size,
  onPageChange,
  isLoading,
}: FindingTableProps) {
  if (findings.length === 0 && !isLoading) {
    return (
      <Card className="p-12 text-center text-fg-subtle">
        <ShieldAlert className="w-10 h-10 text-fg-subtle mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-fg">No findings matched your criteria</h3>
        <p className="text-xs text-fg-subtle mt-1 max-w-sm mx-auto">
          Try clearing your search query or resetting the severity and source filters.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-line shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-2 border-b border-line text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Identifier / CVE</th>
              <th className="py-3 px-4">Finding Title</th>
              <th className="py-3 px-4">Package / Component</th>
              <th className="py-3 px-4">Fixed In</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">State</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-xs">
            {findings.map((f) => (
              <tr
                key={f.id}
                className="hover:bg-surface-2 transition-colors group"
              >
                {/* Severity */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Badge variant={f.severity} size="sm" dot>
                    {f.severity}
                  </Badge>
                </td>

                {/* Risk Score */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className={`font-bold ${
                        f.risk_score >= 80
                          ? 'text-critical'
                          : f.risk_score >= 60
                          ? 'text-high'
                          : f.risk_score >= 40
                          ? 'text-medium'
                          : 'text-accent'
                      }`}
                    >
                      {f.risk_score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-fg-subtle">/ 100</span>
                  </div>
                </td>

                {/* CVE ID */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {f.cve_id ? (
                    <span className="font-mono text-xs font-semibold text-fg bg-surface-2 px-2 py-0.5 rounded border border-line">
                      {f.cve_id}
                    </span>
                  ) : (
                    <span className="text-fg-subtle font-mono text-[11px] italic">
                      Non-CVE
                    </span>
                  )}
                </td>

                {/* Title */}
                <td className="py-3.5 px-4 max-w-xs">
                  <Link
                    to={`/vulnerabilities/${f.id}`}
                    className="font-medium text-fg hover:text-accent transition-colors line-clamp-1 block"
                    title={f.title}
                  >
                    {f.title}
                  </Link>
                  <p className="text-[11px] text-fg-subtle line-clamp-1 mt-0.5">
                    {f.description}
                  </p>
                </td>

                {/* Package */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {f.package_name ? (
                    <div>
                      <div className="font-mono text-fg font-medium">
                        {f.package_name}
                      </div>
                      {f.installed_version && (
                        <div className="text-[10px] font-mono text-fg-subtle">
                          v{f.installed_version}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-fg-subtle text-[11px]">—</span>
                  )}
                </td>

                {/* Fixed Version */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {f.fixed_version ? (
                    <span className="font-mono text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded text-[11px]">
                      &gt;= {f.fixed_version}
                    </span>
                  ) : (
                    <span className="text-fg-subtle text-[11px]">No fix published</span>
                  )}
                </td>

                {/* Source */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="text-[10px] font-mono uppercase bg-surface-2 text-fg-muted px-1.5 py-0.5 rounded border border-line">
                    {f.source}
                  </span>
                </td>

                {/* Verification & Tasks state */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {f.is_verified_fixed ? (
                      <Badge variant="verified fixed" size="sm" dot>
                        Verified
                      </Badge>
                    ) : f.tasks_count && f.tasks_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-medium bg-medium/10 px-2 py-0.5 rounded border border-medium/30 font-medium">
                        <ListTodo className="w-3 h-3 text-medium" />
                        {f.tasks_count} task{f.tasks_count > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-fg-subtle text-[11px]">Open</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Link
                    to={`/vulnerabilities/${f.id}`}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent font-medium group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 bg-surface-2 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-fg-subtle">
        <div>
          Showing{' '}
          <span className="font-semibold text-fg-muted">
            {total === 0 ? 0 : (page - 1) * size + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-fg-muted">
            {Math.min(page * size, total)}
          </span>{' '}
          of <span className="font-semibold text-fg-muted">{total}</span> findings
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-1.5 rounded-lg border border-line bg-surface text-fg-muted hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-mono text-xs text-fg-muted">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1.5 rounded-lg border border-line bg-surface text-fg-muted hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
