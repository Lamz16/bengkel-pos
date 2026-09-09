/**
 * Standard Types for REST API Client
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiPaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface ApiErrorDetail {
  message: string;
  statusCode?: number;
  code?: string;
  errors?: Record<string, string[] | string>;
  timestamp?: string;
}

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  signal?: AbortSignal;
  token?: string;
  skipAuth?: boolean;
}

export interface ApiHealthStatus {
  online: boolean;
  url: string;
  latencyMs?: number;
  message?: string;
  statusCode?: number;
}
