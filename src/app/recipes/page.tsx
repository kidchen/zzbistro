'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { storage } from '@/lib/storage';
import { Recipe } from '@/types';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const recipesData = await storage.recipes.getAll();
        setRecipes(recipesData);
      } catch (error) {
        console.error('Error loading recipes:', error);
      }
    };

    loadRecipes();
  }, []);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = !selectedTag || recipe.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = [...new Set(recipes.flatMap(recipe => recipe.tags))];

  const deleteRecipe = async (id: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await storage.recipes.delete(id);
        setRecipes(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Recipe Collection 📖</h1>
        <Link
          href="/recipes/new"
          className="bg-[#C63721] text-white px-3 py-1 md:px-4 md:py-2 rounded-lg hover:bg-[#A52E1A] transition-colors text-sm md:text-base"
        >
          Add New Recipe
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-8">
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
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
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
              <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {recipe.image && (
                  <Image
                    src={recipe.image}
                    alt={recipe.name}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{recipe.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <span className="mr-4">⏱️ {recipe.cookingTime} min</span>
                    <span>👥 {recipe.servings} servings</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {recipe.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="text-[#C63721] hover:text-orange-700 font-medium"
                    >
                      View Recipe
                    </Link>
                    <button
                      onClick={() => deleteRecipe(recipe.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile List */}
          <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {filteredRecipes.map((recipe, index) => (
              <div key={recipe.id} className={`p-4 ${index < filteredRecipes.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <div className="flex gap-3">
                  {recipe.image && (
                    <Image
                      src={recipe.image}
                      alt={recipe.name}
                      width={60}
                      height={60}
                      className="w-15 h-15 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">{recipe.name}</h3>
                    <div className="flex items-center text-xs text-gray-600 mb-2">
                      <span className="mr-3">⏱️ {recipe.cookingTime}min</span>
                      <span>👥 {recipe.servings}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {recipe.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {recipe.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{recipe.tags.length - 2}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="bg-[#C63721] text-white px-3 py-1 rounded text-sm hover:bg-[#A52E1A] transition-colors"
                      >
                        View Recipe
                      </Link>
                      <button
                        onClick={() => deleteRecipe(recipe.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
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