// src/lib/api.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiFetch(path: string, options?: RequestInit) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`⚠️ API error ${res.status} for ${path}`);
      // Return empty data instead of throwing
      return { data: [], success: false, message: `API error: ${res.status}` };
    }

    return res.json();
  } catch (error: any) {
    // Handle network errors gracefully
    if (error.name === 'AbortError') {
      console.warn('⚠️ Request timeout for:', path);
    } else {
      console.warn('⚠️ Network error for:', path, error.message);
    }
    
    // Return empty data instead of throwing
    return { data: [], success: false, message: error.message || 'Network error' };
  }
}
