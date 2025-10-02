// Simplified user store without authentication

export function setAccessToken(token: string | null) {
  // No-op - auth disabled
}

export function getAccessToken(): string | null {
  return null; // No tokens needed
}

export function setUser(obj: any | null) {
  if (typeof window !== 'undefined') {
    if (obj) {
      localStorage.setItem('user', JSON.stringify(obj));
    } else {
      localStorage.removeItem('user');
    }
  }
}

export function getUser(): any | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  }
}

export function invalidateCache() {
  // No cache to invalidate
}