const TOKEN_KEY = 'lifepulse_token';
let memoryToken: string | null = null;

/** Keep the active session usable when browser storage is unavailable or full. */
export function getToken(): string | null {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) memoryToken = token;
    return token || memoryToken;
  } catch {
    return memoryToken;
  }
}

export function setToken(token: string): void {
  memoryToken = token;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The session remains available in memory until this tab is closed.
  }
}

export function clearToken(): void {
  memoryToken = null;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing else to clear when browser storage is unavailable.
  }
}
