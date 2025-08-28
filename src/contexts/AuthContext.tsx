'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getUserRole, setUserRole as createUserRole, UserRole } from '@/lib/auth';
import { auth, initializeFirebase } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  isAdmin: false,
  error: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to prevent infinite loading
  const [error, setError] = useState<string | null>(null);

  console.log('🔐 AuthProvider: State - loading:', loading, 'user:', user?.email || 'null', 'userRole:', userRole?.role || 'null', 'error:', error);

  // Simple authentication setup that works around hydration issues
  useEffect(() => {
    console.log('🔐 AuthProvider: useEffect started');
    
    // If we're on server side, just return
    if (typeof window === 'undefined') {
      console.log('🔐 AuthProvider: Server side detected, skipping auth setup');
      return;
    }
    
    console.log('🔐 AuthProvider: Client side detected, setting up auth');
    
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;
    
    // Use a timeout to ensure this runs after hydration
    const timeoutId = setTimeout(async () => {
      if (!isMounted) return;
      
      try {
        console.log('🔐 AuthProvider: Initializing Firebase');
        setLoading(true);
        await initializeFirebase();
        
        if (!isMounted) return;
        
        console.log('🔐 AuthProvider: Setting up auth listener');
        unsubscribe = onAuthStateChange(async (user) => {
          if (!isMounted) return;
          
          console.log('🔐 AuthProvider: Auth state changed, user:', user ? user.email : 'null');
          setUser(user);
          setError(null);

          if (user) {
            try {
              console.log('🔐 AuthProvider: Getting user role for:', user.email);
              let role = await getUserRole(user.uid);
              
              // Create user role if it doesn't exist
              if (!role && user.email) {
                const defaultRole = user.email === 'ahmadxeikh786@gmail.com' ? 'admin' : 'user';
                console.log('🔐 AuthProvider: Creating role:', defaultRole);
                await createUserRole(user.uid, user.email, defaultRole, user.displayName || undefined);
                role = await getUserRole(user.uid);
              }

              // Ensure admin role for specific email
              if (user.email === 'ahmadxeikh786@gmail.com' && (!role || role.role !== 'admin')) {
                console.log('🔐 AuthProvider: Ensuring admin role');
                await createUserRole(user.uid, user.email, 'admin', user.displayName || undefined);
                role = await getUserRole(user.uid);
              }

              if (isMounted) {
                setUserRole(role);
                console.log('🔐 AuthProvider: Set user role:', role?.role);
              }
            } catch (error) {
              console.error('🔐 AuthProvider: Error getting user role:', error);
              if (isMounted) {
                setError('Failed to load user role');
              }
            }
          } else {
            if (isMounted) {
              setUserRole(null);
              console.log('🔐 AuthProvider: Cleared user role');
            }
          }

          if (isMounted) {
            setLoading(false);
            console.log('🔐 AuthProvider: Loading complete, user:', user ? 'authenticated' : 'not authenticated');
          }
        });

      } catch (error) {
        console.error('🔐 AuthProvider: Firebase initialization error:', error);
        if (isMounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    }, 1000); // Longer delay to ensure hydration is complete
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        console.log('🔐 AuthProvider: Cleaning up auth listener');
        unsubscribe();
      }
    };
  }, []);

  const isAdmin = userRole?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, userRole, loading, isAdmin, error }}>
      {children}
    </AuthContext.Provider>
  );
};