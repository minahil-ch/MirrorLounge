'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Category,
  addCategory,
  updateCategory,
  deleteCategory,
  subscribeToCategoriesChanges,
  convertFileToBase64,
  compressImage
} from '@/lib/firebaseServicesNoStorage';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'from-pink-400 to-pink-500',
    image: '',
    gender: 'men' as 'men' | 'women' | 'unisex'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);



  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToCategoriesChanges((updatedCategories) => {
      setCategories(updatedCategories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, image: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setUploading(true);
    try {
      let imageBase64 = editingCategory?.imageBase64;

      // Convert image to base64 if new image selected
      if (imageFile) {
        try {
          // Compress image to reduce size (max 800px width, 80% quality)
          imageBase64 = await compressImage(imageFile, 800, 0.8);
        } catch {
          // Fallback to regular base64 conversion if compression fails
          imageBase64 = await convertFileToBase64(imageFile);
        }
      }

      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id!, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          gender: formData.gender,
          imageBase64: imageBase64,
          serviceCount: editingCategory.serviceCount // Keep existing service count
        });
      } else {
        // Add new category
        await addCategory({
          name: formData.name,
          description: formData.description,
          color: formData.color,
          gender: formData.gender,
          serviceCount: 0,
          imageBase64: imageBase64
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'from-pink-400 to-pink-500',
      image: '',
      gender: 'men'
    });
    setImageFile(null);
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
      image: category.imageBase64 || '',
      gender: category.gender
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (category: Category) => {
    if (confirm('Delete this category?')) {
      try {
        await deleteCategory(category.id!);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: 'from-pink-400 to-pink-500',
      image: '',
      gender: 'men'
    });
    setImageFile(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-2 sm:p-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-pink-600"></div>
            <span className="ml-2 sm:ml-3 text-sm sm:text-base text-pink-600">Loading categories...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3">
      <div className="max-w-5xl mx-auto">
        {/* Compact Header */}
        <div className="mb-3 sm:mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-base sm:text-lg font-medium text-pink-600 mb-1">Categories</h1>
              <p className="text-xs text-pink-500">Manage service categories</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all border border-pink-200/50 hover:border-pink-300/50"
            >
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Categories Grid with Gender Separation */}
        {/* Men Categories Section */}
        {categories.filter(cat => cat.gender === 'men').length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-bold text-blue-600 mb-3 sm:mb-4">Men Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {categories.filter(cat => cat.gender === 'men').map((category) => (
                <CategoryCard key={category.id} category={category} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Women Categories Section */}
        {categories.filter(cat => cat.gender === 'women').length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-bold text-pink-600 mb-3 sm:mb-4">Women Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {categories.filter(cat => cat.gender === 'women').map((category) => (
                <CategoryCard key={category.id} category={category} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}



        {/* Compact Empty State */}
        {categories.length === 0 && !loading && (
          <div className="text-center py-4 sm:py-6">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-pink-200 to-pink-300 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="text-xs sm:text-sm text-pink-600">📂</div>
            </div>
            <h3 className="text-xs font-semibold text-pink-700 mb-1">No categories yet</h3>
            <p className="text-xs text-pink-500 mb-3">Create your first category</p>
            <button
              onClick={openAddModal}
              className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-pink-200/50"
            >
              Create Category
            </button>
          </div>
        )}

        {/* Compact Modal with Image Upload */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgb(233,30,99,0.35)] w-full max-w-xs sm:max-w-sm">
              <div className="p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-pink-700 mb-3 sm:mb-4">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Image</label>
                    <div className="relative">
                      {formData.image ? (
                        <div className="relative w-full h-16 rounded-lg overflow-hidden border border-pink-200/50">
                          <Image
                            src={formData.image}
                            alt="Category preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, image: '' });
                              setImageFile(null);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center text-pink-600 hover:bg-white text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-12 sm:h-16 border-2 border-pink-200/50 border-dashed rounded-lg cursor-pointer bg-pink-50/30 hover:bg-pink-50/50 transition-all">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-pink-100 rounded-md flex items-center justify-center mb-1">
                              <span className="text-pink-500 text-xs">📷</span>
                            </div>
                            <p className="text-xs text-pink-600 font-medium">Upload</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                      placeholder="Category name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all resize-none text-xs"
                      rows={2}
                      placeholder="Description"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Gender</label>
                    <div className="relative">
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'men' | 'women' })}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs appearance-none bg-white cursor-pointer"
                      >
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 sm:pt-3 border-t border-pink-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={uploading}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-pink-600 bg-pink-50/60 rounded-lg text-xs font-medium hover:bg-pink-100/60 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 rounded-lg text-xs font-medium border border-pink-200/50 hover:border-pink-300/50 transition-all disabled:opacity-50 flex items-center space-x-1"
                    >
                      {uploading && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-600"></div>
                      )}
                      <span>{editingCategory ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Category Card Component
function CategoryCard({ category, onEdit, onDelete }: {
  category: Category,
  onEdit: (cat: Category) => void,
  onDelete: (cat: Category) => void
}) {
  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case 'men': return 'bg-blue-100 text-blue-700';
      case 'women': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(233,30,99,0.15)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(233,30,99,0.25)] hover:scale-[1.02] group">
      {/* Enhanced Category Header with Bigger Image Display */}
      <div className="relative h-20 sm:h-24 overflow-hidden">
        {category.imageBase64 ? (
          <div className="relative h-full">
            <Image
              src={category.imageBase64}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Bottom gradient for text readability only */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>
        ) : (
          <div className={`h-full bg-gradient-to-br ${category.color} relative`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            {/* Placeholder icon for categories without images */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 sm:w-8 h-6 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white/80 text-xs sm:text-sm">📷</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={() => onEdit(category)}
            className="w-5 sm:w-6 h-5 sm:h-6 bg-white/95 backdrop-blur-sm rounded-md flex items-center justify-center text-pink-600 hover:bg-white hover:scale-110 text-xs transition-all shadow-md border border-white/20"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(category)}
            className="w-5 sm:w-6 h-5 sm:h-6 bg-white/95 backdrop-blur-sm rounded-md flex items-center justify-center text-pink-600 hover:bg-red-50 hover:text-red-600 hover:scale-110 text-xs transition-all shadow-md border border-white/20"
          >
            ×
          </button>
        </div>

        {/* Gender Badge */}
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${getGenderBadgeColor(category.gender)} backdrop-blur-sm`}>
            {category.gender.charAt(0).toUpperCase() + category.gender.slice(1)}
          </span>
        </div>

        {/* Category Name Overlay for Images */}
        {category.imageBase64 && (
          <div className="absolute bottom-1 sm:bottom-2 left-2 sm:left-3 right-2 sm:right-3">
            <h3 className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg truncate">
              {category.name}
            </h3>
          </div>
        )}
      </div>

      {/* Enhanced Category Content */}
      <div className="p-2 sm:p-3">
        {/* Only show title if no image, otherwise it's shown as overlay */}
        {!category.imageBase64 && (
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-xs font-semibold text-pink-700 leading-tight truncate">{category.name}</h3>
            <span className="text-xs text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded-full font-medium ml-1">
              {category.serviceCount}
            </span>
          </div>
        )}

        {/* For images, show service count prominently */}
        {category.imageBase64 && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-pink-500 font-medium">Services</span>
            <span className="text-xs text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded-full font-medium">
              {category.serviceCount}
            </span>
          </div>
        )}

        <p className="text-xs text-pink-600 leading-tight mb-1 sm:mb-2 line-clamp-2">{category.description}</p>

        {/* Enhanced Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-pink-100">
          <span className="text-xs text-pink-500 font-medium">
            {category.imageBase64 ? 'Active' : 'Services'}
          </span>
          <div className="flex items-center space-x-1">
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${category.color}`}></div>
            <span className="text-xs text-pink-400">
              {category.imageBase64 ? 'Ready' : 'Active'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}