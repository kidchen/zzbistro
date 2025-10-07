'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import UserDropdown from './UserDropdown';

const Navigation = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  
  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/recipes', label: 'Recipes', icon: '📖' },
    { href: '/ingredients', label: 'Pantry', icon: '🥫' },
    { href: '/menu', label: 'Menu', icon: '🍽️' },
    { href: '/lucky', label: "I'm Feeling Lucky", icon: '🎲' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo-nav-v2.png"
                alt="ZZBistro Logo"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span 
                className={`text-xl md:text-2xl font-bold text-[#C63721] dark:text-[#C63721] transition-all duration-300 overflow-hidden ${
                  isScrolled ? 'w-0 opacity-0 sm:w-auto sm:opacity-100' : 'w-auto opacity-100'
                }`}
              >
                ZZBistro
              </span>
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
                      ? 'text-[#C63721] dark:text-[#C63721] border-b-2 border-[#C63721] dark:border-[#C63721]'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
            <div className="flex items-center ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 flex-shrink-0">
              <UserDropdown />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;