'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useFamily } from '@/components/FamilyProvider';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';
import { clearImageFromCache } from '@/lib/imageCache';
import CachedImage from '@/components/CachedImage';
import CustomDropdown from '@/components/CustomDropdown';
import TagManager from '@/components/TagManager';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { family } = useFamily();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [editData, setEditData] = useState({
    name: '',
    cookingTime: 30,
    servings: 4,
    recipe_ingredients: [{ name: '', optional: false }],
    instructions: [''],
    tags: [] as string[],
    image_path: '', // Supabase path
    image_preview: '', // For preview during upload
    pendingImageFile: null as File | null // Store file until save
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
            recipe_ingredients: foundRecipe.recipe_ingredients,
            instructions: foundRecipe.instructions,
            tags: foundRecipe.tags,
            image_path: foundRecipe.image_path || '',
            image_preview: '', // Will be set during upload
            pendingImageFile: null
          });
          
          // Load available ingredients for editing
          const allIngredients = await storage.ingredients.getAll();
          setAvailableIngredients(allIngredients);
          
          // Check ingredient availability
          const missing = foundRecipe.recipe_ingredients
            .filter(ingredient => !ingredient.optional) // Only check required ingredients
            .filter(recipeIngredient => 
              !allIngredients.some(stockIngredient => 
                stockIngredient.inStock && (
                  stockIngredient.name.toLowerCase().includes(recipeIngredient.name.toLowerCase()) ||
                  recipeIngredient.name.toLowerCase().includes(stockIngredient.name.toLowerCase())
                )
              )
            )
            .map(ingredient => ingredient.name); // Extract names for display
          setMissingIngredients(missing);
        }
      } catch (error) {
        console.error('Error loading recipe data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipeData();
  }, [params?.id]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (editData.image_preview && editData.pendingImageFile) {
        URL.revokeObjectURL(editData.image_preview);
      }
    };
  }, [editData.image_preview, editData.pendingImageFile]);

  const handleSave = async () => {
    if (!recipe) return;
    
    try {
      // Handle image upload if there's a pending file
      let finalImagePath = editData.image_path;
      if (editData.pendingImageFile) {
        if (!session?.user?.email || !family?.id) {
          alert('Please sign in and ensure you have a family to upload images');
          return;
        }

        setUploadingImage(true);
        
        // Dynamic import to reduce initial bundle size
        const { uploadRecipeImage } = await import('@/lib/imageUpload');
        
        // Upload to Supabase
        const result = await uploadRecipeImage(
          editData.pendingImageFile, 
          recipe.id, 
          family.id
        );
        
        // Clear old image from cache if it exists
        if (recipe.image_path) {
          clearImageFromCache(recipe.image_path);
        }
        
        finalImagePath = result.imagePath;
        setUploadingImage(false);
      }

      // Check if there are any changes
      const hasChanges = (
        editData.name !== recipe.name ||
        editData.cookingTime !== recipe.cookingTime ||
        editData.servings !== recipe.servings ||
        JSON.stringify(editData.recipe_ingredients.filter(ing => ing.name.trim() !== '')) !== JSON.stringify(recipe.recipe_ingredients) ||
        JSON.stringify(editData.instructions.filter(inst => inst.trim() !== '')) !== JSON.stringify(recipe.instructions) ||
        JSON.stringify(editData.tags) !== JSON.stringify(recipe.tags) ||
        finalImagePath !== recipe.image_path ||
        editData.pendingImageFile !== null
      );

      if (!hasChanges) {
        setIsEditing(false);
        return;
      }
      
      const updatedRecipe: Recipe = {
        ...recipe,
        name: editData.name,
        cookingTime: editData.cookingTime,
        servings: editData.servings,
        recipe_ingredients: editData.recipe_ingredients.filter(ing => ing.name.trim() !== ''),
        instructions: editData.instructions.filter(inst => inst.trim() !== ''),
        tags: editData.tags,
        image_path: finalImagePath || undefined,
        image_version: finalImagePath ? Date.now().toString() : recipe.image_version
      };

      await storage.recipes.update(recipe.id, updatedRecipe);
      setRecipe(updatedRecipe);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Failed to update recipe. Please try again.');
      setUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    
    if (confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      try {
        await storage.recipes.delete(recipe.id);
        router.push('/recipes');
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe. Please try again.');
      }
    }
  };

  const addIngredient = () => {
    setEditData(prev => ({
      ...prev,
      recipe_ingredients: [...prev.recipe_ingredients, { name: '', optional: false }]
    }));
  };

  const removeIngredient = (index: number) => {
    setEditData(prev => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, name: string) => {
    setEditData(prev => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.map((ing, i) => 
        i === index ? { ...ing, name } : ing
      )
    }));
  };

  const toggleIngredientOptional = (index: number) => {
    setEditData(prev => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.map((ing, i) => 
        i === index ? { ...ing, optional: !ing.optional } : ing
      )
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

  const handleCancel = () => {
    // Clean up any object URL to prevent memory leaks
    if (editData.image_preview && editData.pendingImageFile) {
      URL.revokeObjectURL(editData.image_preview);
    }
    
    // Reset edit data to original recipe values
    setEditData({
      name: recipe?.name || '',
      cookingTime: recipe?.cookingTime || 30,
      servings: recipe?.servings || 4,
      recipe_ingredients: recipe?.recipe_ingredients || [{ name: '', optional: false }],
      instructions: recipe?.instructions || [''],
      tags: recipe?.tags || [],
      image_path: recipe?.image_path || '',
      image_preview: '',
      pendingImageFile: null
    });
    
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Create a local preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setEditData(prev => ({
      ...prev,
      image_preview: previewUrl,
      pendingImageFile: file
    }));
  };

  // Function to convert URLs in text to clickable links
  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (/(https?:\/\/[^\s]+)/.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recipe not found</h1>
          <Link href="/recipes" className="text-[#C63721] hover:text-primary-brand">
            Back to recipes
          </Link>
        </div>
      </div>
    );
  }

  const canCook = missingIngredients.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      {/* Header */}
      <div className="mb-3 md:mb-6">
        <Link href="/recipes" className="text-[#C63721] hover:text-primary-brand mb-2 inline-block">
          ← Back to recipes
        </Link>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{recipe.name}</h1>
            {canCook ? (
              <div className="bg-success-subtle text-success px-3 py-1 rounded-lg text-xs md:text-sm whitespace-nowrap">
                <span className="md:hidden">✅ Ready!</span>
                <span className="hidden md:inline">✅ Ready to cook!</span>
              </div>
            ) : (
              <div className="bg-warning-subtle text-warning px-3 py-1 rounded-lg text-xs md:text-sm whitespace-nowrap">
                <span className="md:hidden">⚠️ Missing</span>
                <span className="hidden md:inline">⚠️ Missing ingredients</span>
              </div>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#C63721] text-white px-3 py-1 md:px-4 md:py-2 rounded-lg hover:bg-[#A52E1A] text-sm md:text-base whitespace-nowrap cursor-pointer"
            >
              <span className="md:hidden">Edit</span>
              <span className="hidden md:inline">Edit Recipe</span>
            </button>
          )}
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-300 mt-2">
          <span className="mr-6">⏱️ {recipe.cookingTime} minutes</span>
          <span className="mr-6">👥 {recipe.servings} servings</span>
          <span>📅 {new Date(recipe.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tags */}
      {!isEditing && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 md:mb-6">
          {recipe.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-accent dark:bg-orange-900 text-white dark:text-white rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Edit Form */}
      {isEditing ? (
        <div className="space-y-2 md:space-y-3">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="bg-primary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-primary cursor-pointer text-sm md:text-base"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="bg-secondary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-secondary cursor-pointer text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
            <button
              onClick={handleDelete}
              className="bg-error text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-red-700 cursor-pointer text-sm md:text-base transition-colors"
            >
              Delete Recipe
            </button>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipe Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cooking Time (minutes)</label>
                <input
                  type="number"
                  value={editData.cookingTime}
                  onChange={(e) => setEditData(prev => ({ ...prev, cookingTime: parseInt(e.target.value) }))}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servings</label>
                <input
                  type="number"
                  value={editData.servings}
                  onChange={(e) => setEditData(prev => ({ ...prev, servings: parseInt(e.target.value) }))}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h3 className="text-lg font-semibold">Ingredients</h3>
              <button
                onClick={addIngredient}
                className="bg-primary text-white px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm hover:bg-primary cursor-pointer"
              >
                Add Ingredient
              </button>
            </div>
            <div className="space-y-2 md:space-y-3">
              {editData.recipe_ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <CustomDropdown
                    options={[
                      { value: '', label: 'Select an ingredient...' },
                      ...availableIngredients.map((ing) => ({
                        value: ing.name,
                        label: `${ing.name} (${ing.inStock ? 'In Stock' : 'Out of Stock'})`
                      }))
                    ]}
                    value={ingredient.name}
                    onChange={(value) => updateIngredient(index, value)}
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
                  {editData.recipe_ingredients.length > 1 && (
                    <button
                      onClick={() => removeIngredient(index)}
                      className="text-error hover:text-error px-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h3 className="text-lg font-semibold">Instructions</h3>
              <button
                onClick={addInstruction}
                className="bg-primary text-white px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm hover:bg-primary cursor-pointer"
              >
                Add Step
              </button>
            </div>
            <div className="space-y-2 md:space-y-3">
              {editData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-500 mt-2 min-w-[2rem]">{index + 1}.</span>
                  <textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721]"
                    rows={2}
                  />
                  {editData.instructions.length > 1 && (
                    <button
                      onClick={() => removeInstruction(index)}
                      className="text-error hover:text-error px-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6">
            <TagManager
              selectedTags={editData.tags}
              onChange={(tags) => setEditData(prev => ({ ...prev, tags }))}
            />
          </div>

          {/* Image Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6">
            <h3 className="text-lg font-semibold mb-3 md:mb-4">Recipe Photo</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                {uploadingImage ? 'Uploading and compressing...' : 'Image will be uploaded when you save changes'}
              </p>
              {(editData.image_preview || editData.image_path) && (
                <div className="mt-4">
                  {editData.image_preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editData.image_preview}
                      alt="Recipe preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : editData.image_path ? (
                    <CachedImage
                      imagePath={editData.image_path}
                      alt="Recipe preview"
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover rounded-lg"
                      lazy={false}
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Image */}
        {recipe.image_path && (
          <div className="lg:col-span-1">
            <CachedImage
              imagePath={recipe.image_path}
              alt={recipe.name}
              width={400}
              height={300}
              className="w-full rounded-lg shadow-md object-cover"
            />
          </div>
        )}

        {/* Content Container */}
        <div className={`${recipe.image_path ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3 md:space-y-6`}>
          {/* Ingredients */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.recipe_ingredients
                .sort((a, b) => {
                  // Helper function to check if ingredient is in stock
                  const isInStock = (ingredient: { name: string; optional: boolean }) => availableIngredients.some(stockIngredient => 
                    stockIngredient.inStock && (
                      stockIngredient.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                      ingredient.name.toLowerCase().includes(stockIngredient.name.toLowerCase())
                    )
                  );
                  
                  // 1. Required ingredients first (0), optional second (1)
                  const requiredSort = (a.optional ? 1 : 0) - (b.optional ? 1 : 0);
                  if (requiredSort !== 0) return requiredSort;
                  
                  // 2. Within same required/optional group, out of stock first (0), in stock second (1)
                  return (isInStock(a) ? 1 : 0) - (isInStock(b) ? 1 : 0);
                })
                .map((ingredient, index) => {
                const isMissing = missingIngredients.includes(ingredient.name);
                // Check actual stock status for all ingredients (required and optional)
                const isInStock = availableIngredients.some(stockIngredient => 
                  stockIngredient.inStock && (
                    stockIngredient.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                    ingredient.name.toLowerCase().includes(stockIngredient.name.toLowerCase())
                  )
                );
                return (
                  <li
                    key={index}
                    className={`flex items-center ${
                      isMissing ? 'text-error' : 'text-gray-700 dark:text-gray-300'
                    } ${ingredient.optional ? 'opacity-75' : ''}`}
                  >
                    <span className="mr-2">
                      {isInStock ? '✅' : '❌'}
                    </span>
                    <span className={ingredient.optional ? 'italic' : ''}>
                      {ingredient.name}
                    </span>
                    {ingredient.optional && (
                      <span className="ml-2 text-xs text-gray-500">(optional)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Instructions</h2>
            <ol className="space-y-2 md:space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex">
                  <span className="bg-[#C63721] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">{linkifyText(instruction)}</p>
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