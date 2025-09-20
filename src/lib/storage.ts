import { Recipe, Ingredient } from '@/types';
import { supabase } from './supabase';

// Supabase-based storage with localStorage fallback for offline support
export const storage = {
  recipes: {
    getAll: async (): Promise<Recipe[]> => {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(recipe => ({
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
      } catch (error) {
        console.error('Error fetching recipes:', error);
        // Fallback to localStorage
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

        // Also save to localStorage as backup
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-recipes');
          const recipes = stored ? JSON.parse(stored) : [];
          recipes.push(newRecipe);
          localStorage.setItem('zzbistro-recipes', JSON.stringify(recipes));
        }

        return newRecipe;
      } catch (error) {
        console.error('Error adding recipe:', error);
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-recipes');
          const recipes = stored ? JSON.parse(stored) : [];
          recipes.push(recipe);
          localStorage.setItem('zzbistro-recipes', JSON.stringify(recipes));
        }
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

        // Also update localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-recipes');
          const recipes = stored ? JSON.parse(stored) : [];
          const index = recipes.findIndex((r: Recipe) => r.id === id);
          if (index !== -1) {
            recipes[index] = updatedRecipe;
            localStorage.setItem('zzbistro-recipes', JSON.stringify(recipes));
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

        // Also remove from localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-recipes');
          const recipes = stored ? JSON.parse(stored) : [];
          const filtered = recipes.filter((r: Recipe) => r.id !== id);
          localStorage.setItem('zzbistro-recipes', JSON.stringify(filtered));
        }

        return true;
      } catch (error) {
        console.error('Error deleting recipe:', error);
        return false;
      }
    }
  },
  
  ingredients: {
    getAll: async (): Promise<Ingredient[]> => {
      try {
        const { data, error } = await supabase
          .from('ingredients')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        return data.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category,
          expiryDate: ingredient.expiry_date ? new Date(ingredient.expiry_date) : undefined,
          inStock: ingredient.in_stock
        }));
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        // Fallback to localStorage
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
            unit: ingredient.unit,
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
          unit: data.unit,
          category: data.category,
          expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
          inStock: data.in_stock
        };

        // Also save to localStorage as backup
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-ingredients');
          const ingredients = stored ? JSON.parse(stored) : [];
          ingredients.push(newIngredient);
          localStorage.setItem('zzbistro-ingredients', JSON.stringify(ingredients));
        }

        return newIngredient;
      } catch (error) {
        console.error('Error adding ingredient:', error);
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-ingredients');
          const ingredients = stored ? JSON.parse(stored) : [];
          ingredients.push(ingredient);
          localStorage.setItem('zzbistro-ingredients', JSON.stringify(ingredients));
        }
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
            unit: updatedIngredient.unit,
            category: updatedIngredient.category,
            expiry_date: updatedIngredient.expiryDate?.toISOString().split('T')[0],
            in_stock: updatedIngredient.inStock
          })
          .eq('id', id);

        if (error) throw error;

        // Also update localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-ingredients');
          const ingredients = stored ? JSON.parse(stored) : [];
          const index = ingredients.findIndex((i: Ingredient) => i.id === id);
          if (index !== -1) {
            ingredients[index] = updatedIngredient;
            localStorage.setItem('zzbistro-ingredients', JSON.stringify(ingredients));
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

        // Also remove from localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('zzbistro-ingredients');
          const ingredients = stored ? JSON.parse(stored) : [];
          const filtered = ingredients.filter((i: Ingredient) => i.id !== id);
          localStorage.setItem('zzbistro-ingredients', JSON.stringify(filtered));
        }

        return true;
      } catch (error) {
        console.error('Error deleting ingredient:', error);
        return false;
      }
    }
  }
};