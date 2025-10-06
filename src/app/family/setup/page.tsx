'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

export default function FamilySetupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');

  const handleCreateFamily = async () => {
    if (!session?.user?.email) return;

    setIsCreating(true);
    setError('');

    try {
      await storage.families.create(
        session.user.email,
        familyName.trim() || undefined
      );
      
      // Redirect to main app
      router.push('/');
    } catch (error) {
      console.error('Error creating family:', error);
      setError('Failed to create family. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to continue
          </h1>
        </div>
      </div>
    );
  }

  const defaultFamilyName = `${session.user.email.split('@')[0]}&apos;s family`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to ZZBistro! 🍳
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Let&apos;s set up your family cooking space
          </p>
        </div>

        {/* Information Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-xl">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Already have a family account?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Contact your household members to get added to an existing family instead of creating a new one.
              </p>
            </div>
          </div>
        </div>

        {/* Create Family Form */}
        <div className="space-y-6">
          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Family Name (Optional)
            </label>
            <input
              type="text"
              id="familyName"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={defaultFamilyName}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#C63721] focus:border-[#C63721] dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty to use: &quot;{defaultFamilyName}&quot;
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreateFamily}
            disabled={isCreating}
            className="w-full bg-[#C63721] text-white py-3 px-4 rounded-md hover:bg-[#A52A1A] focus:outline-none focus:ring-2 focus:ring-[#C63721] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating Family...' : 'Create My Family'}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You can add family members and change the name later
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
