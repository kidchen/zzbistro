'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { storage } from '@/lib/storage';
import { Recipe } from '@/types';
import CustomDropdown from '@/components/CustomDropdown';

export default function MenuPage() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      } finally {
        setIsLoading(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-8">What&apos;s for Dinner? 🍽️</h1>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading menu...</p>
        </div>
      ) : (
        <div>
          {/* Stats - Desktop: Cards, Mobile: Table */}
          {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-8">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tag</label>
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
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Cooking Time</label>
            <CustomDropdown
              options={[
                { value: '', label: 'Any time' },
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '45', label: '45 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' }
              ]}
              value={maxCookingTime.toString()}
              onChange={(value) => setMaxCookingTime(value ? parseInt(value) : '')}
              placeholder="Any time"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowPartial(!showPartial)}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-md transition-colors text-sm cursor-pointer ${
                showPartial
                  ? 'bg-[#C63721] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
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
                className="bg-[#C63721] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-[#A52E1A] transition-colors text-sm md:text-base"
              >
                Update Pantry
              </Link>
              <Link
                href="/recipes/new"
                className="bg-secondary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-secondary transition-colors text-sm md:text-base"
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
                <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-green-500 dark:border-green-400">
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
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
                        <span className="text-green-600 text-xl">✅</span>
                      </div>
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        View Recipe
                      </Link>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
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
            <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border-2 border-green-500 dark:border-green-400">
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
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{recipe.name}</h3>
                          <span className="text-green-600 text-lg">✅</span>
                        </div>
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 transition-colors ml-2 flex-shrink-0 cursor-pointer"
                        >
                          View
                        </Link>
                      </div>
                      <div className="flex items-center text-xs text-gray-600 mb-2">
                        <span className="mr-3">⏱️ {recipe.cookingTime}min</span>
                        <span>👥 {recipe.servings}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
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

      {/* Partial Matches */}
      {showPartial && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Almost Ready ⚠️</h2>
          {filteredPartialRecipes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No partial matches</h3>
              <p className="text-gray-600 dark:text-gray-300">All your recipes are either ready to cook or need too many ingredients.</p>
            </div>
          ) : (
            <div>
              {/* Desktop Cards */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPartialRecipes.map(({ recipe, missing }) => (
                  <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-[#E2B210]">
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
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
                          <span className="text-[#B8940D] text-xl">⚠️</span>
                        </div>
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary transition-colors"
                        >
                          View Recipe
                        </Link>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <span className="mr-4">⏱️ {recipe.cookingTime} min</span>
                        <span>👥 {recipe.servings} servings</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-error mb-2">
                          Missing {missing.length} ingredient{missing.length > 1 ? 's' : ''}:
                        </p>
                        <ul className="text-sm text-red-700">
                          {missing.map((ingredient, index) => (
                            <li key={index}>• {ingredient}</li>
                          ))}
                        </ul>
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
              <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border-2 border-[#E2B210]">
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
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{recipe.name}</h3>
                            <span className="text-[#B8940D] text-lg">⚠️</span>
                          </div>
                          <Link
                            href={`/recipes/${recipe.id}`}
                            className="bg-primary text-white px-2 py-1 rounded text-xs hover:bg-primary transition-colors ml-2 flex-shrink-0"
                          >
                            View
                          </Link>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 mb-2">
                          <span className="mr-3">⏱️ {recipe.cookingTime}min</span>
                          <span>👥 {recipe.servings}</span>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs font-medium text-error mb-1">
                            Missing {missing.length}: {missing.slice(0, 2).join(', ')}{missing.length > 2 && '...'}
                          </p>
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
      )}
        </div>
      )}
    </div>
  );
}