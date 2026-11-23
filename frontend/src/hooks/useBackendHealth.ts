import { useCallback, useEffect, useState } from 'react';
import { getHealth } from '@/services/api';
import type { HealthResponse } from '@/services/api';

export type BackendStatus = 'checking' | 'online' | 'degraded' | 'offline';

/** Reads GET /api/v1/health. Reports what the backend says — nothing is assumed. */
export function useBackendHealth() {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let ignore = false;
    getHealth()
      .then((h) => {
        if (ignore) return;
        setHealth(h);
        setStatus(h.status === 'ok' ? 'online' : 'degraded');
      })
      .catch(() => {
        if (ignore) return;
        setHealth(null);
        setStatus('offline');
      });
    return () => {
      ignore = true;
    };
  }, [nonce]);

  const recheck = useCallback(() => {
    setStatus('checking');
    setNonce((n) => n + 1);
  }, []);

  return { status, health, recheck };
}
