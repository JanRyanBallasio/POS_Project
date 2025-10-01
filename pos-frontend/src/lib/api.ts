// src/lib/api.ts

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:5000";

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
