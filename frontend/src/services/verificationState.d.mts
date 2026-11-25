export interface VerificationStateEvidence {
  id: number;
  verification_result: string;
}

export interface RefreshedFindingVerificationState {
  id: number;
  is_verified_fixed: boolean;
}

export function isVerifiedFixedFromLatest(verifications: VerificationStateEvidence[]): boolean;
export function applyRefreshedVerificationState<T extends { id: number; is_verified_fixed?: boolean }>(
  findings: T[],
  refreshedFinding: RefreshedFindingVerificationState,
): T[];
