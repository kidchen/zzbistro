'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Ingredient } from '@/types';

export default function IngredientsPage() {
  const searchParams = useSearchParams();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState(['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Condiments', 'Other']);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'expiryDate' | 'inStock' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    category: 'Other',
    expiryDate: '',
    inStock: true
  });

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const ingredientsData = await storage.ingredients.getAll();
        setIngredients(ingredientsData);
        
        // Handle filter parameter from URL
        const filter = searchParams.get('filter');
        if (filter === 'instock') {
          // Auto-filter to show only in-stock items
          setSelectedCategory('');
          setSearchTerm('');
        }
      } catch (error) {
        console.error('Error loading ingredients:', error);
      }
    };

    loadIngredients();
  }, [searchParams]);

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    if (categoryToRemove === 'Other') return; // Don't allow removing 'Other'
    
    const isUsed = ingredients.some(ingredient => ingredient.category === categoryToRemove);
    if (isUsed) {
      alert('Cannot remove category that is currently in use by ingredients.');
      return;
    }
    
    setCategories(categories.filter(cat => cat !== categoryToRemove));
  };

  const handleSort = (column: 'name' | 'expiryDate' | 'inStock') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: 'name' | 'expiryDate' | 'inStock') => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || ingredient.category === selectedCategory;
    
    // Handle URL filter parameter
    const filter = searchParams.get('filter');
    const matchesFilter = !filter || (filter === 'instock' && ingredient.inStock);
    
    return matchesSearch && matchesCategory && matchesFilter;
  }).sort((a, b) => {
    if (!sortBy) return 0;
    
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'expiryDate') {
      const aDate = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      const bDate = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      comparison = aDate - bDate;
    } else if (sortBy === 'inStock') {
      comparison = Number(b.inStock) - Number(a.inStock); // In stock first
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getSuggestions = (input: string) => {
    if (input.length < 2) return [];
    
    const normalizedInput = input.toLowerCase().trim();
    return ingredients
      .filter(ingredient => 
        ingredient.name.toLowerCase().includes(normalizedInput)
      )
      .slice(0, 5); // Limit to 5 suggestions
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    setShowSuggestions(value.length >= 2);
  };

  const selectSuggestion = (ingredient: Ingredient) => {
    setShowSuggestions(false);
    setShowAddForm(false);
    // Scroll to the ingredient in the table and highlight it
    setEditingId(`${ingredient.id}-highlight`);
    setTimeout(() => setEditingId(null), 3000); // Remove highlight after 3 seconds
  };

  const checkForDuplicates = (newName: string): string | null => {
    const normalizedNew = newName.toLowerCase().trim();
    
    for (const ingredient of ingredients) {
      const normalizedExisting = ingredient.name.toLowerCase().trim();
      
      // Exact match (works for any language)
      if (normalizedNew === normalizedExisting) {
        return ingredient.name;
      }
      
      // Simple similarity check: if names are very similar in length and share most characters
      if (Math.abs(normalizedNew.length - normalizedExisting.length) <= 2) {
        const shorter = normalizedNew.length < normalizedExisting.length ? normalizedNew : normalizedExisting;
        const longer = normalizedNew.length >= normalizedExisting.length ? normalizedNew : normalizedExisting;
        
        if (longer.includes(shorter) && shorter.length >= 3) {
          return ingredient.name;
        }
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicates
    const duplicate = checkForDuplicates(formData.name);
    if (duplicate) {
      alert(`Similar ingredient "${duplicate}" already exists. Please update the existing ingredient instead.`);
      return;
    }
    
    const ingredient: Ingredient = {
      id: crypto.randomUUID(),
      name: formData.name,
      quantity: formData.quantity,
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

  const updateCategory = async (id: string, newCategory: string) => {
    const ingredient = ingredients.find(i => i.id === id);
    if (ingredient) {
      const updated = { ...ingredient, category: newCategory };
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

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity < 0) return; // Don't update if invalid
    
    const ingredient = ingredients.find(i => i.id === id);
    if (ingredient) {
      const updated = { ...ingredient, quantity: newQuantity };
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
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Pantry Management 🥫</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className="bg-gray-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base"
          >
            Manage Categories
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm md:text-base"
          >
            {showAddForm ? 'Cancel' : 'Add Ingredient'}
          </button>
        </div>
      </div>

      {/* Category Manager */}
      {showCategoryManager && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Categories</h2>
          
          {/* Add Category */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <button
              onClick={addCategory}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add
            </button>
          </div>
          
          {/* Category List */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map(category => (
              <div key={category} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                <span className="text-sm">{category}</span>
                {category !== 'Other' && (
                  <button
                    onClick={() => removeCategory(category)}
                    className="text-red-600 hover:text-red-800 text-sm ml-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats - Desktop: Cards, Mobile: Table */}
      <div className="mb-6">
        {/* Desktop Cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
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

        {/* Mobile Table */}
        <div className="md:hidden bg-white rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">In Stock</span>
            <span className="text-lg font-bold text-green-600">{inStockCount}</span>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">Out of Stock</span>
            <span className="text-lg font-bold text-red-600">{outOfStockCount}</span>
          </div>
          <div className="flex justify-between items-center p-3">
            <span className="text-sm text-gray-600">Expiring Soon</span>
            <span className="text-lg font-bold text-yellow-600">{expiringCount}</span>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Ingredient</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Tomatoes"
                />
                
                {/* Auto-suggest dropdown */}
                {showSuggestions && getSuggestions(formData.name).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                      Existing ingredients (click to edit):
                    </div>
                    {getSuggestions(formData.name).map((ingredient) => (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => selectSuggestion(ingredient)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{ingredient.name}</span>
                          <span className="text-xs text-gray-500">
                            {ingredient.quantity} • {ingredient.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
            <div className="md:col-span-2">
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
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-8">
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
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Ingredient
                      <span className="text-sm">{getSortIcon('name')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('expiryDate')}
                  >
                    <div className="flex items-center gap-1">
                      Expiry
                      <span className="text-sm">{getSortIcon('expiryDate')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('inStock')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <span className="text-sm">{getSortIcon('inStock')}</span>
                    </div>
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
                    <tr key={ingredient.id} className={`${ingredient.inStock ? '' : 'bg-gray-50'} ${editingId === `${ingredient.id}-highlight` ? 'bg-yellow-100' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === `${ingredient.id}-quantity` ? (
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={ingredient.quantity}
                            onChange={(e) => updateQuantity(ingredient.id, parseFloat(e.target.value) || 0)}
                            onBlur={() => setEditingId(null)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingId(`${ingredient.id}-quantity`)}
                            className="text-left hover:bg-gray-100 px-2 py-1 rounded"
                          >
                            {ingredient.quantity}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === `${ingredient.id}-category` ? (
                          <select
                            value={ingredient.category}
                            onChange={(e) => updateCategory(ingredient.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            autoFocus
                          >
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingId(`${ingredient.id}-category`)}
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                          >
                            {ingredient.category}
                          </button>
                        )}
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