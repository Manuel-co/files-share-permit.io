// components/AuthCheck.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      try {
        console.log("Verifying authentication...");

        // Make sure we're using GET method with the proper route
        const response = await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin' // Include cookies
        });

        console.log("Auth verification response status:", response.status);

        if (!response.ok) {
          console.log("Auth failed with status:", response.status);
          throw new Error('Not authenticated');
        }

        console.log("Authentication successful ✅✅✅✅✅");
        setIsLoading(false);
        // router.push("/dashboard")
      } catch (error) {
        console.error("Authentication error: 🔥🔥🔥🔥🔥", error);
        setIsLoading(false);
        router.replace('/login');
      }
    }

    verifyAuth();
  }, [router]);

  // Don't show loading state during SSR
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}