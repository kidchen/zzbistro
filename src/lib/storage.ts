import { Recipe, Ingredient } from '@/types';
import { supabase } from './supabase';
import { dataCache } from './cache';

// Optimized storage with caching and reduced database calls
export const storage = {
  recipes: {
    getAll: async (useCache = true): Promise<Recipe[]> => {
      const cacheKey = 'recipes';
      
      if (useCache) {
        const cached = dataCache.get<Recipe[]>(cacheKey);
        if (cached) return cached;
      }

      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const recipes = data.map(recipe => ({
          id: recipe.id,
          name: recipe.name,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          image: recipe.image,
          cookingTime: recipe.cooking_time,
          servings: recipe.servings,
          tags: recipe.tags,
          createdAt: new Date(recipe.created_at)
        }));

        dataCache.set(cacheKey, recipes);
        return recipes;
      } catch (error) {
        console.error('Error fetching recipes:', error);
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-recipes');
          return stored ? JSON.parse(stored) : [];
        }
        return [];
      }
    },
    
    add: async (recipe: Recipe): Promise<Recipe | null> => {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .insert({
            name: recipe.name,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            image: recipe.image,
            cooking_time: recipe.cookingTime,
            servings: recipe.servings,
            tags: recipe.tags
          })
          .select()
          .single();

        if (error) throw error;

        const newRecipe = {
          id: data.id,
          name: data.name,
          ingredients: data.ingredients,
          instructions: data.instructions,
          image: data.image,
          cookingTime: data.cooking_time,
          servings: data.servings,
          tags: data.tags,
          createdAt: new Date(data.created_at)
        };

        // Update cache instead of refetching
        const cached = dataCache.get<Recipe[]>('recipes');
        if (cached) {
          cached.unshift(newRecipe);
          dataCache.set('recipes', cached);
        }

        return newRecipe;
      } catch (error) {
        console.error('Error adding recipe:', error);
        return recipe;
      }
    },
    
    update: async (id: string, updatedRecipe: Recipe): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('recipes')
          .update({
            name: updatedRecipe.name,
            ingredients: updatedRecipe.ingredients,
            instructions: updatedRecipe.instructions,
            image: updatedRecipe.image,
            cooking_time: updatedRecipe.cookingTime,
            servings: updatedRecipe.servings,
            tags: updatedRecipe.tags
          })
          .eq('id', id);

        if (error) throw error;

        // Update cache instead of refetching
        const cached = dataCache.get<Recipe[]>('recipes');
        if (cached) {
          const index = cached.findIndex(r => r.id === id);
          if (index !== -1) {
            cached[index] = updatedRecipe;
            dataCache.set('recipes', cached);
          }
        }

        return true;
      } catch (error) {
        console.error('Error updating recipe:', error);
        return false;
      }
    },
    
    delete: async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('recipes')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Update cache instead of refetching
        const cached = dataCache.get<Recipe[]>('recipes');
        if (cached) {
          const filtered = cached.filter(r => r.id !== id);
          dataCache.set('recipes', filtered);
        }

        return true;
      } catch (error) {
        console.error('Error deleting recipe:', error);
        return false;
      }
    }
  },
  
  ingredients: {
    getAll: async (useCache = true): Promise<Ingredient[]> => {
      const cacheKey = 'ingredients';
      
      if (useCache) {
        const cached = dataCache.get<Ingredient[]>(cacheKey);
        if (cached) return cached;
      }

      try {
        const { data, error } = await supabase
          .from('ingredients')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        const ingredients = data.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          category: ingredient.category,
          expiryDate: ingredient.expiry_date ? new Date(ingredient.expiry_date) : undefined,
          inStock: ingredient.in_stock
        }));

        dataCache.set(cacheKey, ingredients);
        return ingredients;
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-ingredients');
          return stored ? JSON.parse(stored) : [];
        }
        return [];
      }
    },
    
    add: async (ingredient: Ingredient): Promise<Ingredient | null> => {
      try {
        const { data, error } = await supabase
          .from('ingredients')
          .insert({
            name: ingredient.name,
            quantity: ingredient.quantity,
            category: ingredient.category,
            expiry_date: ingredient.expiryDate?.toISOString().split('T')[0],
            in_stock: ingredient.inStock
          })
          .select()
          .single();

        if (error) throw error;

        const newIngredient = {
          id: data.id,
          name: data.name,
          quantity: data.quantity,
          category: data.category,
          expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
          inStock: data.in_stock
        };

        // Update cache instead of refetching
        const cached = dataCache.get<Ingredient[]>('ingredients');
        if (cached) {
          cached.push(newIngredient);
          cached.sort((a, b) => a.name.localeCompare(b.name));
          dataCache.set('ingredients', cached);
        }

        return newIngredient;
      } catch (error) {
        console.error('Error adding ingredient:', error);
        return ingredient;
      }
    },
    
    update: async (id: string, updatedIngredient: Ingredient): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('ingredients')
          .update({
            name: updatedIngredient.name,
            quantity: updatedIngredient.quantity,
            category: updatedIngredient.category,
            expiry_date: updatedIngredient.expiryDate?.toISOString().split('T')[0],
            in_stock: updatedIngredient.inStock
          })
          .eq('id', id);

        if (error) throw error;

        // Update cache instead of refetching
        const cached = dataCache.get<Ingredient[]>('ingredients');
        if (cached) {
          const index = cached.findIndex(i => i.id === id);
          if (index !== -1) {
            cached[index] = updatedIngredient;
            dataCache.set('ingredients', cached);
          }
        }

        return true;
      } catch (error) {
        console.error('Error updating ingredient:', error);
        return false;
      }
    },
    
    delete: async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('ingredients')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Update cache instead of refetching
        const cached = dataCache.get<Ingredient[]>('ingredients');
        if (cached) {
          const filtered = cached.filter(i => i.id !== id);
          dataCache.set('ingredients', filtered);
        }

        return true;
      } catch (error) {
        console.error('Error deleting ingredient:', error);
        return false;
      }
    },

    batchUpdate: async (updates: { id: string; data: Partial<Ingredient> }[]): Promise<void> => {
      try {
        // Update in database
        const promises = updates.map(({ id, data }) => 
          supabase.from('ingredients').update({
            name: data.name,
            quantity: data.quantity,
            category: data.category,
            expiry_date: data.expiryDate?.toISOString(),
            in_stock: data.inStock,
            updated_at: new Date().toISOString()
          }).eq('id', id)
        );

        await Promise.all(promises);
        
        // Clear cache to force refresh
        dataCache.clear();
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          const current = await storage.ingredients.getAll(false);
          localStorage.setItem('zzbistro-ingredients', JSON.stringify(current));
        }
      } catch (error) {
        console.error('Error batch updating ingredients:', error);
        throw error;
      }
    }
  },

  // Utility to clear all caches (useful for force refresh)
  clearCache: () => {
    dataCache.clear();
  }
};
