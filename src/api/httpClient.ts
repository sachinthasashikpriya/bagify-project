import { env } from '../config/env';
import { serviceRegistry } from './serviceRegistry';
import type { ServiceName } from './serviceRegistry';
import type { Result } from '../types/index';
import { getAuthToken, onUnauthorized } from '../state/authToken';
import { attemptTokenRefresh } from './tokenRefresher';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  service: ServiceName;
  auth?: boolean;
  timeoutMs?: number;
  query?: Record<string, string | number | boolean | undefined | null>;
  retry?: { attempts: number; backoffMs: number };
}

interface SpringBootError {
  message?: string;
  error?: string;
  errors?: string[];
  timestamp?: string;
  status?: number;
  path?: string;
}

// ===========================
// Utility Functions
// ===========================

const buildQueryString = (query?: RequestOptions['query']): string => {
  if (!query) return '';
  
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const delay = (ms: number): Promise<void> => 
  new Promise((resolve) => setTimeout(resolve, ms));

const calculateBackoff = (attempt: number, baseMs: number): number => 
  baseMs * Math.pow(2, attempt);

// ===========================
// Fetch with Timeout
// ===========================

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ===========================
// Request Headers Builder
// ===========================

function buildHeaders(options: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge custom headers
  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Add authorization if needed
  if (options.auth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// ===========================
// Response Parser
// ===========================

async function parseResponse<T>(response: Response): Promise<T | string> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    return await response.text();
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

// ===========================
// Error Handler
// ===========================

function extractErrorMessage(
  payload: unknown,
  response: Response,
  isJson: boolean
): string {
  if (!isJson) {
    return `${response.status} ${response.statusText}`;
  }

  const springError = payload as SpringBootError;
  
  // Try different error message formats
  if (springError?.message) return springError.message;
  if (springError?.error) return springError.error;
  if (springError?.errors && springError.errors.length > 0) {
    return springError.errors.join(', ');
  }

  return `${response.status} ${response.statusText}`;
}

// ===========================
// Data Extractor
// ===========================

function extractData<T>(payload: unknown): T {
  // Handle Spring Boot wrapper: { success: true, data: {...} }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  // Return raw payload
  return payload as T;
}

// ===========================
// Should Retry Logic
// ===========================

function shouldRetry(result: Result<unknown>): boolean {
  // Don't retry if successful
  if (result.ok) return false;

  // Don't retry client errors (4xx)
  if (result.status && result.status >= 400 && result.status < 500) {
    return false;
  }

  // Retry on network errors or 5xx
  return true;
}

// ===========================
// Core Request Function
// ===========================

async function executeRequest<T>(
  method: HttpMethod,
  path: string,
  body: unknown,
  options: RequestOptions
): Promise<Result<T>> {
  const baseURL = serviceRegistry[options.service];
  const timeoutMs = options.timeoutMs ?? env.API_TIMEOUT_MS;
  const headers = buildHeaders(options);
  const url = `${baseURL}${path}${buildQueryString(options.query)}`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method,
        headers,
        body: body !== undefined && body !== null 
          ? JSON.stringify(body) 
          : undefined,
        credentials: options.credentials,
        mode: options.mode,
        cache: options.cache,
        redirect: options.redirect,
        referrerPolicy: options.referrerPolicy,
      },
      timeoutMs
    );

    // Handle 204 No Content
    if (response.status === 204) {
      return {
        ok: true,
        data: undefined as unknown as T,
        status: 204,
      };
    }

    // Parse response body
    const payload = await parseResponse<T>(response);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Handle error responses
    if (!response.ok) {
      const errorMessage = extractErrorMessage(payload, response, isJson);

      // Handle 401 Unauthorized response
      if (response.status === 401 && options.auth) {
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess) {
          // Re-build headers with the new token
          const retryHeaders = buildHeaders(options);

          // Retry the exact same request once
          const retryResponse = await fetchWithTimeout(
            url,
            {
              method,
              headers: retryHeaders,
              body: body !== undefined && body !== null
                ? JSON.stringify(body)
                : undefined,
              credentials: options.credentials,
              mode: options.mode,
              cache: options.cache,
              redirect: options.redirect,
              referrerPolicy: options.referrerPolicy,
            },
            timeoutMs
          );

          if (retryResponse.ok) {
            const retryPayload = await parseResponse<T>(retryResponse);
            const retryData = extractData<T>(retryPayload);
            return {
              ok: true,
              data: retryData,
              status: retryResponse.status,
            };
          }

          // Retry itself failed
          const retryPayload = await parseResponse<T>(retryResponse);
          return {
            ok: false,
            error: extractErrorMessage(retryPayload, retryResponse, isJson),
            status: retryResponse.status,
            details: retryPayload,
          };
        }

        // Refresh failed: abort retry and return error
        return {
          ok: false,
          error: errorMessage,
          status: response.status,
          details: payload,
        };
      } else if (response.status === 401 && !options.auth) {
        // Non-auth request got a 401 — unexpected, log out
        onUnauthorized();
      }

      return {
        ok: false,
        error: errorMessage,
        status: response.status,
        details: payload,
      };
    }

    // Handle success responses
    const data = extractData<T>(payload);

    return {
      ok: true,
      data,
      status: response.status,
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.name === 'AbortError'
        ? `Request timed out after ${timeoutMs}ms`
        : error.message
      : 'Unknown network error';

    return {
      ok: false,
      error: errorMessage,
    };
  }
}

// ===========================
// Request with Retry
// ===========================

async function requestWithRetry<T>(
  method: HttpMethod,
  path: string,
  body: unknown,
  options: RequestOptions
): Promise<Result<T>> {
  const maxAttempts = (options.retry?.attempts ?? 0) + 1; // +1 for initial attempt
  const backoffMs = options.retry?.backoffMs ?? 500;

  let lastResult: Result<T> | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastResult = await executeRequest<T>(method, path, body, options);

    // Return immediately if successful or shouldn't retry
    if (!shouldRetry(lastResult)) {
      return lastResult;
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxAttempts - 1) {
      const waitTime = calculateBackoff(attempt, backoffMs);
      await delay(waitTime);
    }
  }

  // This should never happen, but TypeScript needs it
  return lastResult ?? {
    ok: false,
    error: 'Request failed with no result',
  };
}

// ===========================
// HTTP Client Export
// ===========================

export const httpClient = {
  get: <T>(path: string, options: RequestOptions) =>
    requestWithRetry<T>('GET', path, undefined, options),

  post: <T>(path: string, body: unknown, options: RequestOptions) =>
    requestWithRetry<T>('POST', path, body, options),

  put: <T>(path: string, body: unknown, options: RequestOptions) =>
    requestWithRetry<T>('PUT', path, body, options),

  patch: <T>(path: string, body: unknown, options: RequestOptions) =>
    requestWithRetry<T>('PATCH', path, body, options),

  delete: <T>(path: string, options: RequestOptions) =>
    requestWithRetry<T>('DELETE', path, undefined, options),
} as const;