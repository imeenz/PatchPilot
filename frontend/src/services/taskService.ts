import { apiClient } from './api';
import { demoApi, demoMode } from './demo/demoStore';
import type { Sourced } from './findingService';
import type { TaskCreate, TaskListParams, TaskResponse, TaskUpdate } from '@/types';

export const taskService = {
  /** GET /api/v1/tasks */
  async listTasks(params: TaskListParams = {}): Promise<Sourced<TaskResponse[]>> {
    if (demoMode.isActive()) return { data: demoApi.listTasks(params), isDemo: true };
    const data = await apiClient<TaskResponse[]>('/tasks', {
      params: { finding_id: params.finding_id, status: params.status, assignee: params.assignee },
    });
    return { data, isDemo: false };
  },

  /** GET /api/v1/tasks/{id} */
  async getTask(id: number): Promise<Sourced<TaskResponse>> {
    if (demoMode.isActive()) return { data: demoApi.getTask(id), isDemo: true };
    const data = await apiClient<TaskResponse>(`/tasks/${id}`);
    return { data, isDemo: false };
  },

  /** POST /api/v1/findings/{id}/tasks */
  async createTask(findingId: number, task: TaskCreate): Promise<Sourced<TaskResponse>> {
    if (demoMode.isActive()) return { data: demoApi.createTask(findingId, task), isDemo: true };
    const data = await apiClient<TaskResponse>(`/findings/${findingId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return { data, isDemo: false };
  },

  /** PATCH /api/v1/tasks/{id} */
  async updateTask(id: number, update: TaskUpdate): Promise<Sourced<TaskResponse>> {
    if (demoMode.isActive()) return { data: demoApi.updateTask(id, update), isDemo: true };
    const data = await apiClient<TaskResponse>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
    return { data, isDemo: false };
  },
};
