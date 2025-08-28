'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, updateUserPassword } from '@/lib/auth';
import { User, Mail, Shield, Calendar, Edit3, Lock, Save, Crown, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user, userRole } = useAuth();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await updateUserProfile(displayName);
    
    if (error) {
      setError(error);
    } else {
      setMessage('Profile updated successfully!');
      setEditing(false);
      // Force a page refresh to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await updateUserPassword(newPassword);
    
    if (error) {
      setError(error);
    } else {
      setMessage('Password updated successfully!');
      setChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setLoading(false);
  };

  return (
    <div className="p-2 sm:p-3">
      <div className="max-w-5xl mx-auto">
        {/* Compact Header */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-base sm:text-lg font-medium text-pink-600 mb-1">Profile Settings</h1>
          <p className="text-xs text-pink-500">Manage your account information</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-xs sm:text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {/* Compact Profile Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Profile Info Card */}
          <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(233,30,99,0.15)] p-3 sm:p-4">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                  userRole?.role === 'admin' 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                    : 'bg-gradient-to-br from-blue-400 to-blue-500'
                }`}>
                  {userRole?.role === 'admin' ? (
                    <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  ) : (
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">
                    {user?.displayName || user?.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    userRole?.role === 'admin'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {userRole?.role === 'admin' ? (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        User
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setEditing(!editing)}
                className="p-2 rounded-lg text-pink-600 hover:bg-pink-50 transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Form */}
            {editing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all disabled:opacity-50 text-xs"
                  >
                    <Save className="w-3 h-3" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setDisplayName(user?.displayName || '');
                    }}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-all text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-xs font-medium text-gray-900 truncate">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Role</p>
                      <p className="text-xs font-medium text-gray-900 capitalize">{userRole?.role}</p>
                    </div>
                  </div>

                  {userRole?.createdAt && (
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Member Since</p>
                        <p className="text-xs font-medium text-gray-900">
                          {userRole.createdAt instanceof Date 
                            ? userRole.createdAt.toLocaleDateString()
                            : new Date(userRole.createdAt).toLocaleDateString()
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(233,30,99,0.15)] p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Security</h3>
              <Lock className="w-4 h-4 text-gray-400" />
            </div>

            {changingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 pr-10 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 pr-10 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all disabled:opacity-50 text-xs"
                  >
                    <Save className="w-3 h-3" />
                    <span>{loading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingPassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                    }}
                    className="w-full px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Password</p>
                  <p className="text-xs text-gray-900">••••••••</p>
                </div>
                
                <button
                  onClick={() => setChangingPassword(true)}
                  className="w-full flex items-center justify-center space-x-1 px-3 py-2 text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-50 transition-all text-xs"
                >
                  <Lock className="w-3 h-3" />
                  <span>Change Password</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-4 bg-blue-50/50 border border-blue-200/50 rounded-xl p-3">
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-blue-900 mb-1">Account Security</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Keep your account secure by using a strong password and updating your profile information regularly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}