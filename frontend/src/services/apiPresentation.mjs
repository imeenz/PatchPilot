export function getApiErrorPresentation(error) {
  if (error?.kind === 'network') {
    return { network: true, title: 'Cannot connect to the PatchPilot backend' };
  }

  const titles = {
    400: 'Request could not be processed',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Resource not found',
    422: 'Request validation failed',
    500: 'Backend internal error',
  };
  const status = error?.status;
  const title = titles[status] ?? (status >= 500 ? 'Backend error' : 'Request failed');
  return { network: false, title };
}

export function getDataSourceState(isDemo, backendStatus, requestStatus) {
  if (isDemo) return 'demo';
  if (backendStatus === 'checking' || requestStatus === 'loading') return 'checking';
  if (backendStatus === 'offline') return 'offline';
  if (backendStatus === 'degraded' || requestStatus === 'failed') return 'degraded';
  if (backendStatus === 'online' && requestStatus === 'success') return 'live';
  return 'checking';
}
