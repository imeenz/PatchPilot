import { DataSourceBadge, ErrorState } from '@/components/ui/StateViews';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { findingService } from '@/services/findingService';
import { verificationService } from '@/services/verificationService';
import type { FindingResponse, VerificationResponse, VerificationCreate } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { SubmitVerificationModal } from '@/features/verification/SubmitVerificationModal';

export function VerificationPage() {
  const [findings, setFindings] = useState<FindingResponse[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);
  const [verifications, setVerifications] = useState<VerificationResponse[]>([]);
  const [allVerifications, setAllVerifications] = useState<
    Array<VerificationResponse & { findingTitle?: string; findingCve?: string | null }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [feedFailures, setFeedFailures] = useState(0);
  const [selectedError, setSelectedError] = useState<unknown>(null);

  // Load workspace data
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await findingService.listFindings({ size: 50 });
        if (ignore) return;

        setFindings(res.data.items);
        setIsDemo(res.isDemo);
        setError(null);

        if (res.data.items.length > 0 && !selectedFindingId) {
          setSelectedFindingId(res.data.items[0].id);
        }

        const aggregated: Array<
          VerificationResponse & { findingTitle?: string; findingCve?: string | null }
        > = [];

        let failures = 0;
        for (const finding of res.data.items) {
          try {
            const vRes = await verificationService.listVerifications(finding.id);
            vRes.data.forEach((v) => {
              aggregated.push({
                ...v,
                findingTitle: finding.title,
                findingCve: finding.cve_id,
              });
            });
          } catch {
            failures++;
          }
        }

        if (!ignore) {
          setAllVerifications(aggregated);
          setFeedFailures(failures);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err);
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [selectedFindingId, reloadKey]);

  // Load verifications when selected finding changes
  useEffect(() => {
    if (selectedFindingId) {
      verificationService
        .listVerifications(selectedFindingId)
        .then((res) => {
          setVerifications(res.data);
          setSelectedError(null);
        })
        .catch((e) => {
          setVerifications([]);
          setSelectedError(e);
        });
    }
  }, [selectedFindingId]);

  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const handleRecordVerification = async (
    fId: number,
    verification: VerificationCreate
  ) => {
    const res = await verificationService.createVerification(fId, verification);
    setVerifications((prev) => [res.data, ...prev]);

    // Update aggregated feed
    const targetFinding = findings.find((f) => f.id === fId);
    setAllVerifications((prev) => [
      {
        ...res.data,
        findingTitle: targetFinding?.title,
        findingCve: targetFinding?.cve_id,
      },
      ...prev,
    ]);

    // If marked Verified Fixed, update local finding state
    if (res.data.verification_result === 'Verified Fixed') {
      setFindings((prev) =>
        prev.map((f) => (f.id === fId ? { ...f, is_verified_fixed: true } : f))
      );
    }
  };

  const selectedFinding = findings.find((f) => f.id === selectedFindingId);
  const verifiedCount = findings.filter((f) => f.is_verified_fixed).length;
  const unverifiedCount = findings.length - verifiedCount;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg">
            Fix Verification Center
          </h2>
          <p className="text-xs sm:text-sm text-fg-subtle mt-0.5">
            Independent proof, regression test outputs, and audit logs proving vulnerability remediation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSourceBadge isDemo={isDemo} />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-fg-subtle" />}
          >
            Refresh
          </Button>

          {selectedFinding && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Record Evidence
            </Button>
          )}
        </div>
      </div>

      {error != null && <ErrorState error={error} onRetry={handleRefresh} />}

      {/* Verification Architecture Banner */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-xs text-accent flex items-start gap-3 shadow-card">
        <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-sm">
            Strict Separation of Task Completion vs. Vulnerability Verification
          </span>
          <p className="leading-relaxed text-accent">
            A developer completing a task only signifies that source code was committed or an upgrade
            was staged. A vulnerability is <strong>never automatically marked as fixed</strong> by completing
            a task. In PatchPilot, resolution requires empirical evidence (e.g. clean re-scan report, automated
            unit/regression test logs, or manual QA proof) submitted with a <code>Verified Fixed</code> status.
          </p>
        </div>
      </div>

      {/* Verification Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider block">
              Verified Fixed Findings
            </span>
            <span className="text-2xl font-bold font-mono text-success">
              {verifiedCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-success/10 text-success border border-success/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider block">
              Unverified / Open Findings
            </span>
            <span className="text-2xl font-bold font-mono text-medium">
              {unverifiedCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-medium/10 text-medium border border-medium/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider block">
              Total Evidence Records
            </span>
            <span className="text-2xl font-bold font-mono text-accent">
              {allVerifications.length}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 text-accent border border-primary/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Main Workspace Layout: Finding Selector & Evidence Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Finding Selector */}
        <Card className="lg:col-span-1 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              Select Finding to Verify
            </h3>
            <span className="text-xs font-mono text-fg-subtle">
              {findings.length} findings
            </span>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {findings.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFindingId(f.id)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                  selectedFindingId === f.id
                    ? 'bg-primary/10 border-primary/30 text-fg shadow-card'
                    : 'bg-surface border-line text-fg-muted hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono font-semibold text-fg">
                    {f.cve_id || `ID #${f.id}`}
                  </span>
                  <Badge variant={f.severity} size="sm">
                    {f.severity}
                  </Badge>
                </div>
                <p className="font-medium line-clamp-1 text-fg">{f.title}</p>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-line text-[11px] text-fg-subtle">
                  <span>Score: {f.risk_score.toFixed(1)}</span>
                  {f.is_verified_fixed ? (
                    <span className="text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-medium">Pending</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Right Column: Finding Verification Details & History */}
        <div className="lg:col-span-2 space-y-4">
          {selectedFinding ? (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-fg">
                      {selectedFinding.cve_id || `Finding #${selectedFinding.id}`}
                    </span>
                    <Badge variant={selectedFinding.severity} size="sm" dot>
                      {selectedFinding.severity}
                    </Badge>
                    {selectedFinding.is_verified_fixed ? (
                      <Badge variant="verified fixed" size="sm">
                        Verified Fixed
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Fix Unverified
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-fg mt-1 line-clamp-1">
                    {selectedFinding.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/vulnerabilities/${selectedFinding.id}`}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent font-medium"
                  >
                    <span>View Finding</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSubmitModalOpen(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Submit Evidence
                  </Button>
                </div>
              </CardHeader>

              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                    Evidence Submissions for this Finding ({verifications.length})
                  </h4>
                  <span className="text-[11px] font-mono text-fg-subtle">
                    GET /api/v1/findings/{selectedFinding.id}/verification
                  </span>
                </div>

                {/* Evidence List */}
                {selectedError != null ? (
                  <ErrorState compact error={selectedError} title="Verification evidence could not be loaded" onRetry={handleRefresh} />
                ) : verifications.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-line rounded-xl">
                    <ShieldCheck className="w-8 h-8 text-fg-subtle mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-medium text-fg-muted">
                      No verification evidence recorded for this finding yet.
                    </p>
                    <p className="text-xs text-fg-subtle mt-1 max-w-sm mx-auto">
                      Once a remediation task is completed, record test results, PR links, or
                      scanner outputs here.
                    </p>
                    <div className="mt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsSubmitModalOpen(true)}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Submit First Evidence Record
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verifications.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-xl bg-surface-2 border border-line space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={v.verification_result} size="sm" dot>
                            {v.verification_result}
                          </Badge>
                          <span className="text-[11px] font-mono text-fg-subtle flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-fg leading-relaxed whitespace-pre-wrap">
                          {v.evidence_description}
                        </p>

                        {v.evidence_url && (
                          <div className="pt-1">
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
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card className="p-12 text-center text-fg-subtle">
              <p>Select a vulnerability finding to inspect verification records.</p>
            </Card>
          )}

          {/* Global Verification Audit Trail */}
          <Card>
            <CardHeader>
              <h3 className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                Recent Organization-wide Verification Activity
              </h3>
              <span className="text-xs font-mono text-fg-subtle">Audit Feed</span>
            </CardHeader>
            <CardBody className="p-0 divide-y divide-line">
              {feedFailures > 0 && (
                <p className="p-3 text-xs text-medium">
                  Evidence for {feedFailures} finding(s) could not be loaded, so this feed is incomplete.
                </p>
              )}
              {allVerifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-fg-subtle">
                  No organization-wide verification entries logged yet.
                </div>
              ) : (
                allVerifications.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="p-3.5 flex items-start gap-3 hover:bg-surface-2">
                    <div className="p-1.5 rounded-lg bg-success/10 text-success mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-fg truncate">
                          {entry.findingCve || entry.findingTitle || `Finding #${entry.finding_id}`}
                        </span>
                        <Badge variant={entry.verification_result} size="sm">
                          {entry.verification_result}
                        </Badge>
                      </div>
                      <p className="text-xs text-fg-muted line-clamp-1">
                        {entry.evidence_description}
                      </p>
                      <span className="text-[10px] font-mono text-fg-subtle">
                        {new Date(entry.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Record Verification Modal */}
      {selectedFinding && (
        <SubmitVerificationModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          findingId={selectedFinding.id}
          findingTitle={selectedFinding.title}
          onSubmit={handleRecordVerification}
        />
      )}
    </div>
  );
}
