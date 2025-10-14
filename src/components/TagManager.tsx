'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

interface TagManagerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export default function TagManager({ selectedTags, onChange, className = '' }: TagManagerProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const recipes = await storage.recipes.getAll();
        const allTags = [...new Set(recipes.flatMap(recipe => recipe.tags))].sort();
        setAvailableTags(allTags);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    loadTags();
  }, []);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const addNewTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onChange([...selectedTags, trimmedTag]);
      if (!availableTags.includes(trimmedTag)) {
        setAvailableTags([...availableTags, trimmedTag].sort());
      }
    }
    setNewTag('');
    setShowInput(false);
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tags
      </label>
      
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 bg-accent dark:bg-orange-900 text-white dark:text-white text-sm rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-white hover:text-gray-200 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available Tags */}
      {availableTags.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Click to add existing tags:</p>
          <div className="flex flex-wrap gap-2">
            {availableTags
              .filter(tag => !selectedTags.includes(tag))
              .map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Add New Tag */}
      <div className="flex gap-2">
        {showInput ? (
          <>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
              placeholder="Enter new tag"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={addNewTag}
              className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary text-sm cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false);
                setNewTag('');
              }}
              className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 text-sm cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="px-2 py-1 md:px-3 md:py-1 bg-primary text-white rounded text-xs md:text-sm hover:bg-primary cursor-pointer"
          >
            + Add New Tag
          </button>
        )}
      </div>
    </div>
  );
}
