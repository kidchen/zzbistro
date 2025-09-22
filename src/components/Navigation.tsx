'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const Navigation = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/recipes', label: 'Recipes', icon: '📖' },
    { href: '/ingredients', label: 'Pantry', icon: '🥫' },
    { href: '/menu', label: 'Menu', icon: '🍽️' },
    { href: '/lucky', label: "I'm Feeling Lucky", icon: '🎲' },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo-nav.png"
                alt="ZZBistro Logo"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-xl md:text-2xl font-bold text-orange-600">ZZBistro</span>
            </Link>
          </div>
          
          {/* Mobile: Scrollable navigation */}
          <div className="flex items-center min-w-0 flex-1 ml-4 sm:ml-8">
            <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide pb-1 sm:space-x-8 sm:overflow-visible">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-2 pt-1 text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                    pathname === item.href
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1 sm:mr-2">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
            
          {/* User section - always on the right */}
          {session && (
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200 flex-shrink-0">
              <span className="text-sm text-gray-600 hidden sm:inline">
                👋 {session.user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
              >
                <span className="sm:hidden">👋</span>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;