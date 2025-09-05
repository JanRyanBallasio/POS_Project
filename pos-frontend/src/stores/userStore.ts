// Token caching to reduce localStorage access
let tokenCache: string | null = null;
let userCache: any | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds

export function setAccessToken(token: string | null) {
  try {
    tokenCache = token;
    cacheTimestamp = Date.now();
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  } catch (e) {}
}

export function getAccessToken(): string | null {
  try {
    // Use cache if valid
    const now = Date.now();
    if (tokenCache !== null && (now - cacheTimestamp) < CACHE_TTL) {
      return tokenCache;
    }
    
    // Refresh cache
    tokenCache = localStorage.getItem('accessToken');
    cacheTimestamp = now;
    return tokenCache;
  } catch (e) {
    return null;
  }
}

export function setUser(obj: any | null) {
  try {
    userCache = obj;
    cacheTimestamp = Date.now();
    if (obj) localStorage.setItem('user', JSON.stringify(obj));
    else localStorage.removeItem('user');
  } catch (e) {}
}

export function getUser(): any | null {
  try {
    // Use cache if valid
    const now = Date.now();
    if (userCache !== null && (now - cacheTimestamp) < CACHE_TTL) {
      return userCache;
    }
    
    // Refresh cache
    const v = localStorage.getItem('user');
    userCache = v ? JSON.parse(v) : null;
    cacheTimestamp = now;
    return userCache;
  } catch (e) {
    return null;
  }
}

export function clearAuth() {
  try {
    tokenCache = null;
    userCache = null;
    cacheTimestamp = 0;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  } catch (e) {}
}

// Force cache refresh
export function invalidateCache() {
  tokenCache = null;
  userCache = null;
  cacheTimestamp = 0;
}