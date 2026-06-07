// src/state/authToken.ts
let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  return memoryToken;
}

export function setAuthToken(token: string | null): void {
  memoryToken = token;
}

export function clearAuthToken(): void {
  memoryToken = null;
}

export function getRefreshToken(): string | null {
  // Cookies are used now. JavaScript does not handle or read the refresh token.
  return null;
}

export function setRefreshToken(_token: string | null): void {
  // Do nothing. Refresh token is handled by HttpOnly cookie.
}

export function clearRefreshToken(): void {
  // Do nothing. Refresh token cookie is cleared by calling /api/v1/auth/logout.
}

export function onUnauthorized(): void {
  clearAuthToken();
  
  // Redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login?expired=true';
  }
}