export function setAccessToken(token: string | null) {
  try {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  } catch (e) {}
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem('accessToken');
  } catch (e) {
    return null;
  }
}

export function setUser(obj: any | null) {
  try {
    if (obj) localStorage.setItem('user', JSON.stringify(obj));
    else localStorage.removeItem('user');
  } catch (e) {}
}

export function getUser(): any | null {
  try {
    const v = localStorage.getItem('user');
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  } catch (e) {}
}