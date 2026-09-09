/**
 * Robust, Type-Safe HTTP Client for REST API
 * Handles base URLs, query string serialization, timeout cancellation, and error wrapping.
 */

import { getApiBaseUrl, buildHeaders, API_CONFIG, removeAuthToken } from './config';
import { ApiRequestOptions } from './types';

export class ApiError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;
  public endpoint: string;

  constructor(message: string, statusCode: number, details?: any, endpoint: string = '') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.endpoint = endpoint;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Serializes an object into URLSearchParams string
 */
function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(`${key}[]`, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Core Request Method
 */
export async function httpRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  options?: ApiRequestOptions
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const queryString = buildQueryString(options?.params);
  const fullUrl = `${baseUrl}${cleanEndpoint}${queryString}`;

  const timeoutMs = options?.timeout ?? API_CONFIG.timeoutMs;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = buildHeaders(options?.headers, options?.skipAuth);

  const fetchConfig: RequestInit = {
    method,
    headers,
    signal: options?.signal || controller.signal,
  };

  if (body !== undefined && method !== 'GET') {
    if (body instanceof FormData) {
      // Allow browser to calculate multipart boundary
      delete (headers as any)['Content-Type'];
      fetchConfig.body = body;
    } else {
      fetchConfig.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(fullUrl, fetchConfig);
    clearTimeout(timeoutId);

    // Handle empty content responses (204 No Content)
    if (response.status === 204) {
      return null as unknown as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      // 401 Unauthorized handling
      if (response.status === 401) {
        removeAuthToken();
      }

      const errorMessage = 
        (typeof responseData === 'object' && responseData !== null)
          ? responseData.message || responseData.error || response.statusText || 'Terjadi kesalahan pada server'
          : responseData || response.statusText || 'Terjadi kesalahan pada server';

      throw new ApiError(
        errorMessage, 
        response.status, 
        responseData,
        cleanEndpoint
      );
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(`Permintaan ke ${cleanEndpoint} melebihi batas waktu (${timeoutMs}ms)`, 408, null, cleanEndpoint);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Network error / offline / CORS issue
    throw new ApiError(
      error.message || 'Gagal terhubung ke REST API server. Pastikan server backend sedang berjalan dan CORS diizinkan.',
      0,
      error,
      cleanEndpoint
    );
  }
}

/**
 * Convenient REST Methods
 */
export const httpClient = {
  get: <T = any>(endpoint: string, options?: ApiRequestOptions) => 
    httpRequest<T>(endpoint, 'GET', undefined, options),

  post: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
    httpRequest<T>(endpoint, 'POST', body, options),

  put: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
    httpRequest<T>(endpoint, 'PUT', body, options),

  patch: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
    httpRequest<T>(endpoint, 'PATCH', body, options),

  delete: <T = any>(endpoint: string, options?: ApiRequestOptions) => 
    httpRequest<T>(endpoint, 'DELETE', undefined, options),
};
