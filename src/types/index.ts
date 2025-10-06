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
}

export interface MenuFilter {
  availableOnly: boolean;
  tags: string[];
  maxCookingTime?: number;
}