import { DataSourceBadge, ErrorState } from '@/components/ui/StateViews';
import { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  User,
  AlertCircle,
} from 'lucide-react';
import { taskService } from '@/services/taskService';
import { findingService } from '@/services/findingService';
import type { TaskResponse, TaskStatus, TaskCreate, FindingResponse } from '@/types';
import { TaskTable } from '@/features/tasks/TaskTable';
import { CreateTaskModal } from '@/features/tasks/CreateTaskModal';
import { Button } from '@/components/ui/Button';

const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Blocked', 'Completed'];

export function TasksPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // For the create task modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableFindings, setAvailableFindings] = useState<FindingResponse[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    taskService
      .listTasks({
        status: statusFilter === 'All' ? undefined : statusFilter,
        assignee: assigneeFilter.trim() || undefined,
      })
      .then((res) => {
        if (!ignore) {
          setTasks(res.data);
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
  }, [statusFilter, assigneeFilter, reloadKey]);

  // Load findings so the user can easily choose one when creating a task
  useEffect(() => {
    findingService
      .listFindings({ size: 50 })
      .then((res) => {
        setAvailableFindings(res.data.items);
        if (res.data.items.length > 0) {
          setSelectedFindingId(res.data.items[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const res = await taskService.updateTask(taskId, { status: newStatus });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data : t)));
  };

  const handleCreateTask = async (fId: number, task: TaskCreate) => {
    const res = await taskService.createTask(fId, task);
    setTasks((prev) => [res.data, ...prev]);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg">
            Remediation Tasks
          </h2>
          <p className="text-xs sm:text-sm text-fg-subtle mt-0.5">
            Track developer remediation workflows, assigned fix implementations, and review progress.
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

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Safety Notice Callout */}
      <div className="p-3.5 rounded-xl bg-medium/10 border border-medium/30 text-xs text-medium flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-medium shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold">Security Operations Boundary:</span>
          <p>
            A completed remediation task indicates that a developer has written and committed
            a fix. In accordance with safety policies, this does <strong>not</strong> automatically mark
            the underlying vulnerability as verified. You must independently record test or scanner
            evidence in the Verification workspace.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface border border-line rounded-xl p-3.5 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mr-1 hidden sm:inline">
            Status:
          </span>
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setIsLoading(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-primary text-white shadow-card'
                  : 'bg-surface-2 text-fg-muted hover:bg-surface-2'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Assignee Search */}
        <div className="relative w-full sm:w-64">
          <User className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={assigneeFilter}
            onChange={(e) => {
              setAssigneeFilter(e.target.value);
              setIsLoading(true);
            }}
            placeholder="Filter by assignee name..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-2 border border-line rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Error state */}
      {error != null && <ErrorState error={error} onRetry={handleRefresh} />}

      {/* Loading state */}
      {isLoading && tasks.length === 0 && (
        <div className="p-16 text-center space-y-3 bg-surface border border-line rounded-xl">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-fg-subtle font-mono">
            Fetching remediation tasks from GET /api/v1/tasks...
          </p>
        </div>
      )}

      {/* Tasks Table */}
      {(!isLoading || tasks.length > 0) && !error && (
        <TaskTable
          tasks={tasks}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
        />
      )}

      {/* Create Task Modal */}
      {selectedFindingId && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          findingId={selectedFindingId}
          findingTitle={
            availableFindings.find((f) => f.id === selectedFindingId)?.title ||
            `Finding #${selectedFindingId}`
          }
          onSubmit={handleCreateTask}
        />
      )}
    </div>
  );
}
