import { DataSourceBadge, ErrorState } from '@/components/ui/StateViews';
import { useState, useEffect } from 'react';
import { findingService } from '@/services/findingService';
import type { FindingResponse } from '@/types';
import { FindingFilterBar } from '@/features/findings/FindingFilterBar';
import { FindingTable } from '@/features/findings/FindingTable';
import { Button } from '@/components/ui/Button';
import { FileJson, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddFindingModal } from '@/features/findings/AddFindingModal';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { getDataSourceState } from '@/services/apiPresentation.mjs';

export function VulnerabilitiesPage() {
  const [findings, setFindings] = useState<FindingResponse[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [severity, setSeverity] = useState('');
  const [source, setSource] = useState('');
  const [hasCve, setHasCve] = useState<boolean | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [requestStatus, setRequestStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [isDemo, setIsDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();
  const { status: backendStatus } = useBackendHealth();

  useEffect(() => {
    let ignore = false;
    setRequestStatus('loading');

    findingService
      .listFindings({
        page,
        size,
        severity: severity || undefined,
        source: source || undefined,
        has_cve: hasCve,
        query: query.trim() || undefined,
      })
      .then((res) => {
        if (!ignore) {
          setFindings(res.data.items);
          setTotal(res.data.total);
          setTotalPages(res.data.total_pages);
          setIsDemo(res.isDemo);
          setError(null);
          setRequestStatus('success');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err);
          setRequestStatus('failed');
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, size, severity, source, hasCve, query, reloadKey]);

  const handleRefresh = () => {
    setIsLoading(true);
    setRequestStatus('loading');
    setReloadKey((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setQuery('');
    setSeverity('');
    setSource('');
    setHasCve(undefined);
    setPage(1);
  };

  const hasFilters = Boolean(query.trim() || severity || source || hasCve !== undefined);
  const isWorkspaceEmpty = !isLoading && error == null && total === 0 && !hasFilters;
  const dataSourceState = getDataSourceState(isDemo, backendStatus, requestStatus);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Page Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg">
            Vulnerabilities Catalog
          </h2>
          <p className="text-xs sm:text-sm text-fg-subtle mt-0.5">
            Ingested findings from static/dynamic scans, dependency audits, and security telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DataSourceBadge isDemo={isDemo} state={dataSourceState} />
          {!isDemo && (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate('/assistant?import=1')} leftIcon={<FileJson className="w-3.5 h-3.5" />}>
                Import report
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add finding
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-fg-subtle" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FindingFilterBar
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setPage(1);
          setIsLoading(true);
        }}
        severity={severity}
        onSeverityChange={(s) => {
          setSeverity(s);
          setPage(1);
          setIsLoading(true);
        }}
        source={source}
        onSourceChange={(src) => {
          setSource(src);
          setPage(1);
          setIsLoading(true);
        }}
        hasCve={hasCve}
        onHasCveChange={(hc) => {
          setHasCve(hc);
          setPage(1);
          setIsLoading(true);
        }}
        onReset={handleResetFilters}
      />

      {/* Error state */}
      {error != null && <ErrorState error={error} onRetry={handleRefresh} />}

      {/* Loading Skeleton Indicator */}
      {isLoading && findings.length === 0 && (
        <div className="p-16 text-center space-y-3 bg-surface border border-line rounded-xl shadow-card">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-fg-subtle font-medium font-mono">
            Fetching vulnerability records from GET /api/v1/findings...
          </p>
        </div>
      )}

      {/* Empty workspace (no filters applied) */}
      {isWorkspaceEmpty && (
        <EmptyState
          icon={ShieldCheck}
          title="No vulnerability findings yet"
          description="Import a Trivy or OWASP ZAP JSON report, or add a finding manually, to start building your workspace."
          action={
            <>
              <Button onClick={() => navigate('/assistant?import=1')} leftIcon={<FileJson className="w-4 h-4" />}>
                Import scanner report
              </Button>
              <Button variant="secondary" onClick={() => setAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Add a finding
              </Button>
            </>
          }
        />
      )}

      {/* Findings Table */}
      {(!isLoading || findings.length > 0) && error == null && !isWorkspaceEmpty && (
        <FindingTable
          findings={findings}
          page={page}
          totalPages={totalPages}
          total={total}
          size={size}
          onPageChange={(p) => {
            setPage(p);
            setIsLoading(true);
          }}
          isLoading={isLoading}
        />
      )}

      <AddFindingModal isOpen={addOpen} onClose={() => setAddOpen(false)} onCreated={handleRefresh} />
    </div>
  );
}
