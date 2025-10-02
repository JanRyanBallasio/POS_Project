'use client';
import { useState } from 'react';

/**
 * No-op auth guard - authentication is disabled.
 * Always returns authenticated=true.
 */
export default function useAuthGuard() {
  const [loading] = useState(false);
  const [isAuthenticated] = useState(true); // Always authenticated

  return { loading, isAuthenticated };
}

export function useRedirectIfAuth(redirectTo = '/dashboard/main') {
  // No redirect needed - auth is disabled
  return;
}

export function useRequireAuth(redirectTo = '/login') {
  // No auth required - always allow access
  return { loading: false, isAuthenticated: true };
}