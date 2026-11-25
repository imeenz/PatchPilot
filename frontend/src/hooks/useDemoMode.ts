import { useSyncExternalStore } from 'react';
import { demoMode } from '@/services/demo/demoStore';

/** Subscribes to the opt-in demo dataset state (in memory only; off after every refresh). */
export function useDemoMode() {
  const isActive = useSyncExternalStore(demoMode.subscribe, demoMode.isActive, demoMode.isActive);
  return { isActive, enable: demoMode.enable, disable: demoMode.disable };
}
