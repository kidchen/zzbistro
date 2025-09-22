'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';

export default function LuckyPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
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
      }
    };

    loadLuckyData();
  }, []);

  const checkRecipeAvailability = (recipe: Recipe) => {
    const inStockIngredients = ingredients.filter(i => i.inStock);
    const missing = recipe.ingredients.filter(recipeIngredient => 
      !inStockIngredients.some(stockIngredient => 
        stockIngredient.name.toLowerCase().includes(recipeIngredient.toLowerCase()) ||
        recipeIngredient.toLowerCase().includes(stockIngredient.name.toLowerCase())
      )
    );
    
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
          recipe.ingredients.every(recipeIngredient => 
            inStockIngredients.some(stockIngredient => 
              stockIngredient.name.toLowerCase().includes(recipeIngredient.toLowerCase()) ||
              recipeIngredient.toLowerCase().includes(stockIngredient.name.toLowerCase())
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">I&apos;m Feeling Lucky! 🎲</h1>
        <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
          Can&apos;t decide what to cook? Let us surprise you with a random recipe suggestion!
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">No recipes yet!</h2>
          <p className="text-gray-600 mb-6">
            Add some recipes first, then come back for random suggestions.
          </p>
          <Link
            href="/recipes/new"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Add Your First Recipe
          </Link>
        </div>
      ) : (
        <>
          {/* Main Lucky Button */}
          <div className="text-center mb-12">
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
                  : 'bg-orange-600 hover:bg-orange-700 hover:scale-110'
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
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isSpinning ? 'Rolling the dice...' : 'Surprise Me!'}
              </button>
            </div>
          </div>

          {/* Mood-based suggestions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Or choose your mood...</h2>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              {moodSuggestions.map((suggestion) => (
                <button
                  key={suggestion.mood}
                  onClick={() => getMoodSuggestion(suggestion.filter)}
                  disabled={isSpinning}
                  className={`p-2 md:p-4 rounded-lg border-2 transition-all ${
                    isSpinning
                      ? 'border-gray-200 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                      : 'border-orange-200 bg-white dark:bg-gray-800 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl md:text-3xl mb-1 md:mb-2">{suggestion.emoji}</div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm md:text-base">{suggestion.mood}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipe Suggestion */}
          {suggestedRecipe && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">🎉 Your Lucky Pick!</h2>
                <p className="opacity-90">Here&apos;s what the universe suggests for you today</p>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recipe Image */}
                  {suggestedRecipe.image && (
                    <div>
                      <Image
                        src={suggestedRecipe.image}
                        alt={suggestedRecipe.name}
                        width={400}
                        height={300}
                        className="w-full rounded-lg shadow-md object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Recipe Details */}
                  <div className={suggestedRecipe.image ? '' : 'lg:col-span-2'}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{suggestedRecipe.name}</h3>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        canMake 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {canMake ? '✅ Ready to cook!' : `⚠️ Missing ${missingIngredients.length} items`}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-6">
                      <span className="mr-6">⏱️ {suggestedRecipe.cookingTime} minutes</span>
                      <span className="mr-6">👥 {suggestedRecipe.servings} servings</span>
                      <span>📅 Added {new Date(suggestedRecipe.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {suggestedRecipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {suggestedRecipe.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {!canMake && missingIngredients.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-yellow-800 mb-2">Missing ingredients:</h4>
                        <ul className="text-yellow-700 text-sm">
                          {missingIngredients.map((ingredient, index) => (
                            <li key={index}>• {ingredient}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href={`/recipes/${suggestedRecipe.id}`}
                        className={`flex-1 text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                          canMake
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        {canMake ? "Let's Cook This! 🍳" : 'View Recipe 📖'}
                      </Link>
                      
                      {!canMake && (
                        <Link
                          href="/ingredients"
                          className="flex-1 text-center py-3 px-6 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                        >
                          Add Missing Items 🛒
                        </Link>
                      )}
                      
                      <button
                        onClick={getRandomRecipe}
                        className="flex-1 py-3 px-6 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Try Again 🎲
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