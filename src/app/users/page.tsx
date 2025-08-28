'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUsersChanges, updateUserRole, deleteUser } from '@/lib/userService';
import { UserRole, createNewUser } from '@/lib/auth';
import { Users, Shield, User, Trash2, Crown, UserCheck, Plus, Eye, EyeOff, Save } from 'lucide-react';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user' as 'admin' | 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Subscribe to users changes
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToUsersChanges(
      (updatedUsers) => {
        setUsers(updatedUsers);
        setLoading(false);
      },
      (error) => {
        console.error('Users subscription error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleRoleUpdate = async (uid: string, newRole: 'admin' | 'user') => {
    const { error } = await updateUserRole(uid, newRole);
    if (error) {
      alert('Error updating user role: ' + error);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (confirm(`Delete user ${email}? This action cannot be undone.`)) {
      const { error } = await deleteUser(uid);
      if (error) {
        alert('Error deleting user: ' + error);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setMessage('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setCreating(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setCreating(false);
      return;
    }

    const { success, error } = await createNewUser(
      formData.email,
      formData.password,
      formData.displayName,
      formData.role
    );

    if (success) {
      setMessage('User created successfully!');
      setFormData({ email: '', password: '', displayName: '', role: 'user' });
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
      }, 2000);
    } else {
      setError(error || 'Failed to create user');
    }

    setCreating(false);
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', displayName: '', role: 'user' });
    setError('');
    setMessage('');
    setShowPassword(false);
    setShowModal(false);
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="p-2 sm:p-3">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-2 sm:p-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-3 text-pink-600">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-pink-600 mb-1 sm:mb-2">User Management</h1>
              <p className="text-xs sm:text-sm text-pink-500">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-200/50">
                <span className="text-xs font-medium text-pink-600">
                  {users.length} {users.length === 1 ? 'User' : 'Users'}
                </span>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-pink-200/50 hover:border-pink-300/50 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Add User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {users.map((user) => (
            <div key={user.uid} className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(233,30,99,0.15)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(233,30,99,0.25)] hover:scale-[1.02] group">
              {/* User Header */}
              <div className="p-3 sm:p-4 border-b border-pink-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${user.role === 'admin'
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                      : 'bg-gradient-to-br from-blue-400 to-blue-500'
                      }`}>
                      {user.role === 'admin' ? (
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      ) : (
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {user.displayName || user.email?.split('@')[0]}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-700 font-medium">
                      {user.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="text-gray-700 font-medium">
                      {user.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-pink-100/50">
                  <div className="flex items-center space-x-1">
                    {/* Role Toggle */}
                    <button
                      onClick={() => handleRoleUpdate(user.uid, user.role === 'admin' ? 'user' : 'admin')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${user.role === 'admin'
                        ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-200/50'
                        : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 border border-yellow-200/50'
                        }`}
                      title={user.role === 'admin' ? 'Make User' : 'Make Admin'}
                    >
                      {user.role === 'admin' ? (
                        <>
                          <UserCheck className="w-3 h-3 inline mr-1" />
                          Make User
                        </>
                      ) : (
                        <>
                          <Crown className="w-3 h-3 inline mr-1" />
                          Make Admin
                        </>
                      )}
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteUser(user.uid, user.email)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                    title="Delete User"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-200 to-pink-300 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600" />
            </div>
            <h3 className="text-sm font-semibold text-pink-700 mb-2">No users found</h3>
            <p className="text-xs text-pink-500 mb-4">Users will appear here once they sign in</p>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">User Management</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                • <strong>Admins</strong> can access all pages including user management<br />
                • <strong>Users</strong> can access all pages except user management<br />
                • Role changes take effect immediately
              </p>
            </div>
          </div>
        </div>

        {/* Add User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgb(233,30,99,0.35)] w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-pink-700 mb-3 sm:mb-4">
                  Add New User
                </h3>

                {/* Messages */}
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-xs">{error}</p>
                  </div>
                )}

                {message && (
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-xs">{message}</p>
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-3">
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                      placeholder="user@example.com"
                      required
                      disabled={creating}
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 pr-8 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                        placeholder="Minimum 6 characters"
                        required
                        disabled={creating}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={creating}
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Display Name Field */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
                      placeholder="Full name (optional)"
                      disabled={creating}
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <div className="relative">
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                        className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs appearance-none bg-white cursor-pointer"
                        disabled={creating}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-2 pt-2 sm:pt-3 border-t border-pink-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={creating}
                      className="px-2 sm:px-3 py-1.5 text-pink-600 bg-pink-50/60 rounded-lg text-xs font-medium hover:bg-pink-100/60 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-2 sm:px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 rounded-lg text-xs font-medium border border-pink-200/50 hover:border-pink-300/50 transition-all disabled:opacity-50 flex items-center space-x-1"
                    >
                      {creating && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-600"></div>
                      )}
                      <Save className="w-3 h-3" />
                      <span>{creating ? 'Creating...' : 'Create User'}</span>
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