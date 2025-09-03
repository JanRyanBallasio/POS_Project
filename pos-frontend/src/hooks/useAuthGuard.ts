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
    } else {
      // if no client token, attempt silent refresh
      (async () => {
        try {
          const resp = await axios.post('/auth/refresh');
          const newToken = resp.data?.accessToken;
          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            router.replace(redirectTo);
          }
        } catch (err) {
          // remain on the page
        }
      })();
    }
  }, [router, redirectTo]);
}