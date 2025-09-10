'use client';
import axios from '@/lib/axios';
import { getAccessToken, getUser } from '@/stores/userStore';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Temporary no-op auth guard for testing.
 * Returns isAuthenticated=true and prevents redirect to login.
 *
 * TODO: Re-enable redirect-to-login behavior after testing.
 */
export default function useAuthGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated] = useState(true); // force-authenticated during testing

  useEffect(() => {
    // Intentionally no redirect while testing.
    // If you need to re-enable redirect, add check here and use router.push('/authentication/login')
  }, [router]);

  return { loading, isAuthenticated };
}

export function useRedirectIfAuth(redirectTo = '/dashboard/main') {
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent multiple checks
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      try {
        // Quick validation first
        const token = getAccessToken();
        const user = getUser();

        if (token && user) {
          // Validate token structure and expiry
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp * 1000 < Date.now() + 60000; // 1 min buffer
            
            if (!isExpired) {
              router.replace(redirectTo);
              return;
            }
          } catch (e) {
            // Invalid token structure, try refresh
          }
        }

        // Only attempt refresh if we have refresh cookie
        const hasRefreshCookie = typeof window !== 'undefined' && 
          document.cookie.includes('refreshToken=');
        
        if (!hasRefreshCookie) return;

        // Attempt refresh
        const resp = await axios.post('/auth/refresh');
        if (resp.data?.accessToken) {
          router.replace(redirectTo);
        }
      } catch (err) {
        // Clean up on failure
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
        }
        console.debug('Auth check failed, cleaned up stale session');
      }
    };

    checkAuth();
  }, [redirectTo, router]);
}

// New hook for protecting routes
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      try {
        const token = getAccessToken();
        const user = getUser();

        if (!token || !user) {
          router.replace(redirectTo);
          return;
        }

        // Validate token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now() + 60000;
          
          if (isExpired) {
            // Try refresh
            await axios.post('/auth/refresh');
          }
        } catch (e) {
          router.replace(redirectTo);
        }
      } catch (err) {
        router.replace(redirectTo);
      }
    };

    checkAuth();
  }, [redirectTo, router]);
}