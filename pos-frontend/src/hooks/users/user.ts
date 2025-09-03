// ...existing code...
import axios from '@/lib/axios';

async function handleResponseData(resp: any) {
  const data = resp?.data ?? {};
  if (resp?.status >= 400) throw new Error(data?.message || data?.error || 'Request failed');
  return data;
}

export async function registerUser(payload: { fullname: string; username: string; password: string; }) {
  // backend expects `name` not `fullname`
  const body = { name: payload.fullname, username: payload.username, password: payload.password };
  const resp = await axios.post('/auth/register', body);
  return handleResponseData(resp);
}

export async function loginUser(payload: { username: string; password: string; }) {
  const resp = await axios.post('/auth/login', payload);
  return handleResponseData(resp);
}
// ...existing code...