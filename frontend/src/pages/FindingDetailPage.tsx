import { DataSourceBadge, ErrorState } from '@/components/ui/StateViews';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Package,
  FileCode2,
  Calendar,
  Layers,
  Plus,
  RefreshCw,
  AlertTriangle,
  Bot,
} from 'lucide-react';
import { findingService } from '@/services/findingService';
import { taskService } from '@/services/taskService';
import { verificationService } from '@/services/verificationService';
import type {
  FindingDetailResponse,
  RemediationGuidanceResponse,
  TaskCreate,
  TaskStatus,
  VerificationCreate,
} from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { RemediationGuidanceCard } from '@/features/findings/RemediationGuidanceCard';
import { CreateTaskModal } from '@/features/tasks/CreateTaskModal';
import { TaskTable } from '@/features/tasks/TaskTable';
import { SubmitVerificationModal } from '@/features/verification/SubmitVerificationModal';
import { VerificationList } from '@/features/verification/VerificationList';

export function FindingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const findingId = Number(id);

  const [finding, setFinding] = useState<FindingDetailResponse | null>(null);
  const [guidance, setGuidance] = useState<RemediationGuidanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [verificationRefreshError, setVerificationRefreshError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  useEffect(() => {
    if (!findingId || isNaN(findingId)) {
      return;
    }

    let ignore = false;

    findingService
      .getFinding(findingId)
      .then((res) => {
        if (!ignore) {
          setFinding(res.data);
          setIsDemo(res.isDemo);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [findingId, reloadKey]);

  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  // Generate AI remediation guidance
  const handleGenerateGuidance = async () => {
    if (!findingId) return;
    setIsGuidanceLoading(true);
    setGuidanceError(null);
    try {
      const res = await findingService.getRemediationGuidance(findingId);
      setGuidance(res.data);
    } catch (err) {
      setGuidanceError(
        err instanceof Error ? err.message : 'Failed to generate remediation guidance'
      );
    } finally {
      setIsGuidanceLoading(false);
    }
  };

  // Create task for this finding
  const handleCreateTask = async (fId: number, task: TaskCreate) => {
    const res = await taskService.createTask(fId, task);
    setFinding((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: [res.data, ...prev.tasks],
        tasks_count: prev.tasks.length + 1,
      };
    });
  };

  // Update task status
  const handleTaskStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const res = await taskService.updateTask(taskId, { status: newStatus });
    setFinding((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? res.data : t)),
      };
    });
  };

  // Record verification evidence
  const handleRecordVerification = async (fId: number, verification: VerificationCreate) => {
    const created = await verificationService.createVerification(fId, verification);
    setFinding((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        verifications: [created.data, ...prev.verifications],
        // Do not retain an older fixed state when newer evidence contradicts it.
        is_verified_fixed: created.data.verification_result === 'Verified Fixed',
      };
    });
    try {
      const refreshed = await findingService.getFinding(fId);
      setFinding(refreshed.data);
      setIsDemo(refreshed.isDemo);
      setVerificationRefreshError(null);
    } catch {
      setVerificationRefreshError('Evidence was recorded, but the latest finding status could not be refreshed. The displayed status reflects the evidence just submitted.');
    }
  };

  if (!findingId || isNaN(findingId)) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto p-8 space-y-4">
        <div className="p-6 rounded-2xl bg-critical/10 border border-critical/30 text-critical space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-critical" />
            <h3 className="font-semibold text-sm">Invalid Finding ID Parameter</h3>
          </div>
          <Link to="/vulnerabilities">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 max-w-6xl w-full mx-auto p-8 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-mono text-fg-subtle">
          Loading finding #{findingId} from GET /api/v1/findings/{findingId}...
        </p>
      </div>
    );
  }

  if (error != null || !finding) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8 space-y-4">
        <ErrorState
          error={error ?? new Error('Finding not found.')}
          title="Unable to load finding details"
          onRetry={handleRefresh}
        />
        <div>
          <Link to="/vulnerabilities">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/vulnerabilities"
          className="inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vulnerabilities Catalog</span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <DataSourceBadge isDemo={isDemo} />
          {!isDemo && (
            <Link
              to={`/assistant?finding=${finding.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-primary text-on-primary hover:bg-primary-hover"
            >
              <Bot className="w-3.5 h-3.5" />
              Ask PatchPilot AI
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reload
          </Button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-surface border border-line rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={finding.severity} size="md" dot>
                {finding.severity}
              </Badge>

              {finding.cve_id && (
                <span className="font-mono text-xs font-bold text-fg bg-surface-2 border border-line px-2 py-0.5 rounded">
                  {finding.cve_id}
                </span>
              )}

              {finding.is_verified_fixed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span>Verified Fixed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-medium/10 text-medium border border-medium/30 text-xs font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-medium" />
                  <span>Fix Pending Verification</span>
                </span>
              )}

              <span className="text-[11px] font-mono text-fg-subtle">
                Finding ID: #{finding.id}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
              {finding.title}
            </h1>
            <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
              {finding.description}
            </p>
          </div>

          {/* Risk Score Dial Card */}
          <div className="p-4 rounded-xl bg-surface-2 border border-line text-center min-w-[140px] shrink-0 self-start md:self-auto">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle font-mono block">
              Calculated Risk Score
            </span>
            <div className="text-3xl font-bold font-mono text-critical mt-1">
              {finding.risk_score.toFixed(1)}
            </div>
            <span className="text-[10px] text-fg-subtle font-mono">scale of 0.0 – 100.0</span>
          </div>
        </div>

        {/* Technical Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-line text-xs">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>Package & Version</span>
            </span>
            <p className="font-mono text-fg font-medium">
              {finding.package_name || 'N/A'}{' '}
              {finding.installed_version && (
                <span className="text-fg-subtle">({finding.installed_version})</span>
              )}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-success" />
              <span>Fixed Version</span>
            </span>
            <p className="font-mono text-fg font-medium">
              {finding.fixed_version ? (
                <span className="text-success bg-success/10 px-1.5 py-0.5 rounded border border-success/30">
                  &gt;= {finding.fixed_version}
                </span>
              ) : (
                <span className="text-fg-subtle italic">No upstream fix</span>
              )}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Detection Source</span>
            </span>
            <p className="font-mono text-fg uppercase font-medium">
              {finding.source}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Detected At</span>
            </span>
            <p className="font-mono text-fg font-medium">
              {new Date(finding.created_at).toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {finding.file_path && (
          <div className="p-2.5 rounded-lg bg-surface-2 border border-line text-xs font-mono text-fg-muted flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-fg-subtle shrink-0" />
            <span className="text-fg-subtle font-sans">Vulnerable Path:</span>
            <span className="text-fg font-semibold">{finding.file_path}</span>
          </div>
        )}
      </div>

      {/* AI Remediation Guidance Section */}
      <RemediationGuidanceCard
        guidance={guidance}
        isLoading={isGuidanceLoading}
        error={guidanceError}
        onGenerate={handleGenerateGuidance}
      />

      {/* Remediation Tasks Section */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-fg">
              Assigned Remediation Tasks ({finding.tasks.length})
            </h3>
            <p className="text-xs text-fg-subtle">
              Developer implementation assignments created via POST /api/v1/findings/{finding.id}/tasks
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Task
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <TaskTable
            tasks={finding.tasks}
            onStatusChange={handleTaskStatusChange}
          />
        </CardBody>
      </Card>

      {/* Verification Evidence Section */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-fg">
              Fix Verification Trail ({finding.verifications.length})
            </h3>
            <p className="text-xs text-fg-subtle">
              Independent test evidence recorded via POST /api/v1/findings/{finding.id}/verification
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsVerificationModalOpen(true)}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-success" />}
          >
            Submit Evidence
          </Button>
        </CardHeader>
        <CardBody>
          {verificationRefreshError && (
            <p role="status" className="mb-3 rounded-lg border border-medium/30 bg-medium/10 p-3 text-xs text-fg-muted">
              {verificationRefreshError}
            </p>
          )}
          <VerificationList verifications={finding.verifications} />
        </CardBody>
      </Card>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        findingId={finding.id}
        findingTitle={finding.title}
        onSubmit={handleCreateTask}
      />

      <SubmitVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        findingId={finding.id}
        findingTitle={finding.title}
        tasks={finding.tasks}
        onSubmit={handleRecordVerification}
      />
    </div>
  );
}
