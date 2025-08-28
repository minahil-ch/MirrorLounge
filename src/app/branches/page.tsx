'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Branch,
    addBranch,
    updateBranch,
    deleteBranch,
    subscribeToBranchesChanges,
    convertFileToBase64,
    compressImage
} from '@/lib/firebaseServicesNoStorage';

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        manager: '',
        openingHours: '',
        isActive: true,
        image: '',
        city: '',
        country: 'UAE'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Subscribe to real-time updates
    useEffect(() => {
        const unsubscribe = subscribeToBranchesChanges(
            (updatedBranches) => {
                setBranches(updatedBranches);
                setLoading(false);
            },
            (error) => {
                console.error('Firebase connection error:', error);
                setLoading(false);
                alert('Firebase connection error. Please check the setup guide.');
            }
        );

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
            let imageBase64 = editingBranch?.imageBase64;

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

            if (editingBranch) {
                // Update existing branch
                await updateBranch(editingBranch.id!, {
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    manager: formData.manager,
                    openingHours: formData.openingHours,
                    isActive: formData.isActive,
                    city: formData.city,
                    country: formData.country,
                    imageBase64: imageBase64
                });
            } else {
                // Add new branch
                await addBranch({
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    manager: formData.manager,
                    openingHours: formData.openingHours,
                    isActive: formData.isActive,
                    city: formData.city,
                    country: formData.country,
                    imageBase64: imageBase64
                });
            }

            resetForm();
        } catch (error) {
            console.error('Error saving branch:', error);
            alert('Error saving branch. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            manager: '',
            openingHours: '',
            isActive: true,
            image: '',
            city: '',
            country: 'UAE'
        });
        setImageFile(null);
        setShowModal(false);
        setEditingBranch(null);
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            email: branch.email,
            manager: branch.manager,
            openingHours: branch.openingHours,
            isActive: branch.isActive,
            image: branch.imageBase64 || '',
            city: branch.city,
            country: branch.country
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleDelete = async (branch: Branch) => {
        if (confirm('Delete this branch?')) {
            try {
                await deleteBranch(branch.id!);
            } catch (error) {
                console.error('Error deleting branch:', error);
                alert('Error deleting branch. Please try again.');
            }
        }
    };

    const toggleStatus = async (branch: Branch) => {
        try {
            await updateBranch(branch.id!, { isActive: !branch.isActive });
        } catch (error) {
            console.error('Error updating branch status:', error);
            alert('Error updating branch status. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="p-3">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                        <span className="ml-3 text-pink-600">Loading branches...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-pink-600 mb-2">Branch Management</h1>
                            <p className="text-sm text-pink-500">Manage your salon branches and locations</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-pink-200/50 hover:border-pink-300/50"
                        >
                            Add Branch
                        </button>
                    </div>
                </div>

                {/* Branches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch) => (
                        <BranchCard key={branch.id} branch={branch} onEdit={handleEdit} onDelete={handleDelete} onToggleStatus={toggleStatus} />
                    ))}
                </div>

                {/* Empty State */}
                {branches.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <div className="text-2xl text-pink-600">🏢</div>
                        </div>
                        <h3 className="text-lg font-semibold text-pink-700 mb-2">No branches yet</h3>
                        <p className="text-sm text-pink-500 mb-6">Create your first branch location</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-4 py-2 rounded-lg text-sm font-medium border border-pink-200/50"
                        >
                            Create Branch
                        </button>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-2xl shadow-[0_20px_50px_rgb(233,30,99,0.35)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-pink-700 mb-6">
                                    {editingBranch ? 'Edit Branch' : 'Add Branch'}
                                </h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-pink-600 mb-2">Branch Image</label>
                                        <div className="relative">
                                            {formData.image ? (
                                                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-pink-200/50">
                                                    <Image
                                                        src={formData.image}
                                                        alt="Branch preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({ ...formData, image: '' });
                                                            setImageFile(null);
                                                        }}
                                                        className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-pink-600 hover:bg-white text-sm"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-pink-200/50 border-dashed rounded-lg cursor-pointer bg-pink-50/30 hover:bg-pink-50/50 transition-all">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-2">
                                                            <span className="text-pink-500 text-lg">📷</span>
                                                        </div>
                                                        <p className="text-sm text-pink-600 font-medium">Upload Branch Image</p>
                                                        <p className="text-xs text-pink-500">PNG, JPG up to 10MB</p>
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

                                    {/* Branch Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-pink-600 mb-2">Branch Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all text-sm"
                                            placeholder="e.g., Mirror Salon Downtown"
                                            required
                                        />
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-pink-600 mb-2">Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-3 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all resize-none text-sm"
                                            rows={2}
                                            placeholder="Full branch address"
                                            required
                                        />
                                    </div>

                                    {/* City and Country */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-pink-600 mb-2">City</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                className="w-full px-4 py-3 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all text-sm"
                                                placeholder="Dubai"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-pink-600 mb-2">Country</label>
                                            <select
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                className="w-full px-4 py-3 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all text-sm appearance-none bg-white cursor-pointer"
                                            >
                                                <option value="UAE">UAE</option>
                                                <option value="Saudi Arabia">Saudi Arabia</option>
                                                <option value="Qatar">Qatar</option>
                                                <option value="Kuwait">Kuwait</option>
                                                <option value="Bahrain">Bahrain</option>
                                                <option value="Oman">Oman</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-pink-600 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-3 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all text-sm"
                                                placeholder="+971 4 123 4567"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-pink-600 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-3 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all text-sm"
                                                placeholder="branch@mirrorsalon.ae"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Manager and Hours */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-pink-600 mb-2">Manager</label>
                                            <input
                                                type="text"
                                                value={formData.manager}
                                                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                                className="w-full px-4 py-3 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all text-sm"
                                                placeholder="Manager name"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-pink-600 mb-2">Opening Hours</label>
                                            <input
                                                type="text"
                                                value={formData.openingHours}
                                                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                                                className="w-full px-4 py-3 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all text-sm"
                                                placeholder="9:00 AM - 10:00 PM"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Active Status */}
                                    <div>
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-5 h-5 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                                            />
                                            <span className="text-sm font-medium text-pink-600">Active Branch</span>
                                        </label>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex justify-end space-x-3 pt-6 border-t border-pink-100">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            disabled={uploading}
                                            className="px-6 py-2 text-pink-600 bg-pink-50/60 rounded-lg text-sm font-medium hover:bg-pink-100/60 transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={uploading}
                                            className="px-6 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 rounded-lg text-sm font-medium border border-pink-200/50 hover:border-pink-300/50 transition-all disabled:opacity-50 flex items-center space-x-2"
                                        >
                                            {uploading && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b border-pink-600"></div>
                                            )}
                                            <span>{editingBranch ? 'Update Branch' : 'Create Branch'}</span>
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

// Branch Card Component
function BranchCard({ branch, onEdit, onDelete, onToggleStatus }: {
    branch: Branch,
    onEdit: (branch: Branch) => void,
    onDelete: (branch: Branch) => void,
    onToggleStatus: (branch: Branch) => void
}) {
    return (
        <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(233,30,99,0.15)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(233,30,99,0.25)] hover:scale-[1.02] group">
            {/* Branch Image */}
            <div className="relative h-48 overflow-hidden">
                {branch.imageBase64 ? (
                    <div className="relative h-full">
                        <Image
                            src={branch.imageBase64}
                            alt={branch.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    </div>
                ) : (
                    <div className="h-full bg-gradient-to-br from-pink-400 to-pink-500 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <span className="text-white/80 text-2xl">🏢</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                        onClick={() => onEdit(branch)}
                        className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center text-pink-600 hover:bg-white hover:scale-110 text-sm transition-all shadow-lg border border-white/20"
                    >
                        ✎
                    </button>
                    <button
                        onClick={() => onDelete(branch)}
                        className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center text-pink-600 hover:bg-red-50 hover:text-red-600 hover:scale-110 text-sm transition-all shadow-lg border border-white/20"
                    >
                        ×
                    </button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <button
                        onClick={() => onToggleStatus(branch)}
                        className={`px-3 py-1 rounded-full font-medium transition-all duration-300 shadow-lg backdrop-blur-sm border text-sm ${branch.isActive
                                ? 'bg-emerald-500/90 text-white hover:bg-emerald-600/90 border-emerald-400/30 hover:scale-105'
                                : 'bg-rose-500/90 text-white hover:bg-rose-600/90 border-rose-400/30 hover:scale-105'
                            }`}
                    >
                        {branch.isActive ? 'Active' : 'Inactive'}
                    </button>
                </div>

                {/* Branch Name Overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white drop-shadow-lg truncate">
                        {branch.name}
                    </h3>
                    <p className="text-sm text-white/90 drop-shadow-md truncate">
                        {branch.city}, {branch.country}
                    </p>
                </div>
            </div>

            {/* Branch Details */}
            <div className="p-4">
                <div className="space-y-3">
                    {/* Address */}
                    <div className="flex items-start space-x-2">
                        <span className="text-pink-500 text-sm mt-0.5">📍</span>
                        <p className="text-sm text-pink-600 leading-relaxed line-clamp-2">{branch.address}</p>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-pink-500 text-sm">📞</span>
                            <p className="text-sm text-pink-600 font-medium">{branch.phone}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-pink-500 text-sm">✉️</span>
                            <p className="text-sm text-pink-600 truncate">{branch.email}</p>
                        </div>
                    </div>

                    {/* Manager and Hours */}
                    <div className="pt-2 border-t border-pink-100">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-pink-500 font-medium">Manager</span>
                            <span className="text-xs text-pink-700 font-semibold">{branch.manager}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-pink-500 font-medium">Hours</span>
                            <span className="text-xs text-pink-700 font-semibold">{branch.openingHours}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}