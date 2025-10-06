import { Recipe, Ingredient, Family, FamilyMembership } from '@/types';
import { supabase } from './supabase';
import { dataCache } from './cache';

// Helper function to get user's family ID
export const getUserFamilyId = async (userEmail: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('family_memberships')
      .select('family_id')
      .eq('user_email', userEmail)
      .single();

    if (error || !data) return null;
    return data.family_id;
  } catch (error) {
    console.error('Error getting user family ID:', error);
    return null;
  }
};

// Optimized storage with caching and reduced database calls
export const storage = {
  recipes: {
    getAll: async (useCache = true, fields?: string[]): Promise<Recipe[]> => {
      const cacheKey = `recipes${fields ? `-${fields.join(',')}` : ''}`;
      
      if (useCache) {
        const cached = dataCache.get<Recipe[]>(cacheKey);
        if (cached) return cached;
      }

      try {
        const selectFields = fields?.join(',') || '*';
        const { data, error } = await supabase
          .from('recipes')
          .select(selectFields)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipes = (data as any[]).map((recipe) => ({
          id: recipe.id,
          name: recipe.name,
          recipe_ingredients: recipe.recipe_ingredients,
          instructions: recipe.instructions,
          image_path: recipe.image_path,
          image_version: recipe.image_version,
          cookingTime: recipe.cooking_time,
          servings: recipe.servings,
          tags: recipe.tags,
          createdAt: new Date(recipe.created_at)
        }));

        // Update cache with fresh data if this was a background refresh
        if (useCache) {
          dataCache.refresh(cacheKey, recipes);
        } else {
          dataCache.set(cacheKey, recipes, 30 * 60 * 1000); // 30 min for recipes (static content)
        }
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

    // Get recipe summaries for list views (lighter payload)
    getSummaries: async (useCache = true): Promise<Partial<Recipe>[]> => {
      return storage.recipes.getAll(useCache, [
        'id', 'name', 'image_path', 'image_version', 'cooking_time', 'servings', 'tags', 'created_at'
      ]);
    },
    
    add: async (recipe: Recipe): Promise<Recipe | null> => {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .insert({
            name: recipe.name,
            recipe_ingredients: recipe.recipe_ingredients,
            instructions: recipe.instructions,
            image_path: recipe.image_path,
            image_version: recipe.image_version,
            cooking_time: recipe.cookingTime,
            servings: recipe.servings,
            tags: recipe.tags,
            family_id: recipe.family_id
          })
          .select()
          .single();

        if (error) throw error;

        const newRecipe = {
          id: data.id,
          name: data.name,
          recipe_ingredients: data.recipe_ingredients,
          instructions: data.instructions,
          image_path: data.image_path,
          image_version: data.image_version,
          cookingTime: data.cooking_time,
          servings: data.servings,
          tags: data.tags,
          createdAt: new Date(data.created_at)
        };

        // Update all recipe caches
        ['recipes', 'recipes-id,name,image_path,image_version,cooking_time,servings,tags,created_at'].forEach(key => {
          const cached = dataCache.get<Recipe[]>(key);
          if (cached) {
            cached.unshift(newRecipe);
            dataCache.set(key, cached);
          }
        });

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
            recipe_ingredients: updatedRecipe.recipe_ingredients,
            instructions: updatedRecipe.instructions,
            image_path: updatedRecipe.image_path,
            image_version: updatedRecipe.image_version,
            cooking_time: updatedRecipe.cookingTime,
            servings: updatedRecipe.servings,
            tags: updatedRecipe.tags,
            family_id: updatedRecipe.family_id
          })
          .eq('id', id);

        if (error) throw error;

        // Update all recipe caches
        ['recipes', 'recipes-id,name,image_path,image_version,cooking_time,servings,tags,created_at'].forEach(key => {
          const cached = dataCache.get<Recipe[]>(key);
          if (cached) {
            const index = cached.findIndex(r => r.id === id);
            if (index !== -1) {
              cached[index] = updatedRecipe;
              dataCache.set(key, cached);
            }
          }
        });

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

        // Update all recipe caches
        ['recipes', 'recipes-id,name,image_path,image_version,cooking_time,servings,tags,created_at'].forEach(key => {
          const cached = dataCache.get<Recipe[]>(key);
          if (cached) {
            const filtered = cached.filter(r => r.id !== id);
            dataCache.set(key, filtered);
          }
        });

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
            in_stock: ingredient.inStock,
            family_id: ingredient.family_id
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
        // Use single transaction for better performance
        const { error } = await supabase.rpc('batch_update_ingredients', {
          updates: updates.map(({ id, data }) => ({
            id,
            name: data.name,
            quantity: data.quantity,
            category: data.category,
            expiry_date: data.expiryDate?.toISOString().split('T')[0],
            in_stock: data.inStock
          }))
        });

        if (error) {
          // Fallback to individual updates if RPC not available
          const promises = updates.map(({ id, data }) => 
            supabase.from('ingredients').update({
              name: data.name,
              quantity: data.quantity,
              category: data.category,
              expiry_date: data.expiryDate?.toISOString().split('T')[0],
              in_stock: data.inStock,
              updated_at: new Date().toISOString()
            }).eq('id', id)
          );
          await Promise.all(promises);
        }
        
        // Clear cache to force refresh
        dataCache.invalidate('ingredients');
        
      } catch (error) {
        console.error('Error batch updating ingredients:', error);
        throw error;
      }
    }
  },

  // Family management functions
  families: {
    // Create a new family
    create: async (ownerEmail: string, name?: string): Promise<Family> => {
      try {
        const defaultName = name || `${ownerEmail.split('@')[0]}'s family`;
        
        const { data, error } = await supabase
          .from('families')
          .insert({
            name: defaultName,
            owner_email: ownerEmail
          })
          .select()
          .single();

        if (error) throw error;

        // Add owner as first member
        await supabase
          .from('family_memberships')
          .insert({
            family_id: data.id,
            user_email: ownerEmail
          });

        return {
          id: data.id,
          name: data.name,
          owner_email: data.owner_email,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error) {
        console.error('Error creating family:', error);
        throw error;
      }
    },

    // Get family by user email
    getByUserEmail: async (userEmail: string): Promise<Family | null> => {
      const cacheKey = `family-${userEmail}`;
      
      const cached = dataCache.get<Family>(cacheKey);
      if (cached) return cached;

      try {
        const { data, error } = await supabase
          .from('family_memberships')
          .select(`
            family_id,
            families (
              id,
              name,
              owner_email,
              created_at,
              updated_at
            )
          `)
          .eq('user_email', userEmail)
          .single();

        if (error || !data?.families) return null;

        const family = Array.isArray(data.families) ? data.families[0] : data.families;
        const result = {
          id: family.id,
          name: family.name,
          owner_email: family.owner_email,
          created_at: family.created_at,
          updated_at: family.updated_at
        };

        dataCache.set(cacheKey, result, 5 * 60 * 1000); // 5 min cache
        return result;
      } catch (error) {
        console.error('Error getting family by user email:', error);
        return null;
      }
    },

    // Update family name (owner only)
    updateName: async (familyId: string, name: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('families')
          .update({ name })
          .eq('id', familyId);

        if (error) throw error;
        
        // Invalidate family cache
        dataCache.invalidatePattern('family-');
      } catch (error) {
        console.error('Error updating family name:', error);
        throw error;
      }
    },

    // Add member to family (owner only)
    addMember: async (familyId: string, userEmail: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('family_memberships')
          .insert({
            family_id: familyId,
            user_email: userEmail
          });

        if (error) throw error;
        
        // Invalidate family cache for the new member
        dataCache.invalidate(`family-${userEmail}`);
      } catch (error) {
        console.error('Error adding family member:', error);
        throw error;
      }
    },

    // Remove member from family (owner only)
    removeMember: async (familyId: string, userEmail: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('family_memberships')
          .delete()
          .eq('family_id', familyId)
          .eq('user_email', userEmail);

        if (error) throw error;
        
        // Invalidate family cache for the removed member
        dataCache.invalidate(`family-${userEmail}`);
      } catch (error) {
        console.error('Error removing family member:', error);
        throw error;
      }
    },

    // Get all family members
    getMembers: async (familyId: string): Promise<FamilyMembership[]> => {
      try {
        const { data, error } = await supabase
          .from('family_memberships')
          .select('*')
          .eq('family_id', familyId)
          .order('joined_at', { ascending: true });

        if (error) throw error;

        return data.map(member => ({
          id: member.id,
          family_id: member.family_id,
          user_email: member.user_email,
          joined_at: member.joined_at
        }));
      } catch (error) {
        console.error('Error getting family members:', error);
        throw error;
      }
    },

    // Leave family (any member)
    leave: async (userEmail: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('family_memberships')
          .delete()
          .eq('user_email', userEmail);

        if (error) throw error;
        
        // Invalidate family cache for the user leaving
        dataCache.invalidate(`family-${userEmail}`);
      } catch (error) {
        console.error('Error leaving family:', error);
        throw error;
      }
    },

    // Delete family (owner only)
    delete: async (familyId: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('families')
          .delete()
          .eq('id', familyId);

        if (error) throw error;
        
        // Invalidate all family cache since family is deleted
        dataCache.invalidatePattern('family-');
      } catch (error) {
        console.error('Error deleting family:', error);
        throw error;
      }
    }
  },

  // Utility to clear all caches (useful for force refresh)
  clearCache: () => {
    dataCache.clear();
  },

  // Get cache statistics
  getCacheStats: () => {
    return dataCache.getStats();
  }
};
