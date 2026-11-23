import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { AlertTriangle, CheckCircle2, FileJson, FlaskConical, HelpCircle, UploadCloud, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/StateViews';
import { findingService } from '@/services/findingService';
import { useDemoMode } from '@/hooks/useDemoMode';
import type { FindingImportResponse } from '@/types';
import { MAX_REPORT_BYTES, parseReportText } from '@/features/import/scannerParsers';
import type { EntryStatus, ParsedReport } from '@/features/import/scannerParsers';
import { ImportResultCard } from './ImportResultCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful backend import. */
  onImported: (result: FindingImportResponse, fileName: string, formatLabel: string) => void;
}

type Step =
  | { kind: 'select'; error?: string }
  | { kind: 'preview'; fileName: string; report: ParsedReport }
  | { kind: 'importing'; fileName: string; report: ParsedReport }
  | { kind: 'done'; fileName: string; report: ParsedReport; result: FindingImportResponse }
  | { kind: 'failed'; fileName: string; report: ParsedReport; error: unknown };

const STATUS_META: Record<EntryStatus, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  valid: { label: 'Valid', icon: CheckCircle2, cls: 'text-success' },
  unsupported: { label: 'Unsupported', icon: HelpCircle, cls: 'text-medium' },
  invalid: { label: 'Invalid', icon: XCircle, cls: 'text-critical' },
};

