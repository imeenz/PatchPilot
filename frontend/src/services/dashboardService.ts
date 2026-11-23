import { apiClient } from './api';
import { demoApi, demoMode } from './demo/demoStore';
import type { Sourced } from './findingService';
import type { DashboardSummaryResponse } from '@/types';

export const dashboardService = {
  /** GET /api/v1/dashboard/summary */
  async getSummary(): Promise<Sourced<DashboardSummaryResponse>> {
    if (demoMode.isActive()) return { data: demoApi.getSummary(), isDemo: true };
    const data = await apiClient<DashboardSummaryResponse>('/dashboard/summary');
    return { data, isDemo: false };
  },
};
