'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';

export default function RecipeDetailPage() {
  const params = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [editData, setEditData] = useState({
    name: '',
    cookingTime: 30,
    servings: 4,
    ingredients: [''],
    instructions: [''],
    tags: '',
    image: ''
  });

  useEffect(() => {
    const loadRecipeData = async () => {
      try {
        if (!params?.id) return;
        const recipeId = params.id as string;
        const recipes = await storage.recipes.getAll();
        const foundRecipe = recipes.find(r => r.id === recipeId);
        
        if (foundRecipe) {
          setRecipe(foundRecipe);
          
          // Set edit data
          setEditData({
            name: foundRecipe.name,
            cookingTime: foundRecipe.cookingTime,
            servings: foundRecipe.servings,
            ingredients: foundRecipe.ingredients,
            instructions: foundRecipe.instructions,
            tags: foundRecipe.tags.join(', '),
            image: foundRecipe.image || ''
          });
          
          // Load available ingredients for editing
          const allIngredients = await storage.ingredients.getAll();
          setAvailableIngredients(allIngredients);
          
          // Check ingredient availability
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
  }, [params?.id]);

  const handleSave = async () => {
    if (!recipe) return;
    
    const updatedRecipe: Recipe = {
      ...recipe,
      name: editData.name,
      cookingTime: editData.cookingTime,
      servings: editData.servings,
      ingredients: editData.ingredients.filter(ing => ing.trim() !== ''),
      instructions: editData.instructions.filter(inst => inst.trim() !== ''),
      tags: editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      image: editData.image || undefined
    };

    try {
      await storage.recipes.update(recipe.id, updatedRecipe);
      setRecipe(updatedRecipe);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Failed to update recipe. Please try again.');
    }
  };

  const addIngredient = () => {
    setEditData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setEditData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setEditData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const addInstruction = () => {
    setEditData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setEditData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setEditData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const compressImage = (file: File, maxSizeMB: number = 3): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        while (compressedDataUrl.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file, 3);
        setEditData(prev => ({
          ...prev,
          image: compressedImage
        }));
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Failed to process image. Please try a different image.');
      }
    }
  };

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
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">{recipe.name}</h1>
          <div className="flex items-center text-gray-600 mt-2">
            <span className="mr-6">⏱️ {recipe.cookingTime} minutes</span>
            <span className="mr-6">👥 {recipe.servings} servings</span>
            <span>📅 {new Date(recipe.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {canCook ? (
            <div className="bg-green-100 text-green-800 px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm whitespace-nowrap">
              <span className="md:hidden">✅ Ready!</span>
              <span className="hidden md:inline">✅ Ready to cook!</span>
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm whitespace-nowrap">
              <span className="md:hidden">⚠️ Missing</span>
              <span className="hidden md:inline">⚠️ Missing ingredients</span>
            </div>
          )}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-orange-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg hover:bg-orange-700 text-sm md:text-base whitespace-nowrap"
            >
              <span className="md:hidden">Edit</span>
              <span className="hidden md:inline">Edit Recipe</span>
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {!isEditing && recipe.tags.length > 0 && (
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

      {/* Edit Form */}
      {isEditing ? (
        <div className="space-y-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Time (minutes)</label>
                <input
                  type="number"
                  value={editData.cookingTime}
                  onChange={(e) => setEditData(prev => ({ ...prev, cookingTime: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
                <input
                  type="number"
                  value={editData.servings}
                  onChange={(e) => setEditData(prev => ({ ...prev, servings: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ingredients</h3>
              <button
                onClick={addIngredient}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Add Ingredient
              </button>
            </div>
            <div className="space-y-3">
              {editData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select an ingredient...</option>
                    {availableIngredients.map((ing) => (
                      <option key={ing.id} value={ing.name}>
                        {ing.name} ({ing.inStock ? 'In Stock' : 'Out of Stock'})
                      </option>
                    ))}
                  </select>
                  {editData.ingredients.length > 1 && (
                    <button
                      onClick={() => removeIngredient(index)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Instructions</h3>
              <button
                onClick={addInstruction}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Add Step
              </button>
            </div>
            <div className="space-y-3">
              {editData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-500 mt-2 min-w-[2rem]">{index + 1}.</span>
                  <textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={2}
                  />
                  {editData.instructions.length > 1 && (
                    <button
                      onClick={() => removeInstruction(index)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={editData.tags}
              onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., dinner, vegetarian, quick"
            />
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recipe Photo</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Images will be automatically compressed to under 3MB
              </p>
              {editData.image && (
                <div className="mt-4">
                  <Image
                    src={editData.image}
                    alt="Recipe preview"
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image */}
        {recipe.image && (
          <div className="lg:col-span-1">
            <Image
              src={recipe.image}
              alt={recipe.name}
              width={400}
              height={300}
              className="w-full rounded-lg shadow-md object-cover"
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
      )}
    </div>
  );
}