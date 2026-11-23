import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, User, Clock, AlertCircle } from 'lucide-react';
import type { TaskResponse, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface TaskTableProps {
  tasks: TaskResponse[];
  onStatusChange: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: TaskStatus[] = ['Open', 'In Progress', 'Blocked', 'Completed'];

export function TaskTable({
  tasks,
  onStatusChange,
  isLoading = false,
}: TaskTableProps) {
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const handleStatusSelect = async (taskId: number, newStatus: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await onStatusChange(taskId, newStatus);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (tasks.length === 0 && !isLoading) {
    return (
      <Card className="p-8 text-center text-fg-subtle">
        <p className="text-xs sm:text-sm font-medium text-fg-muted">
          No remediation tasks found matching the filter criteria.
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
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Task Title & Description</th>
              <th className="py-3 px-4">Associated Finding</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Updated</th>
              <th className="py-3 px-4 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-xs">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-surface-2 transition-colors group"
              >
                {/* Status Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Badge variant={task.status} size="sm" dot>
                    {task.status}
                  </Badge>
                </td>

                {/* Title & Description */}
                <td className="py-3.5 px-4 max-w-sm">
                  <div className="font-semibold text-fg line-clamp-1">
                    {task.title}
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-fg-subtle line-clamp-2 mt-0.5 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </td>

                {/* Finding Link */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Link
                    to={`/vulnerabilities/${task.finding_id}`}
                    className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:text-accent font-medium"
                  >
                    <span>Finding #{task.finding_id}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </td>

                {/* Assignee */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {task.assignee ? (
                    <div className="flex items-center gap-1.5 text-fg-muted">
                      <User className="w-3.5 h-3.5 text-fg-subtle" />
                      <span>{task.assignee}</span>
                    </div>
                  ) : (
                    <span className="text-fg-subtle italic">Unassigned</span>
                  )}
                </td>

                {/* Timestamp */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-fg-subtle">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(task.updated_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </td>

                {/* Status Dropdown */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <select
                    disabled={updatingTaskId === task.id}
                    value={task.status}
                    onChange={(e) =>
                      handleStatusSelect(task.id, e.target.value as TaskStatus)
                    }
                    className="px-2 py-1 text-xs bg-surface border border-line rounded-md text-fg-muted focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Safety Notice Footer */}
      <div className="p-3 bg-medium/10 border-t border-medium/30 text-[11px] text-medium flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-medium shrink-0" />
        <span>
          <strong>Operational Policy:</strong> Marking a task as <em>Completed</em> indicates
          implementation is finished, but does <strong>not</strong> verify the vulnerability fix.
          Verification evidence must be submitted in the Verification workspace.
        </span>
      </div>
    </Card>
  );
}
