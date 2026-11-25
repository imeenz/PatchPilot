/**
 * Isolated, opt-in demo dataset for academic presentations.
 *
 * Guarantees:
 *  - Disabled by default and never enabled automatically (state is in memory
 *    only, so a page refresh always returns to the live workspace).
 *  - Never written to, or mixed with, the real backend. While demo mode is on,
 *    the workspace services read/write this in-memory copy only.
 *  - Every record is labelled `source: "demo-dataset"`; they are sample records,
 *    not scanner results.
 */
import type {
  DashboardSummaryResponse,
  FindingDetailResponse,
  FindingListParams,
  FindingListResponse,
  FindingResponse,
  TaskCreate,
  TaskListParams,
  TaskResponse,
  TaskUpdate,
  VerificationCreate,
  VerificationResponse,
} from '@/types';
import { buildDemoFindings } from './demoDataset';
import { isVerifiedFixedFromLatest } from '../verificationState.mjs';

type Listener = () => void;

let active = false;
let findings: FindingDetailResponse[] = [];
let nextId = 9000;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const demoMode = {
  isActive(): boolean {
    return active;
  },
  enable() {
    findings = buildDemoFindings();
    nextId = 9000;
    active = true;
    emit();
  },
  disable() {
    active = false;
    findings = [];
    emit();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

const clone = <T>(v: T): T => structuredClone(v);

function toSummary(f: FindingDetailResponse): FindingResponse {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tasks, verifications, original_data, ...rest } = f;
  return { ...rest, tasks_count: tasks.length, is_verified_fixed: isVerifiedFixedFromLatest(verifications) };
}

function requireFinding(id: number): FindingDetailResponse {
  const f = findings.find((x) => x.id === id);
  if (!f) throw new Error(`Finding with ID ${id} not found in the demo dataset.`);
  return f;
}

export const demoApi = {
  listFindings(params: FindingListParams): FindingListResponse {
    let list = findings.map(toSummary);
    if (params.severity) list = list.filter((f) => f.severity.toLowerCase() === params.severity!.toLowerCase());
    if (params.source) list = list.filter((f) => f.source.toLowerCase() === params.source!.toLowerCase());
    if (params.has_cve !== undefined) list = list.filter((f) => (params.has_cve ? Boolean(f.cve_id) : !f.cve_id));
    if (params.query) {
      const q = params.query.toLowerCase();
      list = list.filter((f) =>
        [f.title, f.description, f.package_name, f.cve_id].some((v) => v?.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => b.risk_score - a.risk_score);
    const page = params.page || 1;
    const size = params.size || 20;
    const total = list.length;
    return {
      items: clone(list.slice((page - 1) * size, page * size)),
      total,
      page,
      size,
      total_pages: Math.max(1, Math.ceil(total / size)),
    };
  },

  getFinding(id: number): FindingDetailResponse {
    const f = requireFinding(id);
    return clone({ ...f, ...toSummary(f), tasks: f.tasks, verifications: f.verifications });
  },

  listTasks(params: TaskListParams): TaskResponse[] {
    let tasks = findings.flatMap((f) => f.tasks);
    if (params.finding_id) tasks = tasks.filter((t) => t.finding_id === params.finding_id);
    if (params.status) tasks = tasks.filter((t) => t.status.toLowerCase() === params.status!.toLowerCase());
    if (params.assignee) {
      const a = params.assignee.toLowerCase();
      tasks = tasks.filter((t) => t.assignee?.toLowerCase().includes(a));
    }
    return clone(tasks);
  },

  getTask(id: number): TaskResponse {
    const t = findings.flatMap((f) => f.tasks).find((x) => x.id === id);
    if (!t) throw new Error(`Task with ID ${id} not found in the demo dataset.`);
    return clone(t);
  },

  createTask(findingId: number, input: TaskCreate): TaskResponse {
    const f = requireFinding(findingId);
    const now = new Date().toISOString();
    const task: TaskResponse = {
      id: nextId++,
      finding_id: findingId,
      title: input.title,
      description: input.description ?? null,
      assignee: input.assignee ?? null,
      status: input.status ?? 'Open',
      created_at: now,
      updated_at: now,
    };
    f.tasks.unshift(task);
    return clone(task);
  },

  updateTask(id: number, update: TaskUpdate): TaskResponse {
    for (const f of findings) {
      const idx = f.tasks.findIndex((t) => t.id === id);
      if (idx !== -1) {
        const cur = f.tasks[idx];
        const next: TaskResponse = {
          ...cur,
          ...Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined)),
          updated_at: new Date().toISOString(),
        };
        f.tasks[idx] = next;
        return clone(next);
      }
    }
    throw new Error(`Task with ID ${id} not found in the demo dataset.`);
  },

  listVerifications(findingId: number): VerificationResponse[] {
    return clone(requireFinding(findingId).verifications);
  },

  createVerification(findingId: number, input: VerificationCreate): VerificationResponse {
    const f = requireFinding(findingId);
    const v: VerificationResponse = {
      id: nextId++,
      finding_id: findingId,
      task_id: input.task_id ?? null,
      evidence_description: input.evidence_description,
      evidence_url: input.evidence_url ?? null,
      verification_result: input.verification_result ?? 'Verified Fixed',
      created_at: new Date().toISOString(),
    };
    f.verifications.unshift(v);
    return clone(v);
  },

  /** Computed from the demo records — never a hardcoded set of numbers. */
  getSummary(): DashboardSummaryResponse {
    const severity_breakdown: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0 };
    const task_status_breakdown: Record<string, number> = { Open: 0, 'In Progress': 0, Blocked: 0, Completed: 0 };
    const verification_breakdown: Record<string, number> = {
      'Verified Fixed': 0,
      Failed: 0,
      'Partially Fixed': 0,
      Inconclusive: 0,
    };
    let fixed = 0;
    for (const f of findings) {
      severity_breakdown[f.severity] = (severity_breakdown[f.severity] ?? 0) + 1;
      f.tasks.forEach((t) => (task_status_breakdown[t.status] = (task_status_breakdown[t.status] ?? 0) + 1));
      f.verifications.forEach(
        (v) => (verification_breakdown[v.verification_result] = (verification_breakdown[v.verification_result] ?? 0) + 1)
      );
      if (isVerifiedFixedFromLatest(f.verifications)) fixed++;
    }
    const total = findings.length;
    return {
      total_findings: total,
      severity_breakdown,
      average_risk_score: total ? Math.round((findings.reduce((s, f) => s + f.risk_score, 0) / total) * 10) / 10 : 0,
      total_tasks: findings.reduce((s, f) => s + f.tasks.length, 0),
      task_status_breakdown,
      total_verifications: findings.reduce((s, f) => s + f.verifications.length, 0),
      verification_breakdown,
      verified_fixed_findings: fixed,
      open_findings: total - fixed,
    };
  },
};
