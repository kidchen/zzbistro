'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/recipes', label: 'Recipes', icon: '📖' },
    { href: '/ingredients', label: 'Pantry', icon: '🥫' },
    { href: '/menu', label: 'Menu', icon: '🍽️' },
    { href: '/lucky', label: "I'm Feeling Lucky", icon: '🎲' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-orange-600">
              ZZBistro
            </Link>
          </div>
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  pathname === item.href
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;