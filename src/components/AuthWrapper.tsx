'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    // Don't redirect if already on sign-in page
    if (pathname === '/auth/signin') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ZZBistro...</p>
        </div>
      </div>
    );
  }

  // Allow sign-in page to render without authentication
  if (pathname === '/auth/signin') {
    return <>{children}</>;
  }

  if (!session) {
    return null; // Will redirect to sign in
  }

  return <>{children}</>;
}