/**
 * REST API Configuration & Token Manager
 */

const STORAGE_KEYS = {
  TOKEN: 'workshop_api_token',
  CUSTOM_BASE_URL: 'workshop_api_custom_url',
};

// Default fallback URL: checks Vite env var or relative `/api` or localhost
export const DEFAULT_API_BASE_URL = 
  ((import.meta as any).env?.VITE_API_BASE_URL as string) || 
  'http://localhost:8000/api';

export const API_CONFIG = {
  timeoutMs: 15000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Get current active API Base URL.
 * Allows runtime override via localStorage for easy testing with custom server.
 */
export function getApiBaseUrl(): string {
  try {
    const custom = localStorage.getItem(STORAGE_KEYS.CUSTOM_BASE_URL);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch (e) {
    // LocalStorage might not be available in some sandboxes
  }
  return DEFAULT_API_BASE_URL.replace(/\/+$/, '');
}

/**
 * Set custom API Base URL dynamically (e.g. from UI settings)
 */
export function setApiBaseUrl(url: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BASE_URL, url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_BASE_URL);
    }
  } catch (e) {
    console.error('Failed to save API Base URL to localStorage', e);
  }
}

/**
 * Reset API Base URL back to default environment value
 */
export function resetApiBaseUrl(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_BASE_URL);
  } catch (e) {}
}

/**
 * Auth Token Management (JWT / Bearer)
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (e) {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch (e) {
    console.error('Failed to save auth token', e);
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (e) {}
}

/**
 * Builds standard request headers with Authorization Bearer token if present
 */
export function buildHeaders(customHeaders?: Record<string, string>, skipAuth?: boolean): HeadersInit {
  const headers: Record<string, string> = {
    ...API_CONFIG.defaultHeaders,
    ...(customHeaders || {}),
  };

  if (!skipAuth) {
    const token = getAuthToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}
