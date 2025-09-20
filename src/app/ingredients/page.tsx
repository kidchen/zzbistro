'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { Ingredient } from '@/types';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: '',
    category: 'Other',
    expiryDate: '',
    inStock: true
  });

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const ingredientsData = await storage.ingredients.getAll();
        setIngredients(ingredientsData);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      }
    };

    loadIngredients();
  }, []);

  const categories = ['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Condiments', 'Other'];

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const ingredient: Ingredient = {
      id: crypto.randomUUID(),
      name: formData.name,
      quantity: formData.quantity,
      unit: formData.unit,
      category: formData.category,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      inStock: formData.inStock
    };

    try {
      await storage.ingredients.add(ingredient);
      const updatedIngredients = await storage.ingredients.getAll();
      setIngredients(updatedIngredients);
      setFormData({
        name: '',
        quantity: 1,
        unit: '',
        category: 'Other',
        expiryDate: '',
        inStock: true
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      alert('Failed to add ingredient. Please try again.');
    }
  };

  const toggleStock = async (id: string) => {
    const ingredient = ingredients.find(i => i.id === id);
    if (ingredient) {
      const updated = { ...ingredient, inStock: !ingredient.inStock };
      try {
        await storage.ingredients.update(id, updated);
        const updatedIngredients = await storage.ingredients.getAll();
        setIngredients(updatedIngredients);
      } catch (error) {
        console.error('Error updating ingredient:', error);
        alert('Failed to update ingredient. Please try again.');
      }
    }
  };

  const deleteIngredient = async (id: string) => {
    if (confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await storage.ingredients.delete(id);
        const updatedIngredients = await storage.ingredients.getAll();
        setIngredients(updatedIngredients);
      } catch (error) {
        console.error('Error deleting ingredient:', error);
        alert('Failed to delete ingredient. Please try again.');
      }
    }
  };

  const inStockCount = ingredients.filter(i => i.inStock).length;
  const outOfStockCount = ingredients.filter(i => !i.inStock).length;
  const expiringCount = ingredients.filter(i => 
    i.expiryDate && new Date(i.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pantry Management 🥫</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Ingredient'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{inStockCount}</div>
          <div className="text-green-700">In Stock</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          <div className="text-red-700">Out of Stock</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{expiringCount}</div>
          <div className="text-yellow-700">Expiring Soon</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Ingredient</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Tomatoes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., lbs, cups, pieces"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={formData.inStock}
                onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="inStock" className="text-sm font-medium text-gray-700">
                In Stock
              </label>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700"
              >
                Add Ingredient
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ingredients..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ingredients List */}
      {filteredIngredients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🥫</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {ingredients.length === 0 ? 'No ingredients yet!' : 'No ingredients match your search'}
          </h2>
          <p className="text-gray-600">
            {ingredients.length === 0 
              ? 'Start by adding ingredients to your pantry.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingredient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIngredients.map((ingredient) => {
                  const isExpiringSoon = ingredient.expiryDate && 
                    new Date(ingredient.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <tr key={ingredient.id} className={ingredient.inStock ? '' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ingredient.quantity} {ingredient.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {ingredient.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ingredient.expiryDate ? (
                          <span className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                            {new Date(ingredient.expiryDate).toLocaleDateString()}
                            {isExpiringSoon && ' ⚠️'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStock(ingredient.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            ingredient.inStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ingredient.inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteIngredient(ingredient.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}