import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/StateViews';
import { findingService } from '@/services/findingService';
import type { FindingResponse } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (finding: FindingResponse) => void;
}

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

const EMPTY = {
  title: '',
  description: '',
  severity: 'High',
  cve_id: '',
  package_name: '',
  installed_version: '',
  fixed_version: '',
  file_path: '',
};

const input =
  'w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary/60';

/**
 * Manual finding entry. The backend has no dedicated "create finding" endpoint,
 * so this sends a single record to POST /api/v1/findings/import (which accepts
 * one object) and shows the backend's own validation result.
 */
export function AddFindingModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { title: form.title.trim(), description: form.description.trim(), severity: form.severity, source: 'manual' };
      (['cve_id', 'package_name', 'installed_version', 'fixed_version', 'file_path'] as const).forEach((k) => {
        if (form[k].trim()) payload[k] = form[k].trim();
      });
      const res = await findingService.importFindings([payload]);
      if (res.imported_count === 1 && res.imported_findings[0]) {
        onCreated(res.imported_findings[0]);
        setForm(EMPTY);
        onClose();
      } else {
        setError(new Error(res.rejected_findings[0]?.reason ?? 'The backend did not import the finding.'));
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a finding"
      description="Record a vulnerability found manually or by a tool PatchPilot cannot import yet."
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-finding-form" isLoading={isSaving} disabled={!form.title.trim() || !form.description.trim()}>
            Add finding
          </Button>
        </>
      }
    >
      <form id="add-finding-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2 space-y-1">
          <span className="text-xs font-medium text-fg-muted">Title *</span>
          <input className={input} value={form.title} onChange={(e) => set('title')(e.target.value)} maxLength={255} required />
        </label>
        <label className="sm:col-span-2 space-y-1">
          <span className="text-xs font-medium text-fg-muted">Description *</span>
          <textarea className={input} rows={4} value={form.description} onChange={(e) => set('description')(e.target.value)} required />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-fg-muted">Severity *</span>
          <select className={input} value={form.severity} onChange={(e) => set('severity')(e.target.value)}>
            {SEVERITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-fg-muted">CVE ID</span>
          <input className={input} value={form.cve_id} onChange={(e) => set('cve_id')(e.target.value)} placeholder="CVE-YYYY-NNNNN" maxLength={50} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-fg-muted">Package</span>
          <input className={input} value={form.package_name} onChange={(e) => set('package_name')(e.target.value)} maxLength={255} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-fg-muted">File / location</span>
          <input className={input} value={form.file_path} onChange={(e) => set('file_path')(e.target.value)} maxLength={1000} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-fg-muted">Installed version</span>
          <input className={input} value={form.installed_version} onChange={(e) => set('installed_version')(e.target.value)} maxLength={100} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-fg-muted">Fixed version</span>
          <input className={input} value={form.fixed_version} onChange={(e) => set('fixed_version')(e.target.value)} maxLength={100} />
        </label>
        {error != null && (
          <div className="sm:col-span-2">
            <ErrorState error={error} title="The finding was not added" compact />
          </div>
        )}
      </form>
    </Modal>
  );
}
