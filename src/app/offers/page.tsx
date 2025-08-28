'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  addOffer, 
  updateOffer, 
  deleteOffer, 
  subscribeToOffersChanges, 
  subscribeToBranchesChanges,
  subscribeToServicesChanges,
  compressImage,
  type Offer,
  type Branch,
  type Service 
} from '@/lib/firebaseServicesNoStorage';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    validFrom: '',
    validTo: '',
    isActive: true,
    usageLimit: null as number | null,
    image: '',
    targetBranches: [] as string[],
    targetServices: [] as string[]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeOffers = subscribeToOffersChanges(
      (updatedOffers) => {
        setOffers(updatedOffers);
        setLoading(false);
      },
      (error) => {
        console.error('Firebase connection error:', error);
        setLoading(false);
        alert('Firebase connection error. Please check the setup guide.');
      }
    );

    const unsubscribeBranches = subscribeToBranchesChanges(
      (branchesData) => {
        setBranches(branchesData);
      },
      (error) => {
        console.error('Error fetching branches:', error);
      }
    );

    const unsubscribeServices = subscribeToServicesChanges(
      (servicesData) => {
        setServices(servicesData);
      },
      (error) => {
        console.error('Error fetching services:', error);
      }
    );

    return () => {
      unsubscribeOffers();
      unsubscribeBranches();
      unsubscribeServices();
    };
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

  // Handle branch selection
  const handleBranchSelection = (branchId: string) => {
    setFormData(prev => ({
      ...prev,
      targetBranches: prev.targetBranches.includes(branchId)
        ? prev.targetBranches.filter(id => id !== branchId)
        : [...prev.targetBranches, branchId]
    }));
  };

  // Handle service selection
  const handleServiceSelection = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      targetServices: prev.targetServices.includes(serviceId)
        ? prev.targetServices.filter(id => id !== serviceId)
        : [...prev.targetServices, serviceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setUploading(true);
    try {
      let imageBase64 = editingOffer?.imageBase64;
      
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

      if (editingOffer) {
        // Update existing offer
        const updateData: Partial<Offer> = {
          title: formData.title,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          validFrom: formData.validFrom,
          validTo: formData.validTo,
          isActive: formData.isActive,
          imageBase64: imageBase64,
          usedCount: editingOffer.usedCount, // Keep existing usage count
          targetBranches: formData.targetBranches,
          targetServices: formData.targetServices
        };
        
        // Only add usageLimit if it has a valid value
        if (formData.usageLimit !== null && formData.usageLimit !== undefined) {
          updateData.usageLimit = formData.usageLimit;
        }
        
        await updateOffer(editingOffer.id!, updateData);
      } else {
        // Add new offer
        const offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
          title: formData.title,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          validFrom: formData.validFrom,
          validTo: formData.validTo,
          isActive: formData.isActive,
          usedCount: 0,
          imageBase64: imageBase64,
          targetBranches: formData.targetBranches,
          targetServices: formData.targetServices
        };
        
        // Only add usageLimit if it has a valid value
        if (formData.usageLimit !== null && formData.usageLimit !== undefined) {
          offerData.usageLimit = formData.usageLimit;
        }
        
        await addOffer(offerData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Error saving offer. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      validFrom: '',
      validTo: '',
      isActive: true,
      usageLimit: null,
      image: '',
      targetBranches: [],
      targetServices: []
    });
    setImageFile(null);
    setShowModal(false);
    setEditingOffer(null);
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      validFrom: offer.validFrom,
      validTo: offer.validTo,
      isActive: offer.isActive,
      usageLimit: offer.usageLimit,
      usedCount: offer.usedCount,
      imageBase64: offer.imageBase64 || '',
      targetBranches: offer.targetBranches || offer.selectedBranches || [],
      targetServices: offer.targetServices || offer.selectedServices || []
    });
    setShowModal(true);
  };

  const handleDelete = (offer: Offer) => {
    setOfferToDelete(offer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    
    setDeleting(true);
    try {
      await deleteOffer(offerToDelete.id!);
      setShowDeleteModal(false);
      setOfferToDelete(null);
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Error deleting offer. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setOfferToDelete(null);
  };

  const toggleStatus = async (offer: Offer) => {
    try {
      await updateOffer(offer.id!, { isActive: !offer.isActive });
    } catch (error) {
      console.error('Error updating offer status:', error);
      alert('Error updating offer status. Please try again.');
    }
  };

  const formatDiscount = (offer: Offer) => {
    return offer.discountType === 'percentage' 
      ? `${offer.discountValue}%` 
      : `AED ${offer.discountValue}`;
  };

  const isExpired = (validTo: string) => {
    return new Date(validTo) < new Date();
  };

  const getOfferGradient = (index: number) => {
    const gradients = [
      'from-pink-400 to-rose-400',
      'from-rose-400 to-pink-400', 
      'from-yellow-400 to-amber-400',
      'from-amber-400 to-yellow-400',
      'from-pink-300 to-yellow-300',
      'from-rose-300 to-amber-300'
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="p-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-3 text-pink-600">Loading offers...</span>
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
              <h1 className="text-base sm:text-lg font-medium text-pink-600 mb-1">Special Offers</h1>
              <p className="text-xs text-pink-500">Create and manage promotional banners</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all border border-pink-200/50 hover:border-pink-300/50"
            >
              <span className="hidden sm:inline">Create Offer</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>

        {/* Compact Banner-Style Offers */}
        <div className="space-y-2 sm:space-y-3">
          {offers.map((offer, index) => (
            <div key={offer.id} className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(233,30,99,0.15)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(233,30,99,0.25)] hover:scale-[1.01] group">
              {/* Compact Banner Header */}
              <div className="relative h-16 sm:h-20 overflow-hidden">
                {offer.imageBase64 ? (
                  <div className="relative h-full">
                    <Image 
                      src={offer.imageBase64} 
                      alt={offer.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
                  </div>
                ) : (
                  <div className={`h-full bg-gradient-to-r ${getOfferGradient(index)} relative`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  </div>
                )}
                
                {/* Compact Discount Badge */}
                <div className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-2 shadow-lg">
                    <div className="text-sm sm:text-lg font-bold text-pink-600">{formatDiscount(offer)}</div>
                    <div className="text-xs text-pink-500 uppercase tracking-wide font-medium">OFF</div>
                  </div>
                </div>

                {/* Compact Offer Content */}
                <div className="absolute left-16 sm:left-24 top-1/2 transform -translate-y-1/2 text-white right-16 sm:right-20">
                  <h2 className="text-xs sm:text-sm font-bold mb-1 drop-shadow-lg truncate">{offer.title}</h2>
                  <p className="text-xs opacity-90 drop-shadow-md truncate">{offer.description}</p>
                </div>

                {/* Compact Action Buttons */}
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => handleEdit(offer)}
                    className="w-5 h-5 sm:w-6 sm:h-6 bg-white/95 backdrop-blur-sm rounded-md flex items-center justify-center text-pink-600 hover:bg-white hover:scale-110 text-xs transition-all shadow-md"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(offer)}
                    className="w-5 h-5 sm:w-6 sm:h-6 bg-white/95 backdrop-blur-sm rounded-md flex items-center justify-center text-pink-600 hover:bg-red-50 hover:text-red-600 hover:scale-110 text-xs transition-all shadow-md"
                  >
                    ×
                  </button>
                </div>

                {/* Compact Status Badge */}
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                  <button
                    onClick={() => toggleStatus(offer)}
                    className={`px-1 sm:px-1.5 py-0.5 rounded-full font-medium transition-all duration-300 shadow-sm backdrop-blur-sm border ${
                      offer.isActive && !isExpired(offer.validTo)
                        ? 'bg-emerald-500/90 text-white hover:bg-emerald-600/90 border-emerald-400/30'
                        : isExpired(offer.validTo)
                        ? 'bg-gray-500/90 text-white border-gray-400/30'
                        : 'bg-rose-500/90 text-white hover:bg-rose-600/90 border-rose-400/30'
                    }`}
                    style={{ fontSize: '8px' }}
                  >
                    {isExpired(offer.validTo) ? 'Expired' : offer.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              {/* Compact Footer Info */}
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-50/50 to-transparent">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                      <span className="text-pink-600 text-xs">
                        <strong>Valid:</strong> {new Date(offer.validFrom).toLocaleDateString()} - {new Date(offer.validTo).toLocaleDateString()}
                      </span>
                      {offer.usageLimit && (
                        <span className="text-pink-600 text-xs">
                          <strong>Usage:</strong> {offer.usedCount}/{offer.usageLimit}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {offer.usageLimit && (
                        <div className="w-12 sm:w-16 bg-pink-200 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full bg-pink-500"
                            style={{ width: `${Math.min((offer.usedCount / offer.usageLimit) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                      <span className="text-pink-500 font-medium text-xs">{offer.usedCount} uses</span>
                    </div>
                  </div>
                  
                  {/* Targeting Information */}
                  {(offer.selectedBranches?.length > 0 || offer.selectedServices?.length > 0) && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs">
                      {offer.selectedBranches?.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-pink-600 font-medium">Branches:</span>
                          <div className="flex flex-wrap gap-1">
                            {offer.selectedBranches.slice(0, 2).map((branchId) => {
                              const branch = branches.find(b => b.id === branchId);
                              return (
                                <span key={branchId} className="bg-pink-100/80 text-pink-700 px-1.5 py-0.5 rounded text-xs">
                                  {branch?.name || 'Unknown'}
                                </span>
                              );
                            })}
                            {offer.selectedBranches.length > 2 && (
                              <span className="text-pink-500 text-xs">+{offer.selectedBranches.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {offer.selectedServices?.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-blue-600 font-medium">Services:</span>
                          <div className="flex flex-wrap gap-1">
                            {offer.selectedServices.slice(0, 2).map((serviceId) => {
                              const service = services.find(s => s.id === serviceId);
                              return (
                                <span key={serviceId} className="bg-blue-100/80 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                                  {service?.name || 'Unknown'}
                                </span>
                              );
                            })}
                            {offer.selectedServices.length > 2 && (
                              <span className="text-blue-500 text-xs">+{offer.selectedServices.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Empty State */}
        {offers.length === 0 && !loading && (
          <div className="text-center py-4 sm:py-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-200 to-pink-300 rounded-xl flex items-center justify-center mx-auto mb-2">
              <div className="text-xs sm:text-sm text-pink-600">🏷️</div>
            </div>
            <h3 className="text-xs font-semibold text-pink-700 mb-1">No offers yet</h3>
            <p className="text-xs text-pink-500 mb-3 px-4">Create your first promotional offer</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-pink-200/50"
            >
              Create Offer
            </button>
          </div>
        )}

        {/* Small Compact Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgb(233,30,99,0.35)] w-full max-w-sm max-h-[90vh] overflow-y-auto">
              <div className="p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-pink-700 mb-3 sm:mb-4">
                  {editingOffer ? 'Edit Offer' : 'Create Offer'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                  {/* Compact Image Upload */}
                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Image</label>
                    <div className="relative">
                      {formData.image ? (
                        <div className="relative w-full h-14 sm:h-16 rounded-lg overflow-hidden border border-pink-200/50">
                          <Image 
                            src={formData.image} 
                            alt="Banner preview"
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
                        <label className="flex flex-col items-center justify-center w-full h-14 sm:h-16 border-2 border-pink-200/50 border-dashed rounded-lg cursor-pointer bg-pink-50/30 hover:bg-pink-50/50 transition-all">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-100 rounded-md flex items-center justify-center mb-1">
                              <span className="text-pink-500 text-xs">🏷️</span>
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
                    <label className="block text-xs font-medium text-pink-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                      placeholder="Offer title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all resize-none text-xs"
                      rows={2}
                      placeholder="Description"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">Type</label>
                      <div className="relative">
                        <select
                          value={formData.discountType}
                          onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                          className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs appearance-none bg-white cursor-pointer"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">AED</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">Value</label>
                      <input
                        type="number"
                        value={formData.discountValue || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || parseFloat(value) >= 0) {
                            setFormData({ ...formData, discountValue: value === '' ? 0 : parseFloat(value) });
                          }
                        }}
                        className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="0"
                        step={formData.discountType === 'percentage' ? '1' : '0.01'}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">From</label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">To</label>
                      <input
                        type="date"
                        value={formData.validTo}
                        onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || parseInt(value) >= 0) {
                          setFormData({ ...formData, usageLimit: value === '' ? null : parseInt(value) });
                        }
                      }}
                      className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="1"
                      placeholder="Unlimited"
                    />
                  </div>

                  {/* Branch Selection */}
                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Target Branches</label>
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const branchId = e.target.value;
                          if (branchId && !formData.targetBranches.includes(branchId)) {
                            handleBranchSelection(branchId);
                          }
                          e.target.value = ''; // Reset select
                        }}
                        className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs appearance-none bg-white cursor-pointer"
                      >
                        <option value="">Select branches...</option>
                        {branches.filter(branch => !formData.targetBranches.includes(branch.id!)).map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {/* Selected Branches Chips */}
                    {formData.targetBranches.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.targetBranches.map((branchId) => {
                          const branch = branches.find(b => b.id === branchId);
                          return (
                            <div key={branchId} className="flex items-center bg-pink-100/60 text-pink-700 px-2 py-1 rounded-md text-xs">
                              <span className="mr-1">{branch?.name || 'Unknown'}</span>
                              <button
                                type="button"
                                onClick={() => handleBranchSelection(branchId)}
                                className="text-pink-500 hover:text-pink-700 ml-1"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Service Selection */}
                  <div>
                    <label className="block text-xs font-medium text-pink-600 mb-1">Target Services</label>
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const serviceId = e.target.value;
                          if (serviceId && !formData.targetServices.includes(serviceId)) {
                            handleServiceSelection(serviceId);
                          }
                          e.target.value = ''; // Reset select
                        }}
                        className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs appearance-none bg-white cursor-pointer"
                      >
                        <option value="">Select services...</option>
                        {services.filter(service => !formData.targetServices.includes(service.id!)).map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {/* Selected Services Chips */}
                    {formData.targetServices.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.targetServices.map((serviceId) => {
                          const service = services.find(s => s.id === serviceId);
                          return (
                            <div key={serviceId} className="flex items-center bg-blue-100/60 text-blue-700 px-2 py-1 rounded-md text-xs">
                              <span className="mr-1">{service?.name || 'Unknown'}</span>
                              <button
                                type="button"
                                onClick={() => handleServiceSelection(serviceId)}
                                className="text-blue-500 hover:text-blue-700 ml-1"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-3 h-3 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-1"
                      />
                      <span className="text-xs font-medium text-pink-600">Active</span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 sm:pt-3 border-t border-pink-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={uploading}
                      className="px-2 sm:px-3 py-1.5 text-pink-600 bg-pink-50/60 rounded-lg text-xs font-medium hover:bg-pink-100/60 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-2 sm:px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 rounded-lg text-xs font-medium border border-pink-200/50 hover:border-pink-300/50 transition-all disabled:opacity-50 flex items-center space-x-1"
                    >
                      {uploading && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-600"></div>
                      )}
                      <span>{editingOffer ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Offer"
        message={`Are you sure you want to delete "${offerToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />
    </div>
  );
}