'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Family } from '@/types';

interface FamilyContextType {
  family: Family | null;
  isLoading: boolean;
  refreshFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType>({
  family: null,
  isLoading: true,
  refreshFamily: async () => {}
});

export const useFamily = () => useContext(FamilyContext);

interface FamilyProviderProps {
  children: React.ReactNode;
}

export default function FamilyProvider({ children }: FamilyProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [family, setFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFamily = useCallback(async () => {
    if (!session?.user?.email) {
      setFamily(null);
      setIsLoading(false);
      return;
    }

    try {
      const userFamily = await storage.families.getByUserEmail(session.user.email);
      setFamily(userFamily);
    } catch (error) {
      console.error('Error fetching family:', error);
      setFamily(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      setIsLoading(false);
      return;
    }

    refreshFamily();
  }, [session, status, refreshFamily]);

  // Redirect to family setup if user doesn't have a family
  useEffect(() => {
    if (
      !isLoading && 
      session?.user?.email && 
      !family && 
      pathname !== '/family/setup' &&
      pathname !== '/auth/signin' &&
      !pathname.startsWith('/api/')
    ) {
      router.push('/family/setup');
    }
  }, [family, isLoading, session, pathname, router]);

  // Show loading while checking family status
  if (isLoading && status !== 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C63721] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your family...</p>
        </div>
      </div>
    );
  }

  return (
    <FamilyContext.Provider value={{ family, isLoading, refreshFamily }}>
      {children}
    </FamilyContext.Provider>
  );
}
