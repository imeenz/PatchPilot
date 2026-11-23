/**
 * PatchPilot Domain Types
 * Matching exact schemas from backend Pydantic models (FastAPI)
 */

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'Completed';

export type VerificationResult =
  | 'Verified Fixed'
  | 'Failed'
  | 'Partially Fixed'
  | 'Inconclusive';

// ==========================================
// Findings Schemas (app/schemas/finding.py)
// ==========================================

export interface FindingBase {
  title: string;
  description: string;
  severity: SeverityLevel | string;
  cve_id: string | null;
  package_name: string | null;
  installed_version: string | null;
  fixed_version: string | null;
  source: string;
  file_path: string | null;
}

export interface FindingResponse extends FindingBase {
  id: number;
  risk_score: number;
  created_at: string;
  tasks_count?: number;
  is_verified_fixed?: boolean;
}

export interface FindingDetailResponse extends FindingResponse {
  original_data?: unknown;
  tasks: TaskResponse[];
  verifications: VerificationResponse[];
}

export interface FindingListResponse {
  items: FindingResponse[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface FindingListParams {
  page?: number;
  size?: number;
  severity?: string;
  source?: string;
  has_cve?: boolean;
  query?: string;
}

// ==========================================
// Remediation Schemas (app/schemas/remediation.py)
// ==========================================

export interface RemediationGuidanceResponse {
  finding_id: number;
  title: string;
  severity: string;
  risk_score: number;
  vulnerability_explanation: string;
  potential_impact: string;
  recommended_remediation_steps: string[];
  compatibility_considerations: string;
  verification_steps: string[];
  uncertainty_or_missing_information: string;
  is_fallback: boolean;
  provider: string;
  model: string | null;
  disclaimer: string;
}

// ==========================================
// Task Schemas (app/schemas/task.py)
// ==========================================

export interface TaskBase {
  title: string;
  description?: string | null;
  assignee?: string | null;
  status: TaskStatus | string;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  assignee?: string | null;
  status?: TaskStatus | string;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  assignee?: string | null;
  status?: TaskStatus | string;
}

export interface TaskResponse extends TaskBase {
  id: number;
  finding_id: number;
  created_at: string;
  updated_at: string;
}

export interface TaskListParams {
  finding_id?: number;
  status?: string;
  assignee?: string;
}

// ==========================================
// Verification Schemas (app/schemas/verification.py)
// ==========================================

export interface VerificationBase {
  task_id?: number | null;
  evidence_description: string;
  evidence_url?: string | null;
  verification_result: VerificationResult | string;
}

export interface VerificationCreate {
  task_id?: number | null;
  evidence_description: string;
  evidence_url?: string | null;
  verification_result?: VerificationResult | string;
}

export interface VerificationResponse extends VerificationBase {
  id: number;
  finding_id: number;
  created_at: string;
}

// ==========================================
// Dashboard Schemas (app/schemas/dashboard.py)
// ==========================================

export interface DashboardSummaryResponse {
  total_findings: number;
  severity_breakdown: Record<string, number>;
  average_risk_score: number;
  total_tasks: number;
  task_status_breakdown: Record<string, number>;
  total_verifications: number;
  verification_breakdown: Record<string, number>;
  verified_fixed_findings: number;
  open_findings: number;
}

// ==========================================
// Import Schemas (app/schemas/finding.py)
// ==========================================

export interface FindingImportRejectedItem {
  index: number;
  raw_data: unknown;
  reason: string;
}

export interface FindingImportResponse {
  total_records: number;
  imported_count: number;
  rejected_count: number;
  imported_findings: FindingResponse[];
  rejected_findings: FindingImportRejectedItem[];
}

// ==========================================
// Chat Schemas (app/schemas/chat.py) — exact backend contract
// ==========================================

export interface ChatRequest {
  /** 1–4000 characters, trimmed by the backend. */
  message: string;
  /** Omit to start a new conversation. Must be a UUID. */
  conversation_id?: string;
  /** Links the conversation to a finding (one finding per conversation). */
  finding_id?: number;
}

export interface FindingContextSummary {
  id: number;
  title: string;
  severity: string;
  risk_score: number;
  cve_id: string | null;
  package_name: string | null;
  installed_version: string | null;
  fixed_version: string | null;
  file_path: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  role: string;
  content: string;
  structured_guidance: RemediationGuidanceResponse | null;
  is_fallback: boolean;
  provider: string;
  model: string | null;
  finding_context: FindingContextSummary | null;
  disclaimer: string;
  created_at: string;
}

export interface ChatMessageResponse {
  message_id: string;
  role: string;
  content: string;
  is_fallback: boolean;
  provider: string | null;
  model: string | null;
  created_at: string;
}

export interface ConversationDetailResponse {
  conversation_id: string;
  finding_id: number | null;
  finding_context: FindingContextSummary | null;
  title: string | null;
  messages: ChatMessageResponse[];
  created_at: string;
  updated_at: string;
}

// ==========================================
// Chat UI state (frontend only, never persisted in the browser)
// ==========================================

export type ChatRole = 'user' | 'assistant';

export interface UIChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  /** 'pending' = sent, awaiting backend; 'failed' = backend did not accept it. */
  status: 'pending' | 'delivered' | 'failed';
  isFallback?: boolean;
  provider?: string | null;
  model?: string | null;
  structuredGuidance?: RemediationGuidanceResponse | null;
  /** Local-only card (e.g. import result) rendered inline; not part of the backend conversation. */
  localCard?: LocalCard;
}

export type LocalCard =
  | { kind: 'import-result'; result: FindingImportResponse; fileName: string; format: string }
  | { kind: 'guidance'; guidance: RemediationGuidanceResponse };
