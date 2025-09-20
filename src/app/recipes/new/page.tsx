'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Recipe } from '@/types';

export default function NewRecipePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    cookingTime: 30,
    servings: 4,
    ingredients: [''],
    instructions: [''],
    tags: '',
    image: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: formData.name,
      ingredients: formData.ingredients.filter(ing => ing.trim() !== ''),
      instructions: formData.instructions.filter(inst => inst.trim() !== ''),
      image: formData.image || undefined,
      cookingTime: formData.cookingTime,
      servings: formData.servings,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      createdAt: new Date()
    };

    try {
      await storage.recipes.add(recipe);
      router.push('/recipes');
    } catch (error) {
      console.error('Error adding recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Recipe 📝</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Spaghetti Carbonara"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Italian, Pasta, Quick"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cooking Time (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.cookingTime}
                onChange={(e) => setFormData(prev => ({ ...prev, cookingTime: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servings
              </label>
              <input
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipe Photo</h2>
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
            {formData.image && (
              <div className="mt-4">
                <img
                  src={formData.image}
                  alt="Recipe preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
            <button
              type="button"
              onClick={addIngredient}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Add Ingredient
            </button>
          </div>
          <div className="space-y-3">
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 2 cups flour"
                />
                {formData.ingredients.length > 1 && (
                  <button
                    type="button"
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
            <h2 className="text-xl font-semibold text-gray-900">Instructions</h2>
            <button
              type="button"
              onClick={addInstruction}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Add Step
            </button>
          </div>
          <div className="space-y-3">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-gray-500 font-medium pt-2 min-w-[2rem]">
                  {index + 1}.
                </span>
                <textarea
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe this step..."
                  rows={2}
                />
                {formData.instructions.length > 1 && (
                  <button
                    type="button"
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

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Save Recipe
          </button>
        </div>
      </form>
    </div>
  );
}