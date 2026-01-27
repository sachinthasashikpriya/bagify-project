// src/state/authToken.ts
const TOKEN_KEY = 'auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    clearAuthToken();
  }
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function onUnauthorized(): void {
  clearAuthToken();
  
  // Redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}