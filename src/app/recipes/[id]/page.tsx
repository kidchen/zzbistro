'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);

  useEffect(() => {
    const loadRecipeData = async () => {
      try {
        const recipeId = params.id as string;
        const recipes = await storage.recipes.getAll();
        const foundRecipe = recipes.find(r => r.id === recipeId);
        
        if (foundRecipe) {
          setRecipe(foundRecipe);
          
          // Check ingredient availability
          const allIngredients = await storage.ingredients.getAll();
          setIngredients(allIngredients);
          
          const missing = foundRecipe.ingredients.filter(recipeIngredient => 
            !allIngredients.some(stockIngredient => 
              stockIngredient.inStock && (
                stockIngredient.name.toLowerCase().includes(recipeIngredient.toLowerCase()) ||
                recipeIngredient.toLowerCase().includes(stockIngredient.name.toLowerCase())
              )
            )
          );
          setMissingIngredients(missing);
        }
      } catch (error) {
        console.error('Error loading recipe data:', error);
      }
    };

    loadRecipeData();
  }, [params.id]);

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Recipe not found</h1>
          <Link href="/recipes" className="text-orange-600 hover:text-orange-700">
            Back to recipes
          </Link>
        </div>
      </div>
    );
  }

  const canCook = missingIngredients.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link href="/recipes" className="text-orange-600 hover:text-orange-700 mb-2 inline-block">
            ← Back to recipes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{recipe.name}</h1>
          <div className="flex items-center text-gray-600 mt-2">
            <span className="mr-6">⏱️ {recipe.cookingTime} minutes</span>
            <span className="mr-6">👥 {recipe.servings} servings</span>
            <span>📅 {new Date(recipe.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {canCook ? (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            ✅ Ready to cook!
          </div>
        ) : (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
            ⚠️ Missing ingredients
          </div>
        )}
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {recipe.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image */}
        {recipe.image && (
          <div className="lg:col-span-1">
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Ingredients */}
        <div className={`${recipe.image ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => {
                const isMissing = missingIngredients.includes(ingredient);
                return (
                  <li
                    key={index}
                    className={`flex items-center ${
                      isMissing ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    <span className="mr-2">
                      {isMissing ? '❌' : '✅'}
                    </span>
                    {ingredient}
                  </li>
                );
              })}
            </ul>
            
            {missingIngredients.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 font-medium">Missing ingredients:</p>
                <ul className="text-yellow-700 text-sm mt-1">
                  {missingIngredients.map((ingredient, index) => (
                    <li key={index}>• {ingredient}</li>
                  ))}
                </ul>
                <Link
                  href="/ingredients"
                  className="text-yellow-800 underline text-sm mt-2 inline-block"
                >
                  Update your pantry →
                </Link>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex">
                  <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-gray-700">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}