'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';
import CachedImage from '@/components/CachedImage';

export default function LuckyPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suggestedRecipe, setSuggestedRecipe] = useState<Recipe | null>(null);
  const [canMake, setCanMake] = useState(false);
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [preferAvailable, setPreferAvailable] = useState(true);

  useEffect(() => {
    const loadLuckyData = async () => {
      try {
        const allRecipes = await storage.recipes.getAll();
        const allIngredients = await storage.ingredients.getAll();
        
        setRecipes(allRecipes);
        setIngredients(allIngredients);
      } catch (error) {
        console.error('Error loading lucky data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLuckyData();
  }, []);

  const checkRecipeAvailability = (recipe: Recipe) => {
    const inStockIngredients = ingredients.filter(i => i.inStock);
    const missing = recipe.recipe_ingredients
      .filter(ingredient => !ingredient.optional) // Only check required ingredients
      .filter(recipeIngredient => 
        !inStockIngredients.some(stockIngredient => 
          stockIngredient.name.toLowerCase().includes(recipeIngredient.name.toLowerCase()) ||
          recipeIngredient.name.toLowerCase().includes(stockIngredient.name.toLowerCase())
        )
      )
      .map(ingredient => ingredient.name); // Extract names for display
    
    setMissingIngredients(missing);
    setCanMake(missing.length === 0);
  };

  const getRandomRecipe = () => {
    if (recipes.length === 0) return;

    setIsSpinning(true);
    
    // Add some suspense with a delay
    setTimeout(() => {
      let availableRecipes = recipes;
      
      if (preferAvailable) {
        const inStockIngredients = ingredients.filter(i => i.inStock);
        const cookableRecipes = recipes.filter(recipe => 
          recipe.recipe_ingredients
            .filter(ingredient => !ingredient.optional) // Only check required ingredients
            .every(recipeIngredient => 
              inStockIngredients.some(stockIngredient => 
                stockIngredient.name.toLowerCase().includes(recipeIngredient.name.toLowerCase()) ||
                recipeIngredient.name.toLowerCase().includes(stockIngredient.name.toLowerCase())
              )
            )
        );
        
        // If we have cookable recipes, prefer them, otherwise use all recipes
        if (cookableRecipes.length > 0) {
          availableRecipes = cookableRecipes;
        }
      }
      
      const randomIndex = Math.floor(Math.random() * availableRecipes.length);
      const selectedRecipe = availableRecipes[randomIndex];
      
      setSuggestedRecipe(selectedRecipe);
      checkRecipeAvailability(selectedRecipe);
      setIsSpinning(false);
    }, 1500);
  };

  const moodSuggestions = [
    { mood: 'Quick & Easy', emoji: '⚡', filter: (r: Recipe) => r.cookingTime <= 30 },
    { mood: 'Comfort Food', emoji: '🤗', filter: (r: Recipe) => r.tags.some(tag => ['comfort', 'hearty', 'warm'].includes(tag.toLowerCase())) },
    { mood: 'Healthy', emoji: '🥗', filter: (r: Recipe) => r.tags.some(tag => ['healthy', 'light', 'fresh'].includes(tag.toLowerCase())) },
    { mood: 'Adventurous', emoji: '🌶️', filter: (r: Recipe) => r.tags.some(tag => ['spicy', 'exotic', 'international'].includes(tag.toLowerCase())) },
    { mood: 'Family Dinner', emoji: '👨‍👩‍👧‍👦', filter: (r: Recipe) => r.servings >= 4 },
    { mood: 'Date Night', emoji: '💕', filter: (r: Recipe) => r.servings <= 2 && r.cookingTime >= 45 }
  ];

  const getMoodSuggestion = (moodFilter: (r: Recipe) => boolean) => {
    const filteredRecipes = recipes.filter(moodFilter);
    if (filteredRecipes.length === 0) {
      getRandomRecipe();
      return;
    }

    setIsSpinning(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
      const selectedRecipe = filteredRecipes[randomIndex];
      
      setSuggestedRecipe(selectedRecipe);
      checkRecipeAvailability(selectedRecipe);
      setIsSpinning(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="text-center mb-6 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">I&apos;m Feeling Lucky! 🎲</h1>
        <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Can&apos;t decide what to cook? Let us surprise you with a random recipe suggestion!
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading recipes...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">No recipes yet!</h2>
          <p className="text-gray-600 mb-6">
            Add some recipes first, then come back for random suggestions.
          </p>
          <Link
            href="/recipes/new"
            className="bg-[#C63721] text-white px-6 py-3 rounded-lg hover:bg-[#A52E1A] transition-colors cursor-pointer"
          >
            Add Your First Recipe
          </Link>
        </div>
      ) : (
        <>
          {/* Main Lucky Button */}
          <div className="text-center mb-6 md:mb-12">
            <div className="mb-6">
              <label className="flex items-center justify-center space-x-2">
                <input
                  type="checkbox"
                  checked={preferAvailable}
                  onChange={(e) => setPreferAvailable(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Prefer recipes I can make now</span>
              </label>
            </div>
            
            <button
              onClick={getRandomRecipe}
              disabled={isSpinning}
              className={`text-6xl p-8 rounded-full transition-all duration-300 ${
                isSpinning 
                  ? 'animate-spin bg-orange-200' 
                  : 'bg-[#C63721] hover:bg-[#A52E1A] hover:scale-110'
              }`}
            >
              🎲
            </button>
            
            <div className="mt-6">
              <button
                onClick={getRandomRecipe}
                disabled={isSpinning}
                className={`text-2xl font-bold px-8 py-4 rounded-lg transition-colors ${
                  isSpinning
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-[#C63721] text-white hover:bg-[#A52E1A] cursor-pointer'
                }`}
              >
                {isSpinning ? 'Rolling the dice...' : 'Surprise Me!'}
              </button>
            </div>
          </div>

          {/* Mood-based suggestions */}
          <div className="mb-6 md:mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4 sm:mb-6">Or choose your mood...</h2>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4">
              {moodSuggestions.map((suggestion) => (
                <button
                  key={suggestion.mood}
                  onClick={() => getMoodSuggestion(suggestion.filter)}
                  disabled={isSpinning}
                  className={`p-2 md:p-4 rounded-lg border-2 transition-all ${
                    isSpinning
                      ? 'border-gray-200 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                      : 'border-orange-200 bg-white dark:bg-gray-800 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer'
                  }`}
                >
                  <div className="text-xl md:text-3xl mb-1 md:mb-2">{suggestion.emoji}</div>
                  <div className="font-medium text-gray-900 dark:text-white text-xs md:text-base">{suggestion.mood}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipe Suggestion */}
          {suggestedRecipe && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 md:p-6 text-center">
                <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">🎉 Your Lucky Pick!</h2>
                <p className="opacity-90 text-sm md:text-base">Here&apos;s what the universe suggests for you today</p>
              </div>
              
              <div className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                  {/* Recipe Image */}
                  {suggestedRecipe.image_path && (
                    <div>
                      <CachedImage
                        imagePath={suggestedRecipe.image_path}
                        alt={suggestedRecipe.name}
                        width={400}
                        height={300}
                        className="w-full rounded-lg shadow-md object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Recipe Details */}
                  <div className={suggestedRecipe.image_path ? '' : 'lg:col-span-2'}>
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                      <h3 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{suggestedRecipe.name}</h3>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        canMake 
                          ? 'bg-success-subtle text-success' 
                          : 'bg-warning-subtle text-warning'
                      }`}>
                        {canMake ? '✅ Ready to cook!' : `⚠️ Missing ${missingIngredients.length} items`}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3 md:mb-6 text-sm md:text-base">
                      <span className="mr-6">⏱️ {suggestedRecipe.cookingTime} minutes</span>
                      <span className="mr-6">👥 {suggestedRecipe.servings} servings</span>
                      <span>📅 Added {new Date(suggestedRecipe.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {suggestedRecipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 md:mb-6">
                        {suggestedRecipe.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-accent dark:bg-orange-900 text-white dark:text-white rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {!canMake && missingIngredients.length > 0 && (
                      <div className="bg-[#E2B210] border border-[#E2B210] rounded-lg p-3 md:p-4 mb-3 md:mb-6">
                        <h4 className="font-medium text-warning mb-2">Missing ingredients:</h4>
                        <ul className="text-[#B8940D] text-sm">
                          {missingIngredients.map((ingredient, index) => (
                            <li key={index}>• {ingredient}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex flex-row gap-2 md:flex-col md:gap-4">
                      <Link
                        href={`/recipes/${suggestedRecipe.id}`}
                        className={`flex-1 text-center py-2 px-3 md:py-3 md:px-6 rounded-lg font-medium transition-colors text-sm md:text-base ${
                          canMake
                            ? 'bg-primary text-white hover:bg-primary'
                            : 'bg-[#C63721] text-white hover:bg-[#A52E1A]'
                        }`}
                      >
                        <span className="md:hidden">{canMake ? "Cook! 🍳" : 'View 📖'}</span>
                        <span className="hidden md:inline">{canMake ? "Let's Cook This! 🍳" : 'View Recipe 📖'}</span>
                      </Link>
                      
                      {!canMake && (
                        <Link
                          href="/ingredients"
                          className="flex-1 text-center py-2 px-3 md:py-3 md:px-6 bg-warning text-white rounded-lg font-medium hover:bg-warning transition-colors cursor-pointer text-sm md:text-base"
                        >
                          <span className="md:hidden">Add 🛒</span>
                          <span className="hidden md:inline">Add Missing Items 🛒</span>
                        </Link>
                      )}
                      
                      <button
                        onClick={getRandomRecipe}
                        className="flex-1 py-2 px-3 md:py-3 md:px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors cursor-pointer text-sm md:text-base"
                      >
                        <span className="md:hidden">Again 🎲</span>
                        <span className="hidden md:inline">Try Again 🎲</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}