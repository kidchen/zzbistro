'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';
import TagManager from '@/components/TagManager';
import CustomDropdown from '@/components/CustomDropdown';

export default function NewRecipePage() {
  const router = useRouter();
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    cookingTime: 30,
    servings: 4,
    ingredients: [''],
    instructions: [''],
    tags: [] as string[],
    image: ''
  });

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const ingredients = await storage.ingredients.getAll();
        setAvailableIngredients(ingredients);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      }
    };

    loadIngredients();
  }, []);

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
      tags: formData.tags,
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

  const compressImage = (file: File, maxSizeMB: number = 3): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file type before processing
      if (!file.type.startsWith('image/')) {
        reject(new Error('Invalid file type'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate new dimensions to maintain aspect ratio
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
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and reduce if needed
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until under size limit
        while (compressedDataUrl.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressedDataUrl);
      };
      
      const objectUrl = URL.createObjectURL(file);
      
      // Validate the object URL format for security
      if (!objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Invalid object URL'));
        return;
      }
      
      // Use setAttribute for safer URL assignment
      img.setAttribute('src', objectUrl);
      
      // Clean up object URL after use
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file, 3);
        setFormData(prev => ({
          ...prev,
          image: compressedImage
        }));
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Failed to process image. Please try a different image.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Add New Recipe 📝</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipe Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Spaghetti Carbonara"
              />
            </div>
            <TagManager
              selectedTags={formData.tags}
              onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cooking Time (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.cookingTime}
                onChange={(e) => setFormData(prev => ({ ...prev, cookingTime: parseInt(e.target.value) }))}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servings
              </label>
              <input
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) }))}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ingredients</h2>
            <button
              type="button"
              onClick={addIngredient}
              className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary"
            >
              Add Ingredient
            </button>
          </div>
          
          {availableIngredients.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="mb-2">No ingredients in your pantry yet!</p>
              <p className="text-sm">Add ingredients to your pantry first to create recipes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <CustomDropdown
                    value={ingredient}
                    onChange={(value) => updateIngredient(index, value)}
                    options={availableIngredients.map((ing) => ({
                      value: ing.name,
                      label: `${ing.name} (${ing.inStock ? 'In Stock' : 'Out of Stock'})`
                    }))}
                    placeholder="Select an ingredient..."
                    className="flex-1"
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-error hover:text-error px-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Instructions</h2>
            <button
              type="button"
              onClick={addInstruction}
              className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary"
            >
              Add Step
            </button>
          </div>
          <div className="space-y-2">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-gray-500 font-medium pt-1.5 min-w-[2rem]">
                  {index + 1}.
                </span>
                <textarea
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721]"
                  placeholder="Describe this step..."
                  rows={2}
                />
                {formData.instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="text-error hover:text-error px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recipe Photo</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              Images will be automatically compressed to under 3MB
            </p>
            {formData.image && (
              <div className="mt-3">
                <Image
                  src={formData.image}
                  alt="Recipe preview"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3 py-1 md:px-6 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 md:px-6 md:py-2 bg-[#C63721] text-white rounded-md hover:bg-[#A52E1A] text-sm md:text-base"
          >
            Save Recipe
          </button>
        </div>
      </form>
    </div>
  );
}