import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false, // Disable since we're using NextAuth
    persistSession: false,   // Disable since we're using NextAuth
    detectSessionInUrl: false
  },
  global: {
    headers: { 'x-my-custom-header': 'zzbistro' },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          name: string;
          recipe_ingredients: { name: string; optional: boolean }[];
          instructions: string[];
          image?: string;
          cooking_time: number;
          servings: number;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          recipe_ingredients: { name: string; optional: boolean }[];
          instructions: string[];
          image?: string;
          cooking_time: number;
          servings: number;
          tags: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          ingredients?: string[];
          instructions?: string[];
          image?: string;
          cooking_time?: number;
          servings?: number;
          tags?: string[];
          updated_at?: string;
        };
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          quantity: number;
          unit: string;
          category: string;
          expiry_date?: string;
          in_stock: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          quantity: number;
          unit: string;
          category: string;
          expiry_date?: string;
          in_stock: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          category?: string;
          expiry_date?: string;
          in_stock?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}