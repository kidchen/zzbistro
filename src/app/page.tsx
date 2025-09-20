'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { Recipe, Ingredient } from '@/types';

export default function Home() {
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalIngredients: 0,
    inStockIngredients: 0,
    availableRecipes: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const recipes = await storage.recipes.getAll();
        const ingredients = await storage.ingredients.getAll();
        const inStock = ingredients.filter(i => i.inStock);
        
        // Calculate available recipes (recipes where all ingredients are in stock)
        const availableRecipes = recipes.filter(recipe => 
          recipe.ingredients.every(ingredient => 
            inStock.some(stock => 
              stock.name.toLowerCase().includes(ingredient.toLowerCase()) ||
              ingredient.toLowerCase().includes(stock.name.toLowerCase())
            )
          )
        );

        setStats({
          totalRecipes: recipes.length,
          totalIngredients: ingredients.length,
          inStockIngredients: inStock.length,
          availableRecipes: availableRecipes.length
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const quickActions = [
    {
      title: 'Add Recipe',
      description: 'Record a new recipe with ingredients and photos',
      href: '/recipes/new',
      icon: '📝',
      color: 'bg-blue-500'
    },
    {
      title: 'Update Pantry',
      description: 'Manage your ingredient inventory',
      href: '/ingredients',
      icon: '🥫',
      color: 'bg-green-500'
    },
    {
      title: 'Browse Menu',
      description: 'See what you can cook right now',
      href: '/menu',
      icon: '🍽️',
      color: 'bg-purple-500'
    },
    {
      title: "I'm Feeling Lucky",
      description: 'Get a random meal suggestion',
      href: '/lucky',
      icon: '🎲',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ZZBistro! 👨‍🍳👩‍🍳
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your personal cooking companion. Manage recipes, track ingredients, and discover delicious meals together.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.totalRecipes}</div>
          <div className="text-gray-600">Total Recipes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.inStockIngredients}</div>
          <div className="text-gray-600">In Stock</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.availableRecipes}</div>
          <div className="text-gray-600">Ready to Cook</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.totalIngredients}</div>
          <div className="text-gray-600">Total Ingredients</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center group"
          >
            <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
              <span className="text-2xl">{action.icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
            <p className="text-gray-600 text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Getting Started */}
      {stats.totalRecipes === 0 && (
        <div className="mt-12 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-orange-800 mb-3">🚀 Getting Started</h2>
          <p className="text-orange-700 mb-4">
            Welcome to your new cooking companion! Here's how to get started:
          </p>
          <ol className="list-decimal list-inside text-orange-700 space-y-2">
            <li>Add some ingredients to your pantry</li>
            <li>Record your favorite recipes</li>
            <li>Use the menu to see what you can cook</li>
            <li>Try "I'm Feeling Lucky" when you need inspiration!</li>
          </ol>
        </div>
      )}
    </div>
  );
}
