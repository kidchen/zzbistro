'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import Footer from './Footer';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
}

function SignInFooter() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center space-x-6">
          <Link 
            href="/help" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Help
          </Link>
          <Link 
            href="/feedback" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Send Feedback
          </Link>
          <Link 
            href="/privacy" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Privacy
          </Link>
          <Link 
            href="/terms" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Terms
          </Link>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 ZZBistro. Your personal cooking companion.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function ConditionalLayout({ children }: Props) {
  const pathname = usePathname();
  const isSignInPage = pathname === '/auth/signin';

  if (isSignInPage) {
    return (
      <>
        {children}
        <SignInFooter />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
