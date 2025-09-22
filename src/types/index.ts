export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  cookingTime: number; // in minutes
  servings: number;
  tags: string[];
  createdAt: Date;
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