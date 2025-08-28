'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  
  console.log('ProtectedRoute - user:', user, 'loading:', loading, 'error:', error);
  
  // Handle navigation in useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && !user && !error) {
      console.log('ProtectedRoute - Redirecting to signin');
      router.push('/signin');
    }
  }, [user, loading, error, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }
  
  return <>{children}</>;
}