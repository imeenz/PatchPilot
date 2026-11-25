import { apiClient } from './api';
import { demoApi, demoMode } from './demo/demoStore';
import type { Sourced } from './findingService';
import type { VerificationCreate, VerificationResponse } from '@/types';

export const verificationService = {
  /** GET /api/v1/findings/{id}/verification */
  async listVerifications(findingId: number): Promise<Sourced<VerificationResponse[]>> {
    if (demoMode.isActive()) return { data: demoApi.listVerifications(findingId), isDemo: true };
    const data = await apiClient<VerificationResponse[]>(`/findings/${findingId}/verification`);
    return { data, isDemo: false };
  },

  /**
   * POST /api/v1/findings/{id}/verification
   * Verification status is only ever changed by recording evidence through this
   * endpoint — the AI assistant never marks a finding as verified.
   */
  async createVerification(
    findingId: number,
    verification: VerificationCreate
  ): Promise<Sourced<VerificationResponse>> {
    if (demoMode.isActive()) return { data: demoApi.createVerification(findingId, verification), isDemo: true };
    const data = await apiClient<VerificationResponse>(`/findings/${findingId}/verification`, {
      method: 'POST',
      body: JSON.stringify(verification),
    });
    return { data, isDemo: false };
  },
};
