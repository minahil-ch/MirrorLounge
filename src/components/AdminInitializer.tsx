'use client';

import React, { useState } from 'react';
import { createAdminUser } from '@/lib/auth';

export default function AdminInitializer() {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCreateAdmin = async () => {
    setStatus('creating');
    setMessage('Creating admin user...');
    
    try {
      const result = await createAdminUser();
      
      if (result.success) {
        setStatus('success');
        setMessage('✅ Admin user created successfully! You can now sign in with admin@mirrorbeauty.com / admin123');
      } else {
        setStatus('error');
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error: unknown) {
      setStatus('error');
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use') {
        setMessage('ℹ️ Admin user already exists with this email. You can sign in with admin@mirrorbeauty.com / admin123');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setMessage(`❌ Error: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Admin User Setup</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Click the button below to create the admin user with the demo credentials:
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm font-medium text-blue-800">Email: admin@mirrorbeauty.com</p>
          <p className="text-sm font-medium text-blue-800">Password: admin123</p>
        </div>
      </div>

      <button
        onClick={handleCreateAdmin}
        disabled={status === 'creating'}
        className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {status === 'creating' ? 'Creating Admin User...' : 'Create Admin User'}
      </button>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          status === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : status === 'error'
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4">
          <a
            href="/signin"
            className="inline-block w-full text-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Sign In Page
          </a>
        </div>
      )}
    </div>
  );
}