/**
 * Backend API client.
 * Base URL comes from VITE_API_BASE_URL (see .env.example).
 *
 * There is deliberately NO silent fallback to sample data: any failure is
 * thrown as an ApiError so the UI can show an explicit error state.
 */

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
).replace(/\/$/, '');

export type ApiErrorKind = 'network' | 'http';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly endpoint: string;

  constructor(message: string, kind: ApiErrorKind, endpoint: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.endpoint = endpoint;
    this.status = status;
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network';
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

/** Converts FastAPI `detail` payloads (string or validation list) into readable text. */
function formatDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (d && typeof d === 'object' && 'msg' in d) {
          const loc = Array.isArray((d as { loc?: unknown }).loc)
            ? ((d as { loc: unknown[] }).loc.filter((p) => p !== 'body').join('.') as string)
            : '';
          return loc ? `${loc}: ${(d as { msg: string }).msg}` : (d as { msg: string }).msg;
        }
        return JSON.stringify(d);
      })
      .join('; ');
  }
  return JSON.stringify(detail);
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...customConfig } = options;
  const path = `/${endpoint.replace(/^\//, '')}`;
  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      headers: { 'Content-Type': 'application/json', ...customConfig.headers },
    });
  } catch {
    throw new ApiError(`Unable to reach the backend at ${API_BASE_URL}.`, 'network', path);
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}${response.statusText ? `: ${response.statusText}` : ''}`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'detail' in body) {
        message = formatDetail((body as { detail: unknown }).detail);
      }
    } catch {
      // Body was not JSON; keep the HTTP status message.
    }
    throw new ApiError(message, 'http', path, response.status);
  }

  return (await response.json()) as T;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  database: string;
  ai_provider: string;
}

/** GET /api/v1/health */
export function getHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>('/health');
}
