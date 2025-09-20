'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
        const updatedRecipes = await storage.recipes.getAll();
        setRecipes(updatedRecipes);
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recipe Collection 📖</h1>
        <Link
          href="/recipes/new"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Add New Recipe
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Recipes
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ingredient..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Tag
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
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
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Add Your First Recipe
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {recipe.image && (
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.name}</h3>
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
                    className="text-orange-600 hover:text-orange-700 font-medium"
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
      )}
    </div>
  );
}