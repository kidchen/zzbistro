'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Ingredient } from '@/types';
import CustomDropdown from '@/components/CustomDropdown';

export default function IngredientsPage() {
  const searchParams = useSearchParams();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [bulkEditData, setBulkEditData] = useState<{[key: string]: Ingredient}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState<'instock' | 'outofstock' | 'expiring' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [categories, setCategories] = useState(['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Condiments', 'Other']);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoryPanelExpanded, setCategoryPanelExpanded] = useState(false);
  const [addFormExpanded, setAddFormExpanded] = useState(false);
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
      } finally {
        setIsLoading(false);
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

  const filteredIngredients = (() => {
    // Combine original ingredients with new ones from bulk edit
    let allIngredients = ingredients;
    if (isBulkEdit) {
      const newIngredients = Object.values(bulkEditData).filter(ing => ing.id.startsWith('temp-'));
      allIngredients = [...ingredients, ...newIngredients];
    }
    
    return allIngredients.filter(ingredient => {
      const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || ingredient.category === selectedCategory;
      
      // Handle URL filter parameter
      const filter = searchParams.get('filter');
      const matchesFilter = !filter || (filter === 'instock' && ingredient.inStock);
      
      // Handle card filter
      const matchesCardFilter = !activeFilter || 
        (activeFilter === 'instock' && ingredient.inStock) ||
        (activeFilter === 'outofstock' && !ingredient.inStock) ||
        (activeFilter === 'expiring' && ingredient.expiryDate && 
          new Date(ingredient.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesCategory && matchesFilter && matchesCardFilter;
    });
  })().sort((a, b) => {
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

  // Pagination
  const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIngredients = filteredIngredients.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, activeFilter]);

  const hasUnsavedChanges = useCallback(() => {
    // Check if there are items selected for deletion
    if (selectedForDelete.size > 0) return true;
    
    // Check if there are new ingredients (temp IDs)
    const hasNewIngredients = Object.keys(bulkEditData).some(id => id.startsWith('temp-'));
    if (hasNewIngredients) return true;
    
    // Check if existing ingredients have been modified
    for (const [id, editedData] of Object.entries(bulkEditData)) {
      if (id.startsWith('temp-')) continue; // Skip new ingredients, already checked above
      
      const originalData = ingredients.find(ing => ing.id === id);
      if (!originalData) continue;
      
      // Compare key fields for changes
      if (
        editedData.name !== originalData.name ||
        editedData.quantity !== originalData.quantity ||
        editedData.category !== originalData.category ||
        editedData.inStock !== originalData.inStock ||
        (editedData.expiryDate?.getTime() || 0) !== (originalData.expiryDate?.getTime() || 0)
      ) {
        return true;
      }
    }
    
    return false;
  }, [selectedForDelete, bulkEditData, ingredients]);

  // Add beforeunload event listener for unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isBulkEdit && hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isBulkEdit, hasUnsavedChanges]);

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

  const selectSuggestion = () => {
    setShowSuggestions(false);
    setShowAddForm(false);
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
      quantity: formData.inStock ? formData.quantity : 0,
      category: formData.category,
      expiryDate: formData.inStock ? (formData.expiryDate ? new Date(formData.expiryDate) : undefined) : undefined,
      inStock: formData.inStock
    };

    if (!isBulkEdit) {
      // Old behavior for non-bulk mode
      try {
        const newIngredient = await storage.ingredients.add(ingredient);
        if (newIngredient) {
          setIngredients(prev => [...prev, newIngredient].sort((a, b) => a.name.localeCompare(b.name)));
        }
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
      }
    } else {
      // New behavior for bulk edit mode - add to bulk edit data
      const tempId = `temp-${Date.now()}`;
      const newIngredient = {
        ...ingredient,
        id: tempId
      };
      
      setBulkEditData(prev => ({
        ...prev,
        [tempId]: newIngredient
      }));
      
      setFormData({
        name: '',
        quantity: 1,
        category: 'Other',
        expiryDate: '',
        inStock: true
      });
    }
  };

  const cancelBulkEdit = () => {
    if (hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        resetBulkEdit();
      }
    } else {
      resetBulkEdit();
    }
  };

  const resetBulkEdit = () => {
    setIsBulkEdit(false);
    setBulkEditData({});
    setSelectedForDelete(new Set());
    setShowCategoryManager(false);
    setShowAddForm(false);
    setCategoryPanelExpanded(false);
    setAddFormExpanded(false);
  };

  const toggleBulkEdit = () => {
    if (isBulkEdit) {
      // Save all changes only if there are actual changes
      if (hasUnsavedChanges()) {
        saveBulkChanges();
      }
      resetBulkEdit();
    } else {
      // Enter bulk edit mode
      const editData: {[key: string]: Ingredient} = {};
      ingredients.forEach(ing => {
        editData[ing.id] = { ...ing };
      });
      setBulkEditData(editData);
      setShowCategoryManager(true);
      setShowAddForm(true);
      setIsBulkEdit(true);
      setSelectedForDelete(new Set());
    }
  };

  const saveBulkChanges = async () => {
    try {
      // Delete selected items first
      if (selectedForDelete.size > 0) {
        const existingIds = Array.from(selectedForDelete).filter(id => !id.startsWith('temp-'));
        if (existingIds.length > 0) {
          await Promise.all(existingIds.map(id => storage.ingredients.delete(id)));
        }
      }
      
      // Separate new and existing ingredients
      const newIngredients = Object.entries(bulkEditData)
        .filter(([id]) => id.startsWith('temp-') && !selectedForDelete.has(id))
        .map(([, data]) => data);
      
      const updates = Object.entries(bulkEditData)
        .filter(([id]) => !id.startsWith('temp-') && !selectedForDelete.has(id))
        .map(([id, data]) => ({ id, data }));
      
      // Add new ingredients
      const addedIngredients = [];
      for (const ingredient of newIngredients) {
        const added = await storage.ingredients.add(ingredient);
        if (added) addedIngredients.push(added);
      }
      
      // Update existing ingredients
      if (updates.length > 0) {
        await storage.ingredients.batchUpdate(updates);
      }
      
      // Update local state
      const updatedExisting = Object.values(bulkEditData).filter(ing => !ing.id.startsWith('temp-') && !selectedForDelete.has(ing.id));
      setIngredients([...addedIngredients, ...updatedExisting]);
      setBulkEditData({});
      setSelectedForDelete(new Set());
    } catch (error) {
      console.error('Error saving bulk changes:', error);
    }
  };

  const updateBulkData = (id: string, field: keyof Ingredient, value: string | number | boolean | Date | undefined) => {
    setBulkEditData(prev => {
      const updated = { ...prev[id], [field]: value };
      
      // Business rule: if not in stock, set quantity to 0 and clear expiry date
      if (field === 'inStock' && !value) {
        updated.quantity = 0;
        updated.expiryDate = undefined;
      }
      
      return {
        ...prev,
        [id]: updated
      };
    });
  };

  const toggleSelectForDelete = (id: string) => {
    setSelectedForDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const inStockCount = ingredients.filter(i => i.inStock).length;
  const outOfStockCount = ingredients.filter(i => !i.inStock).length;
  const expiringCount = ingredients.filter(i => 
    i.expiryDate && new Date(i.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Pantry Management 🥫</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleBulkEdit}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors text-sm md:text-base cursor-pointer ${
              isBulkEdit 
                ? 'bg-success text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700' 
                : 'bg-secondary text-white hover:bg-secondary-hover'
            }`}
          >
            {isBulkEdit ? 'Save All' : 'Edit/Manage'}
          </button>
          {isBulkEdit && (
            <button
              onClick={cancelBulkEdit}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Stats - Desktop: Cards, Mobile: Table */}
      <div className="mb-6">
        {/* Desktop Cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          <button
            onClick={() => setActiveFilter(activeFilter === 'instock' ? null : 'instock')}
            className={`bg-success-subtle dark:bg-green-900/50 border rounded-lg p-3 flex items-center space-x-3 transition-all hover:shadow-md cursor-pointer ${
              activeFilter === 'instock' 
                ? 'border-success ring-2 ring-success/20 shadow-md' 
                : 'border-success hover:border-green-400'
            }`}
          >
            <div className="text-2xl font-bold text-success">{inStockCount}</div>
            <div className="text-success">In Stock</div>
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'outofstock' ? null : 'outofstock')}
            className={`bg-error-subtle dark:bg-red-900/50 border rounded-lg p-3 flex items-center space-x-3 transition-all hover:shadow-md cursor-pointer ${
              activeFilter === 'outofstock' 
                ? 'border-error ring-2 ring-error/20 shadow-md' 
                : 'border-error hover:border-red-400'
            }`}
          >
            <div className="text-2xl font-bold text-error">{outOfStockCount}</div>
            <div className="text-error">Out of Stock</div>
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'expiring' ? null : 'expiring')}
            className={`bg-warning-subtle dark:bg-orange-900/50 border rounded-lg p-3 flex items-center space-x-3 transition-all hover:shadow-md cursor-pointer ${
              activeFilter === 'expiring' 
                ? 'border-warning ring-2 ring-warning/20 shadow-md' 
                : 'border-warning hover:border-orange-400'
            }`}
          >
            <div className="text-2xl font-bold text-warning">{expiringCount}</div>
            <div className="text-warning">Expiring Soon</div>
          </button>
        </div>

        {/* Mobile Table */}
        <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">In Stock</span>
            <span className="text-lg font-bold text-green-600">{inStockCount}</span>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">Out of Stock</span>
            <span className="text-lg font-bold text-error">{outOfStockCount}</span>
          </div>
          <div className="flex justify-between items-center p-3">
            <span className="text-sm text-gray-600">Expiring Soon</span>
            <span className="text-lg font-bold text-[#B8940D]">{expiringCount}</span>
          </div>
        </div>
      </div>

      {/* Category Manager */}
      {showCategoryManager && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <button
            onClick={() => setCategoryPanelExpanded(!categoryPanelExpanded)}
            className={`w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${categoryPanelExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Categories</h2>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${categoryPanelExpanded ? 'rotate-180' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {categoryPanelExpanded && (
            <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
              <div className="pt-4">
                {/* Add Category */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721]"
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                
                {/* Category List */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      <span className="text-sm text-gray-900 dark:text-white">{category}</span>
                      {category !== 'Other' && (
                        <button
                          onClick={() => removeCategory(category)}
                          className="text-error hover:text-white text-sm ml-2 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <button
            onClick={() => setAddFormExpanded(!addFormExpanded)}
            className={`w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${addFormExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Ingredient</h2>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${addFormExpanded ? 'rotate-180' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {addFormExpanded && (
            <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
              <div className="pt-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Tomatoes"
                />
                
                {/* Auto-suggest dropdown */}
                {showSuggestions && getSuggestions(formData.name).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b">
                      Existing ingredients (click to edit):
                    </div>
                    {getSuggestions(formData.name).map((ingredient) => (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => selectSuggestion()}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.inStock ? formData.quantity : 0}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                disabled={!formData.inStock}
                title={!formData.inStock ? "Quantity is automatically set to 0 for out-of-stock items" : ""}
                className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.inStock ? formData.expiryDate : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                disabled={!formData.inStock}
                title={!formData.inStock ? "Expiry date is not applicable for out-of-stock items" : ""}
                className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
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
              <label htmlFor="inStock" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                In Stock
              </label>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-[#C63721] text-white px-6 py-2 rounded-md hover:bg-[#A52E1A] cursor-pointer"
              >
                Add Ingredient
              </button>
            </div>
          </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ingredients..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C63721] bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Category</label>
            <CustomDropdown
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(category => ({ value: category, label: category }))
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="All Categories"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading pantry...</p>
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🥫</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {isBulkEdit && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delete
                    </th>
                  )}
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('expiryDate')}
                  >
                    <div className="flex items-center gap-1">
                      Expiry
                      <span className="text-sm">{getSortIcon('expiryDate')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('inStock')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <span className="text-sm">{getSortIcon('inStock')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedIngredients.map((ingredient) => {
                  const isExpiringSoon = ingredient.expiryDate && 
                    new Date(ingredient.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                  const currentData = isBulkEdit ? (bulkEditData[ingredient.id] || ingredient) : ingredient;
                  const isSelected = selectedForDelete.has(ingredient.id);
                  
                  return (
                    <tr key={ingredient.id} className={`${ingredient.inStock ? '' : 'bg-gray-50 dark:bg-gray-800'} ${isSelected ? 'line-through opacity-60' : ''}`}>
                      {isBulkEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectForDelete(ingredient.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{currentData.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isBulkEdit && currentData.inStock ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={currentData.quantity}
                            onChange={(e) => updateBulkData(ingredient.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border-2 border-dotted border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : isBulkEdit && !currentData.inStock ? (
                          <span 
                            className="text-gray-400 cursor-not-allowed"
                            title="Quantity is automatically 0 for out-of-stock items"
                          >
                            0
                          </span>
                        ) : (
                          <span>{currentData.quantity}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isBulkEdit ? (
                          <select
                            value={currentData.category}
                            onChange={(e) => updateBulkData(ingredient.id, 'category', e.target.value)}
                            className="px-2 py-1 text-xs border-2 border-dotted border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-200">
                            {currentData.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isBulkEdit && currentData.inStock ? (
                          <input
                            type="date"
                            value={currentData.expiryDate ? new Date(currentData.expiryDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateBulkData(ingredient.id, 'expiryDate', e.target.value ? new Date(e.target.value) : undefined)}
                            className="px-2 py-1 text-xs border-2 border-dotted border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : isBulkEdit && !currentData.inStock ? (
                          <span 
                            className="text-gray-400 cursor-not-allowed"
                            title="Expiry date is not applicable for out-of-stock items"
                          >
                            -
                          </span>
                        ) : (
                          currentData.expiryDate ? (
                            <span className={isExpiringSoon ? 'text-error font-medium' : ''}>
                              {new Date(currentData.expiryDate).toLocaleDateString()}
                              {isExpiringSoon && ' ⚠️'}
                            </span>
                          ) : (
                            '-'
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isBulkEdit ? (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={currentData.inStock}
                              onChange={(e) => updateBulkData(ingredient.id, 'inStock', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-xs">In Stock</span>
                          </label>
                        ) : (
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              currentData.inStock
                                ? 'bg-success-subtle dark:bg-green-900/30 text-success dark:text-green-300'
                                : 'bg-error-subtle dark:bg-red-900/30 text-error dark:text-red-300'
                            }`}
                          >
                            {currentData.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredIngredients.length)} of {filteredIngredients.length} ingredients
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}