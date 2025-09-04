'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { getAccessToken, getUser } from '@/stores/userStore';

export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const token = getAccessToken();
      if (token) {
        setChecking(false);
        return;
      }

      // try server-side refresh (will use refresh cookie)
      try {
        const resp = await axios.post('/auth/refresh');
        const newToken = resp.data?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          setChecking(false);
          return;
        }
      } catch (err) {
        // not authenticated
      }

      router.replace(redirectTo);
    }

    check();
  }, [router, redirectTo]);

  return checking;
}

export function useRedirectIfAuth(redirectTo = '/dashboard/main') {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken() || (typeof window !== 'undefined' && getUser() ? localStorage.getItem('accessToken') : null);
    if (token) {
      router.replace(redirectTo);
      return; // Don't attempt refresh if we already have a token
    }

    // Check if there's any indication of a refresh token before attempting refresh
    // This prevents unnecessary 401 calls on fresh visits
    const hasRefreshIndicator = typeof window !== 'undefined' && (
      document.cookie.includes('refreshToken') || 
      localStorage.getItem('user') // User was previously logged in
    );

    if (hasRefreshIndicator) {
      // if no client token but we might have a refresh token, attempt silent refresh
      (async () => {
        try {
          const resp = await axios.post('/auth/refresh');
          const newToken = resp.data?.accessToken;
          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            router.replace(redirectTo);
          }
        } catch (err) {
          // remain on the page - this is expected for first-time visitors
          console.debug('No valid refresh token found, staying on auth page');
        }
      })();
    }
    // If no refresh indicator, just stay on the current page (login/register)
  }, [router, redirectTo]);
}