'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { Recipe } from '@/types';
import CustomDropdown from '@/components/CustomDropdown';
import CachedImage from '@/components/CachedImage';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const recipesData = await storage.recipes.getAll();
        setRecipes(recipesData);
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipes();
  }, []);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = !selectedTag || recipe.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [recipes, searchTerm, selectedTag]);

  const allTags = useMemo(() => {
    return [...new Set(recipes.flatMap(recipe => recipe.tags))];
  }, [recipes]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Recipe Collection 📖</h1>
        <Link
          href="/recipes/new"
          className="bg-[#C63721] text-white px-3 py-1 md:px-4 md:py-2 rounded-lg hover:bg-[#A52E1A] transition-colors text-sm md:text-base flex-shrink-0"
        >
          <span className="hidden sm:inline">Add New Recipe</span>
          <span className="sm:hidden">+ Add</span>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Recipes
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ingredient..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Tag
            </label>
            <CustomDropdown
              options={[
                { value: '', label: 'All Tags' },
                ...allTags.map(tag => ({ value: tag, label: tag }))
              ]}
              value={selectedTag}
              onChange={setSelectedTag}
              placeholder="All Tags"
            />
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading recipes...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍳</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {recipes.length === 0 ? 'No recipes yet!' : 'No recipes match your search'}
          </h2>
          <p className="text-gray-600 mb-6">
            {recipes.length === 0 
              ? 'Start building your recipe collection by adding your first recipe.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
          {recipes.length === 0 && (
            <Link
              href="/recipes/new"
              className="bg-[#C63721] text-white px-6 py-3 rounded-lg hover:bg-[#A52E1A] transition-colors"
            >
              Add Your First Recipe
            </Link>
          )}
        </div>
      ) : (
        <div>
          {/* Desktop Cards */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-gray-200 dark:border-gray-600">
                {recipe.image_path && (
                  <CachedImage
                    imagePath={recipe.image_path}
                    alt={recipe.name}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-brand transition-colors"
                    >
                      View Recipe
                    </Link>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span className="mr-4">⏱️ {recipe.cookingTime} min</span>
                    <span>👥 {recipe.servings} servings</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors hover:opacity-80 cursor-pointer ${
                          selectedTag === tag 
                            ? 'bg-primary text-white' 
                            : 'bg-accent dark:bg-orange-900 text-white dark:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile List */}
          <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border-2 border-gray-200 dark:border-gray-600">
            {filteredRecipes.map((recipe, index) => (
              <div key={recipe.id} className={`p-3 ${index < filteredRecipes.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <div className="flex gap-3">
                  {recipe.image_path && (
                    <CachedImage
                      imagePath={recipe.image_path}
                      alt={recipe.name}
                      width={60}
                      height={60}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{recipe.name}</h3>
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="bg-primary text-white px-2 py-1 rounded text-xs hover:bg-primary-brand transition-colors ml-2 flex-shrink-0"
                      >
                        View
                      </Link>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-1">
                      <span className="mr-3">⏱️ {recipe.cookingTime}min</span>
                      <span>👥 {recipe.servings}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 2).map(tag => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                          className={`px-2 py-0.5 text-xs rounded-full transition-colors hover:opacity-80 cursor-pointer ${
                            selectedTag === tag 
                              ? 'bg-primary text-white' 
                              : 'bg-accent dark:bg-orange-900 text-white dark:text-white'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                      {recipe.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{recipe.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}