export function ReportImportModal({ isOpen, onClose, onImported }: Props) {
  const demo = useDemoMode();
  const [step, setStep] = useState<Step>({ kind: 'select' });
  const [filter, setFilter] = useState<EntryStatus | 'all'>('all');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    if (step.kind === 'importing') return;
    setStep({ kind: 'select' });
    setFilter('all');
    onClose();
  };

  const readFile = async (file: File) => {
    if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
      setStep({ kind: 'select', error: `"${file.name}" is not a .json file. Export the report from your scanner in JSON format.` });
      return;
    }
    if (file.size > MAX_REPORT_BYTES) {
      setStep({ kind: 'select', error: `The file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum supported size is 10 MB.` });
      return;
    }
    const text = await file.text();
    const outcome = parseReportText(text);
    if (!outcome.ok) {
      setStep({ kind: 'select', error: outcome.error });
      return;
    }
    setFilter('all');
    setStep({ kind: 'preview', fileName: file.name, report: outcome.report });
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void readFile(f);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void readFile(f);
  };

  const doImport = async () => {
    if (step.kind !== 'preview' && step.kind !== 'failed') return;
    const { fileName, report } = step;
    const payloads = report.entries.filter((e) => e.status === 'valid' && e.payload).map((e) => e.payload!);
    setStep({ kind: 'importing', fileName, report });
    try {
      const result = await findingService.importFindings(payloads);
      setStep({ kind: 'done', fileName, report, result });
      onImported(result, fileName, report.formatLabel);
    } catch (error) {
      setStep({ kind: 'failed', fileName, report, error });
    }
  };

  const report = step.kind === 'select' ? null : step.report;
  const visible = useMemo(
    () => (report ? report.entries.filter((e) => filter === 'all' || e.status === filter) : []),
    [report, filter]
  );

  const footer =
    step.kind === 'select' ? (
      <Button variant="ghost" onClick={close}>
        Cancel
      </Button>
    ) : step.kind === 'done' ? (
      <Button onClick={close}>Close</Button>
    ) : (
      <>
        <Button variant="ghost" onClick={() => setStep({ kind: 'select' })} disabled={step.kind === 'importing'}>
          Choose another file
        </Button>
        <Button
          onClick={doImport}
          isLoading={step.kind === 'importing'}
          disabled={!report || report.counts.valid === 0 || demo.isActive}
        >
          Import {report?.counts.valid ?? 0} valid finding{report?.counts.valid === 1 ? '' : 's'}
        </Button>
      </>
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Import a scanner report"
      description="Supported: Trivy JSON, OWASP ZAP JSON, or a PatchPilot findings array. Nothing is imported until you confirm."
      maxWidth="xl"
      footer={footer}
    >
      {demo.isActive && (
        <div className="mb-4 flex gap-3 rounded-lg border border-medium/35 bg-medium/10 p-3 text-xs text-fg-muted">
          <FlaskConical className="w-4 h-4 text-medium shrink-0" />
          <p>The demo dataset is active. You can preview a report, but importing is disabled so sample and real data are never mixed.</p>
        </div>
      )}

      {step.kind === 'select' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/10' : 'border-line-strong bg-surface-2/40'
            }`}
          >
            <UploadCloud className="w-8 h-8 mx-auto text-accent" />
            <p className="mt-3 text-sm text-fg">Drag a JSON report here, or</p>
            <Button className="mt-3" variant="secondary" onClick={() => inputRef.current?.click()} leftIcon={<FileJson className="w-4 h-4" />}>
              Choose file
            </Button>
            <input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" onChange={onFileChange} aria-label="Report file" />
            <p className="mt-3 text-xs text-fg-subtle">Max 10 MB. The file is parsed in your browser for preview first.</p>
          </div>
          {step.error && (
            <div role="alert" className="flex gap-2.5 rounded-lg border border-critical/30 bg-critical/8 p-3 text-sm text-fg">
              <AlertTriangle className="w-4 h-4 text-critical shrink-0 mt-0.5" />
              <span>{step.error}</span>
            </div>
          )}
          <div className="text-xs text-fg-subtle space-y-1">
            <p>
              <strong className="text-fg-muted">Trivy:</strong> <code className="font-mono">trivy image --format json -o report.json &lt;image&gt;</code>
            </p>
            <p>
              <strong className="text-fg-muted">OWASP ZAP:</strong> Report → Generate Report → Traditional JSON.
            </p>
            <p>Reports are untrusted input: they are parsed as data only, and HTML inside them is shown as plain text.</p>
          </div>
        </div>
      )}

      {report && step.kind !== 'select' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <FileJson className="w-4 h-4 text-accent" />
            <span className="font-medium text-fg">{step.fileName}</span>
            <Badge variant="accent" size="sm">
              {report.formatLabel}
            </Badge>
            {report.subject && <span className="text-xs text-fg-subtle font-mono truncate max-w-xs">· {report.subject}</span>}
          </div>

          {step.kind === 'done' ? (
            <ImportResultCard result={step.result} fileName={step.fileName} format={report.formatLabel} />
          ) : (
            <>
              {step.kind === 'failed' && <ErrorState error={step.error} title="Import failed — nothing was confirmed by the backend" onRetry={doImport} compact />}

              <div role="tablist" aria-label="Filter entries" className="flex flex-wrap gap-1.5">
                {(['all', 'valid', 'unsupported', 'invalid'] as const).map((k) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={filter === k}
                    onClick={() => setFilter(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      filter === k ? 'bg-primary/15 border-primary/40 text-accent' : 'border-line text-fg-muted hover:bg-surface-2'
                    }`}
                  >
                    {k === 'all' ? `All (${report.entries.length})` : `${STATUS_META[k].label} (${report.counts[k]})`}
                  </button>
                ))}
              </div>

              <p className="text-xs text-fg-subtle">
                Only <strong className="text-fg-muted">valid</strong> entries are sent. Unsupported and invalid entries are listed with the reason, and nothing is
                dropped silently. The backend validates again and reports what it actually stored.
              </p>

              <div className="rounded-lg border border-line overflow-hidden">
                <div className="max-h-[45vh] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-2 sticky top-0">
                      <tr className="text-left text-fg-subtle">
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Severity</th>
                        <th className="px-3 py-2 font-medium">Entry</th>
                        <th className="px-3 py-2 font-medium hidden md:table-cell">Location in report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {visible.map((e) => {
                        const meta = STATUS_META[e.status];
                        const Icon = meta.icon;
                        return (
                          <tr key={e.index} className="align-top">
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 ${meta.cls}`}>
                                <Icon className="w-3.5 h-3.5" />
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {e.severity ? (
                                <Badge variant={e.payload?.severity ?? 'neutral'} size="sm">
                                  {e.payload?.severity ?? e.severity}
                                </Badge>
                              ) : (
                                <span className="text-fg-subtle">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 min-w-[14rem]">
                              <p className="text-fg">{e.label}</p>
                              {e.payload && (
                                <p className="font-mono text-[11px] text-fg-subtle">
                                  {[e.payload.cve_id, e.payload.package_name, e.payload.installed_version && `${e.payload.installed_version} → ${e.payload.fixed_version ?? 'no fix listed'}`]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              )}
                              {e.reason && <p className="mt-0.5 text-fg-muted">{e.reason}</p>}
                              {e.warnings.map((w) => (
                                <p key={w} className="mt-0.5 text-medium">
                                  ⚠ {w}
                                </p>
                              ))}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-fg-subtle hidden md:table-cell">{e.location}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
