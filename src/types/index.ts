export interface Recipe {
  id: string;
  name: string;
  recipe_ingredients: RecipeIngredient[];
  instructions: string[];
  image_path?: string; // Supabase storage path
  image_version?: string; // For cache invalidation
  cookingTime: number; // in minutes
  servings: number;
  tags: string[];
  createdAt: Date;
  family_id?: string; // New field
}

export interface RecipeIngredient {
  name: string;
  optional: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  category: string;
  expiryDate?: Date;
  inStock: boolean;
  family_id?: string; // New field
}

export interface MenuFilter {
  availableOnly: boolean;
  tags: string[];
  maxCookingTime?: number;
}

// New family-related interfaces
export interface Family {
  id: string;
  name?: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMembership {
  id: string;
  family_id: string;
  user_email: string;
  joined_at: string;
}