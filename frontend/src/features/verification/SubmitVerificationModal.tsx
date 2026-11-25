import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { VerificationCreate, VerificationResult, TaskResponse } from '@/types';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface SubmitVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  findingId: number;
  findingTitle?: string;
  tasks?: TaskResponse[];
  onSubmit: (findingId: number, verification: VerificationCreate) => Promise<void>;
}

const RESULT_OPTIONS: VerificationResult[] = [
  'Verified Fixed',
  'Partially Fixed',
  'Failed',
  'Inconclusive',
];

export function SubmitVerificationModal({
  isOpen,
  onClose,
  findingId,
  findingTitle,
  tasks = [],
  onSubmit,
}: SubmitVerificationModalProps) {
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult>('Verified Fixed');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceDescription.trim()) {
      setError('Evidence description is required to substantiate the verification.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(findingId, {
        task_id: selectedTaskId ? Number(selectedTaskId) : null,
        evidence_description: evidenceDescription.trim(),
        evidence_url: evidenceUrl.trim() || null,
        verification_result: verificationResult,
      });
      setEvidenceDescription('');
      setEvidenceUrl('');
      setSelectedTaskId('');
      setVerificationResult('Verified Fixed');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record verification evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Vulnerability Verification Evidence"
      description={
        findingTitle
          ? `Submit formal test evidence to verify finding #${findingId}: "${findingTitle}"`
          : `Submit formal test evidence to verify finding #${findingId}`
      }
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!evidenceDescription.trim()}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Record Verification
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Verification Boundary Notice */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-xs text-accent flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Independent Verification Policy:</span>
            <p>
              Recording evidence with result <strong>Verified Fixed</strong> is what formally
              marks a finding as resolved. Completing tasks alone does not substitute for empirical
              verification evidence.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-critical/10 border border-critical/30 text-xs text-critical">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Verification Result */}
          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
              Verification Result <span className="text-critical">*</span>
            </label>
            <select
              value={verificationResult}
              onChange={(e) => setVerificationResult(e.target.value as VerificationResult)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-fg cursor-pointer"
            >
              {RESULT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Associated Task */}
          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
              Associated Task (Optional)
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-fg cursor-pointer"
            >
              <option value="">No specific task associated</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  Task #{t.id} — {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Evidence Description */}
        <div>
          <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
            Evidence Description <span className="text-critical">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={evidenceDescription}
            onChange={(e) => setEvidenceDescription(e.target.value)}
            placeholder="Explain the manual test performed, automated scanner output, or security regression test result proving the fix..."
            className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-fg"
          />
        </div>

        {/* Evidence URL */}
        <div>
          <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
            Evidence Link / Reference URL (Optional)
          </label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://github.com/org/repo/pull/123 or CI pipeline run URL"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-fg font-mono"
          />
        </div>
      </form>
    </Modal>
  );
}
