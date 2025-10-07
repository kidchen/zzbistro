'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useFamily } from '@/components/FamilyProvider';
import { storage } from '@/lib/storage';
import { FamilyMembership } from '@/types';

export default function FamilyPage() {
  const { data: session } = useSession();
  const { family, refreshFamily } = useFamily();
  const [members, setMembers] = useState<FamilyMembership[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = family?.owner_email === session?.user?.email;

  const loadMembers = useCallback(async () => {
    if (!family) return;
    
    try {
      const familyMembers = await storage.families.getMembers(family.id);
      setMembers(familyMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }, [family]);

  useEffect(() => {
    if (family) {
      setEditedName(family.name || '');
      loadMembers();
    }
  }, [family, loadMembers]);

  const handleUpdateName = async () => {
    if (!family || !editedName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await storage.families.updateName(family.id, editedName.trim());
      await refreshFamily();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating family name:', error);
      setError('Failed to update family name');
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (email: string) => {
    setNewMemberEmail(email);
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleAddMember = async () => {
    if (!family || !newMemberEmail.trim()) return;

    // Validate email format
    if (!validateEmail(newMemberEmail.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check member limit
    if (members.length >= 10) {
      setError('Family is at maximum capacity (10 members). Remove a member first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await storage.families.addMember(family.id, newMemberEmail.trim());
      setNewMemberEmail('');
      setEmailError('');
      await loadMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member. They may already be in another family.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userEmail: string) => {
    if (!family || !confirm('Are you sure you want to remove this member?')) return;

    setIsLoading(true);
    setError('');

    try {
      await storage.families.removeMember(family.id, userEmail);
      await loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveFamily = async () => {
    if (!session?.user?.email || !confirm('Are you sure you want to leave this family? You will need to be re-invited to rejoin.')) return;

    setIsLoading(true);
    setError('');

    try {
      await storage.families.leave(session.user.email);
      await refreshFamily();
    } catch (error) {
      console.error('Error leaving family:', error);
      setError('Failed to leave family');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!family) return;
    
    const familyName = family.name || 'Unnamed Family';
    const confirmation = prompt(`To confirm deletion, please type the family name: "${familyName}"`);
    
    if (confirmation !== familyName) {
      if (confirmation !== null) { // User didn't cancel
        setError('Family name does not match. Deletion cancelled.');
      }
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await storage.families.delete(family.id);
      await refreshFamily();
    } catch (error) {
      console.error('Error deleting family:', error);
      setError('Failed to delete family');
    } finally {
      setIsLoading(false);
    }
  };

  if (!family) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Family Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You don&apos;t seem to be part of a family yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8">
        {/* Family Name Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {isEditing ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl sm:text-3xl font-bold bg-transparent border-b-2 border-[#C63721] focus:outline-none text-gray-900 dark:text-white w-full"
                  autoFocus
                />
              ) : (
                family.name || 'Unnamed Family'
              )}
            </h1>
            {isOwner && (
              <div className="flex gap-2 flex-shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdateName}
                      disabled={isLoading}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#C63721] text-white rounded-md hover:bg-[#A52A1A] disabled:opacity-50 text-sm sm:text-base"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(family.name || '');
                      }}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm sm:text-base"
                  >
                    Edit Name
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Owner: {family.owner_email}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 sm:mb-6">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Members Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Family Members ({members.length})
          </h2>
          
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-3 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base break-words">
                    {member.user_email}
                    {member.user_email === family.owner_email && (
                      <span className="ml-2 px-2 py-1 text-xs bg-accent dark:bg-orange-900 text-white dark:text-white rounded-full">
                        Owner
                      </span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
                
                {isOwner && member.user_email !== family.owner_email && (
                  <button
                    onClick={() => handleRemoveMember(member.user_email)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs sm:text-sm bg-[#C63721] text-white rounded-md hover:bg-[#A52A1A] disabled:opacity-50 self-start sm:self-center flex-shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Member Section (Owner Only) */}
        {isOwner && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add Family Member
            </h3>
            {members.length >= 10 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Family is at maximum capacity (10 members). Remove a member to add someone new.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="Enter email address"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-[#C63721] focus:border-[#C63721] dark:bg-gray-700 dark:text-white text-sm sm:text-base ${
                        emailError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {emailError && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{emailError}</p>
                    )}
                  </div>
                  <button
                    onClick={handleAddMember}
                    disabled={isLoading || !newMemberEmail.trim() || !!emailError}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-[#C63721] text-white rounded-md hover:bg-[#A52A1A] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-shrink-0"
                  >
                    Add Member
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  The person must have a ZZBistro account to be added ({members.length}/10 members)
                </p>
              </>
            )}
          </div>
        )}

        {/* Leave Family Section (Non-owners) */}
        {!isOwner && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
              Leave Family
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
              If you leave this family, you&apos;ll need to be re-invited to rejoin.
            </p>
            <button
              onClick={handleLeaveFamily}
              disabled={isLoading}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-[#C63721] text-white rounded-md hover:bg-[#A52A1A] disabled:opacity-50 text-sm sm:text-base"
            >
              Leave Family
            </button>
          </div>
        )}

        {/* Delete Family Section (Owner Only) */}
        {isOwner && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delete Family
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
              This will permanently delete the family and remove all members. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteFamily}
              disabled={isLoading}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
            >
              Delete Family
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
