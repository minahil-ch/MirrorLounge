'use client';

import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { UserRole } from './auth';

// Get all users
export const getAllUsers = async (): Promise<UserRole[]> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      console.warn('Firebase is not configured, returning empty users list');
      return [];
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as UserRole[];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Subscribe to users changes
export const subscribeToUsersChanges = (
  callback: (users: UserRole[]) => void,
  onError?: (error: Error) => void
) => {
  if (!isFirebaseConfigured() || !db) {
    console.warn('Firebase is not configured, skipping users subscription');
    return () => {}; // Return empty unsubscribe function
  }

  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, 
    (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as UserRole[];
      callback(users);
    },
    (error) => {
      console.error('Error in users subscription:', error);
      if (onError) onError(error);
    }
  );
};

// Update user role
export const updateUserRole = async (uid: string, role: 'admin' | 'user') => {
  try {
    if (!isFirebaseConfigured() || !db) {
      return { error: 'Firebase is not configured. Please set up your Firebase environment variables.' };
    }

    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: new Date()
    });
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Delete user
export const deleteUser = async (uid: string) => {
  try {
    if (!isFirebaseConfigured() || !db) {
      return { error: 'Firebase is not configured. Please set up your Firebase environment variables.' };
    }

    await deleteDoc(doc(db, 'users', uid));
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};