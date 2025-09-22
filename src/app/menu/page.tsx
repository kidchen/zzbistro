'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';

export default function MenuPage() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [partialRecipes, setPartialRecipes] = useState<{ recipe: Recipe; missing: string[] }[]>([]);
  const [showPartial, setShowPartial] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [maxCookingTime, setMaxCookingTime] = useState<number | ''>('');

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        const allRecipes = await storage.recipes.getAll();
        const allIngredients = await storage.ingredients.getAll();
        const inStockIngredients = allIngredients.filter(i => i.inStock);
        
        setRecipes(allRecipes);
        setIngredients(allIngredients);

        // Handle filter parameter from URL
        const filter = searchParams.get('filter');
        if (filter === 'available') {
          setShowPartial(false); // Show only available recipes
        }

        // Find recipes we can make completely
        const available = allRecipes.filter(recipe => 
          recipe.ingredients.every(recipeIngredient => 
            inStockIngredients.some(stockIngredient => 
              stockIngredient.name.toLowerCase().includes(recipeIngredient.toLowerCase()) ||
              recipeIngredient.toLowerCase().includes(stockIngredient.name.toLowerCase())
            )
          )
        );

        // Find recipes we can partially make (missing 1-3 ingredients)
        const partial = allRecipes
          .filter(recipe => !available.includes(recipe))
          .map(recipe => {
            const missing = recipe.ingredients.filter(recipeIngredient => 
              !inStockIngredients.some(stockIngredient => 
                stockIngredient.name.toLowerCase().includes(recipeIngredient.toLowerCase()) ||
                recipeIngredient.toLowerCase().includes(stockIngredient.name.toLowerCase())
              )
            );
            return { recipe, missing };
          })
          .filter(({ missing }) => missing.length <= 3 && missing.length > 0)
          .sort((a, b) => a.missing.length - b.missing.length);

        setAvailableRecipes(available);
        setPartialRecipes(partial);
      } catch (error) {
        console.error('Error loading menu data:', error);
      }
    };

    loadMenuData();
  }, [searchParams]);

  const allTags = [...new Set(recipes.flatMap(recipe => recipe.tags))];

  const filteredAvailableRecipes = availableRecipes.filter(recipe => {
    const matchesTag = !selectedTag || recipe.tags.includes(selectedTag);
    const matchesTime = !maxCookingTime || recipe.cookingTime <= maxCookingTime;
    return matchesTag && matchesTime;
  });

  const filteredPartialRecipes = partialRecipes.filter(({ recipe }) => {
    const matchesTag = !selectedTag || recipe.tags.includes(selectedTag);
    const matchesTime = !maxCookingTime || recipe.cookingTime <= maxCookingTime;
    return matchesTag && matchesTime;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">What&apos;s for Dinner? 🍽️</h1>

      {/* Stats - Desktop: Cards, Mobile: Table */}
      <div className="mb-6">
        {/* Desktop Cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{availableRecipes.length}</div>
            <div className="text-green-700">Ready to Cook</div>
            <div className="text-sm text-green-600 mt-1">All ingredients available</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{partialRecipes.length}</div>
            <div className="text-yellow-700">Almost Ready</div>
            <div className="text-sm text-yellow-600 mt-1">Missing 1-3 ingredients</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{ingredients.filter(i => i.inStock).length}</div>
            <div className="text-blue-700">Ingredients in Stock</div>
            <div className="text-sm text-blue-600 mt-1">Ready to use</div>
          </div>
        </div>

        {/* Mobile Table */}
        <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Ready to Cook</span>
            <span className="text-lg font-bold text-green-600">{availableRecipes.length}</span>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">Almost Ready</span>
            <span className="text-lg font-bold text-yellow-600">{partialRecipes.length}</span>
          </div>
          <div className="flex justify-between items-center p-3">
            <span className="text-sm text-gray-600">Ingredients in Stock</span>
            <span className="text-lg font-bold text-blue-600">{ingredients.filter(i => i.inStock).length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-8">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tag</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Cooking Time</label>
            <select
              value={maxCookingTime}
              onChange={(e) => setMaxCookingTime(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Any time</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowPartial(!showPartial)}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors text-sm ${
                showPartial
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              {showPartial ? 'Hide' : 'Show'} Partial Matches
            </button>
          </div>
        </div>
      </div>

      {/* Ready to Cook */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ready to Cook ✅</h2>
        {filteredAvailableRecipes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">🤔</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No recipes available right now</h3>
            <p className="text-gray-600 mb-4">
              {availableRecipes.length === 0 
                ? "You don't have all the ingredients for any recipes yet."
                : "Try adjusting your filters or check the partial matches below."
              }
            </p>
            <div className="space-x-4">
              <Link
                href="/ingredients"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Update Pantry
              </Link>
              <Link
                href="/recipes/new"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Add Recipe
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop Cards */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableRecipes.map((recipe) => (
                <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-green-200">
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
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <span className="mr-4">⏱️ {recipe.cookingTime} min</span>
                      <span>👥 {recipe.servings} servings</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {recipe.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="block w-full text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Cook This! 🍳
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile List */}
            <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border-2 border-green-200">
              {filteredAvailableRecipes.map((recipe, index) => (
                <div key={recipe.id} className={`p-4 ${index < filteredAvailableRecipes.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
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
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{recipe.name}</h3>
                        <span className="text-green-600 text-lg ml-2">✅</span>
                      </div>
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
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="inline-block bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Cook This! 🍳
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Partial Matches */}
      {showPartial && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Almost Ready ⚠️</h2>
          {filteredPartialRecipes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No partial matches</h3>
              <p className="text-gray-600">All your recipes are either ready to cook or need too many ingredients.</p>
            </div>
          ) : (
            <div>
              {/* Desktop Cards */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPartialRecipes.map(({ recipe, missing }) => (
                  <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-yellow-200">
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
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
                        <span className="text-yellow-600 text-xl">⚠️</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <span className="mr-4">⏱️ {recipe.cookingTime} min</span>
                        <span>👥 {recipe.servings} servings</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-red-600 mb-2">
                          Missing {missing.length} ingredient{missing.length > 1 ? 's' : ''}:
                        </p>
                        <ul className="text-sm text-red-700">
                          {missing.map((ingredient, index) => (
                            <li key={index}>• {ingredient}</li>
                          ))}
                        </ul>
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
                      <div className="space-y-2">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="block w-full text-center bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          View Recipe
                        </Link>
                        <Link
                          href="/ingredients"
                          className="block w-full text-center bg-yellow-600 text-white py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                        >
                          Add Missing Items
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile List */}
              <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border-2 border-yellow-200">
                {filteredPartialRecipes.map(({ recipe, missing }, index) => (
                  <div key={recipe.id} className={`p-4 ${index < filteredPartialRecipes.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
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
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{recipe.name}</h3>
                          <span className="text-yellow-600 text-lg ml-2">⚠️</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 mb-2">
                          <span className="mr-3">⏱️ {recipe.cookingTime}min</span>
                          <span>👥 {recipe.servings}</span>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs font-medium text-red-600 mb-1">
                            Missing {missing.length}: {missing.slice(0, 2).join(', ')}{missing.length > 2 && '...'}
                          </p>
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
                        <div className="flex gap-2">
                          <Link
                            href={`/recipes/${recipe.id}`}
                            className="flex-1 text-center bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                          >
                            View Recipe
                          </Link>
                          <Link
                            href="/ingredients"
                            className="flex-1 text-center bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 transition-colors"
                          >
                            Add Items
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}