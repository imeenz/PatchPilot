import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { TaskCreate, TaskStatus } from '@/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  findingId: number;
  findingTitle?: string;
  onSubmit: (findingId: number, task: TaskCreate) => Promise<void>;
}

const STATUS_OPTIONS: TaskStatus[] = ['Open', 'In Progress', 'Blocked', 'Completed'];

export function CreateTaskModal({
  isOpen,
  onClose,
  findingId,
  findingTitle,
  onSubmit,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(findingId, {
        title: title.trim(),
        description: description.trim() || null,
        assignee: assignee.trim() || null,
        status,
      });
      setTitle('');
      setDescription('');
      setAssignee('');
      setStatus('Open');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Remediation Task"
      description={
        findingTitle
          ? `Create a remediation assignment for finding #${findingId}: "${findingTitle}"`
          : `Create a remediation assignment for finding #${findingId}`
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!title.trim()}
          >
            Create Task
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-critical/10 border border-critical/30 text-xs text-critical">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
            Task Title <span className="text-critical">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Upgrade dependency to safe version and run test suite"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-fg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
              Assignee
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="e.g., Alice (Backend Lead)"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-fg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-fg cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">
            Task Description / Instructions
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context, pull request requirements, or verification checklist..."
            className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-fg"
          />
        </div>
      </form>
    </Modal>
  );
}
