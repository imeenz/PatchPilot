export type BackendHealthStatus = 'checking' | 'online' | 'degraded' | 'offline';
export type DataRequestStatus = 'loading' | 'success' | 'failed';
export type DataSourceState = 'demo' | 'checking' | 'offline' | 'degraded' | 'live';

export function getApiErrorPresentation(error: unknown): { network: boolean; title: string };
export function getDataSourceState(
  isDemo: boolean,
  backendStatus: BackendHealthStatus,
  requestStatus: DataRequestStatus,
): DataSourceState;
