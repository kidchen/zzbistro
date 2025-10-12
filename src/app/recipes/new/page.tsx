'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useFamily } from '@/components/FamilyProvider';
import Image from 'next/image';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';
import TagManager from '@/components/TagManager';
import CustomDropdown from '@/components/CustomDropdown';

export default function NewRecipePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { family } = useFamily();
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cookingTime: 30,
    servings: 2,
    recipe_ingredients: [{ name: '', optional: false }],
    instructions: [''],
    tags: [] as string[],
    image_path: '',
    image_preview: '' // For showing preview during upload
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
      recipe_ingredients: formData.recipe_ingredients.filter(ing => ing.name.trim() !== ''),
      instructions: formData.instructions.filter(inst => inst.trim() !== ''),
      image_path: formData.image_path || undefined,
      image_version: formData.image_path ? Date.now().toString() : undefined,
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
      recipe_ingredients: [...prev.recipe_ingredients, { name: '', optional: false }]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.map((ing, i) => 
        i === index ? { ...ing, name } : ing
      )
    }));
  };

  const toggleIngredientOptional = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.map((ing, i) => 
        i === index ? { ...ing, optional: !ing.optional } : ing
      )
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    if (!session?.user?.email || !family?.id) {
      alert('Please sign in and ensure you have a family to upload images');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Dynamic import to reduce initial bundle size
      const { uploadRecipeImage } = await import('@/lib/imageUpload');
      
      // Create temporary recipe ID for upload
      const tempRecipeId = crypto.randomUUID();
      
      // Upload to Supabase
      const result = await uploadRecipeImage(
        file, 
        tempRecipeId, 
        family.id
      );
      
      
      setFormData(prev => ({
        ...prev,
        image_path: result.imagePath,
        image_preview: result.imageUrl
      }));
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-6">Add New Recipe 📝</h1>

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
          <div className="flex justify-between items-center mb-2 md:mb-3">
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
            <div className="space-y-2 md:space-y-2">
              {formData.recipe_ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <CustomDropdown
                    value={ingredient.name}
                    onChange={(value) => updateIngredient(index, value)}
                    options={availableIngredients.map((ing) => ({
                      value: ing.name,
                      label: `${ing.name} (${ing.inStock ? 'In Stock' : 'Out of Stock'})`
                    }))}
                    placeholder="Select an ingredient..."
                    className="flex-1"
                  />
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={ingredient.optional}
                      onChange={() => toggleIngredientOptional(index)}
                      className="rounded"
                    />
                    Optional
                  </label>
                  {formData.recipe_ingredients.length > 1 && (
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
          <div className="flex justify-between items-center mb-2 md:mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Instructions</h2>
            <button
              type="button"
              onClick={addInstruction}
              className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary"
            >
              Add Step
            </button>
          </div>
          <div className="space-y-2 md:space-y-2">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">Recipe Photo</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              {uploadingImage ? 'Uploading and compressing...' : 'Images will be automatically compressed to 400x400 and stored securely'}
            </p>
            {formData.image_preview && (
              <div className="mt-2 md:mt-3">
                <Image
                  src={formData.image_preview}
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