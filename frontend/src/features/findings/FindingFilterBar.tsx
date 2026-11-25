import { Search, Filter, X } from 'lucide-react';
import type { SeverityLevel } from '@/types';

interface FindingFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  severity: string;
  onSeverityChange: (severity: string) => void;
  source: string;
  onSourceChange: (source: string) => void;
  hasCve: boolean | undefined;
  onHasCveChange: (hasCve: boolean | undefined) => void;
  onReset: () => void;
}

const SEVERITIES: SeverityLevel[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
  'Informational',
];

const SOURCES = ['snyk', 'trivy', 'semgrep', 'owasp-zap', 'manual', 'json_import'];

export function FindingFilterBar({
  query,
  onQueryChange,
  severity,
  onSeverityChange,
  source,
  onSourceChange,
  hasCve,
  onHasCveChange,
  onReset,
}: FindingFilterBarProps) {
  const hasActiveFilters = Boolean(query || severity || source || hasCve !== undefined);

  return (
    <div className="bg-surface border border-line rounded-xl p-3.5 shadow-card space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by CVE, CWE, package, or keyword..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface-2 border border-line rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-surface transition-colors"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg-muted p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider hidden sm:inline">
              Severity:
            </span>
            <select
              value={severity}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-surface-2 border border-line rounded-lg text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider hidden sm:inline">
              Source:
            </span>
            <select
              value={source}
              onChange={(e) => onSourceChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-surface-2 border border-line rounded-lg text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer"
            >
              <option value="">All Sources</option>
              {SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Has CVE filter */}
          <select
            value={hasCve === undefined ? '' : String(hasCve)}
            onChange={(e) => {
              const val = e.target.value;
              onHasCveChange(val === '' ? undefined : val === 'true');
            }}
            className="px-2.5 py-1.5 text-xs bg-surface-2 border border-line rounded-lg text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer"
          >
            <option value="">CVE Status</option>
            <option value="true">Registered CVE</option>
            <option value="false">Non-CVE (CWE/Audit)</option>
          </select>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-fg-muted hover:text-fg bg-surface-2 hover:bg-line rounded-lg transition-colors cursor-pointer"
            >
              <Filter className="w-3 h-3 text-fg-subtle" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
