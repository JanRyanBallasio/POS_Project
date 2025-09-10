'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to the dashboard route so its layout (sidebar) is used.
    router.replace('/dashboard/main');
  }, [router]);

  return null;
}
