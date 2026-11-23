import { API_BASE_URL } from '@/services/api';

export function useApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    isConfigured: Boolean(API_BASE_URL),
  };
}
