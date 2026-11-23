import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileJson,
  FlaskConical,
  Flame,
  Gauge,
  ListTodo,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { MetricCard } from '@/features/overview/MetricCard';
import { SeverityBreakdown } from '@/features/overview/SeverityBreakdown';
import { VulnerabilityList } from '@/features/overview/VulnerabilityList';
import { AddFindingModal } from '@/features/findings/AddFindingModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataSourceBadge, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { dashboardService } from '@/services/dashboardService';
import { findingService } from '@/services/findingService';
import { useDemoMode } from '@/hooks/useDemoMode';
import type { DashboardSummaryResponse, FindingResponse } from '@/types';

export function OverviewPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [topFindings, setTopFindings] = useState<FindingResponse[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([dashboardService.getSummary(), findingService.listFindings({ size: 5 })])
      .then(([s, f]) => {
        if (ignore) return;
        setSummary(s.data);
        setIsDemo(s.isDemo);
        setTopFindings(f.data.items);
        setError(null);
      })
      .catch((e) => !ignore && setError(e))
      .finally(() => !ignore && setIsLoading(false));
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  };
  const tb = summary?.task_status_breakdown ?? {};
  const activeTasks = (tb['Open'] ?? 0) + (tb['In Progress'] ?? 0) + (tb['Blocked'] ?? 0);
  const isEmpty = summary !== null && summary.total_findings === 0;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Overview</h1>
          <p className="text-sm text-fg-subtle mt-0.5">Findings, remediation progress and verified fixes in your workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {summary && <DataSourceBadge isDemo={isDemo} />}
          <Button variant="secondary" size="sm" onClick={reload} isLoading={isLoading} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && !summary && <LoadingState label="Loading workspace summary…" />}

      {error != null && <ErrorState error={error} onRetry={reload} />}

      {!error && isEmpty && (
        <Card className="p-8 sm:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/12 border border-primary/25 text-accent flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-fg">Your security workspace is ready.</h2>
            <p className="mt-2 text-sm text-fg-muted">
              No vulnerability findings yet. Import a scanner report or create your first finding to begin.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Button onClick={() => navigate('/assistant?import=1')} leftIcon={<FileJson className="w-4 h-4" />}>
                Import scanner report
              </Button>
              <Button variant="secondary" onClick={() => setAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Add a finding
              </Button>
              <Button variant="secondary" onClick={() => navigate('/assistant')} leftIcon={<Bot className="w-4 h-4" />}>
                Ask the AI Assistant
              </Button>
            </div>
            <div className="mt-8 pt-6 border-t border-line text-left sm:text-center">
              <p className="text-xs text-fg-subtle">
                Presenting PatchPilot? You can load a clearly labelled demo dataset. It lives only in this browser tab,
                is never sent to the backend, and disappears when you exit demo mode or refresh.
              </p>
              <Button className="mt-3" variant="outline" size="sm" onClick={demo.enable} leftIcon={<FlaskConical className="w-3.5 h-3.5" />}>
                Load demo dataset
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!error && summary && !isEmpty && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total findings" value={summary.total_findings} icon={ShieldAlert} description={`${summary.open_findings} not yet verified fixed`} />
            <MetricCard
              title="Critical findings"
              value={summary.severity_breakdown['Critical'] ?? 0}
              icon={Flame}
              tone="critical"
              description={`${summary.severity_breakdown['High'] ?? 0} high severity`}
            />
            <MetricCard
              title="Active remediation tasks"
              value={activeTasks}
              icon={ListTodo}
              tone="medium"
              description={`Open, in progress or blocked · ${summary.total_tasks} total`}
            />
            <MetricCard
              title="Verified fixes"
              value={summary.verified_fixed_findings}
              icon={CheckCircle2}
              tone="success"
              description={`${summary.total_verifications} evidence record(s)`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SeverityBreakdown breakdown={summary.severity_breakdown} />
              <VulnerabilityList findings={topFindings} />
            </div>
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <Gauge className="w-4 h-4 text-accent" /> Average risk score
                </div>
                <p className="mt-2 text-3xl font-semibold text-fg">
                  {summary.average_risk_score.toFixed(1)}
                  <span className="text-base text-fg-subtle font-normal">/100</span>
                </p>
                <p className="mt-2 text-xs text-fg-subtle leading-relaxed">
                  Severity-based prioritisation score {isDemo ? 'computed from the demo records with the backend’s formula' : 'calculated by the backend'}. It is not a CVSS score or an
                  exploitability assessment.
                </p>
              </Card>
              <Card className="p-5 space-y-3">
                <p className="text-sm font-semibold text-fg">Next steps</p>
                {[
                  { to: '/assistant?import=1', label: 'Import another scanner report', icon: FileJson },
                  { to: '/assistant', label: 'Discuss a finding with PatchPilot AI', icon: Bot },
                  { to: '/tasks', label: 'Review remediation tasks', icon: ListTodo },
                  { to: '/verification', label: 'Record verification evidence', icon: ShieldCheck },
                ].map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex items-center gap-2.5 text-sm text-fg-muted hover:text-accent group">
                    <Icon className="w-4 h-4 text-fg-subtle group-hover:text-accent" />
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </Card>
              {!isDemo && (
                <p className="text-xs text-fg-subtle px-1">
                  For presentations, a{' '}
                  <button onClick={demo.enable} className="text-accent underline underline-offset-2 cursor-pointer">
                    labelled demo dataset
                  </button>{' '}
                  can temporarily replace this view without touching backend data.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <AddFindingModal isOpen={addOpen} onClose={() => setAddOpen(false)} onCreated={() => reload()} />
    </div>
  );
}
