"use client";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";



export interface UserRole {
  uid: string;
  email: string;
  displayName?: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    return { user: null, error: "Firebase auth is not initialized" };
  }
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    return {
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Sign out
export const signOutUser = async (): Promise<{ error: string | null }> => {
  try {
    if (!auth) {
      return { error: "Firebase auth is not initialized" };
    }
    await signOut(auth);
    return { error: null };
  } catch (error: unknown) {

    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Forgot password
export const sendPasswordReset = async (email: string) => {
  try {
    if (!auth) throw new Error("Firebase auth is not initialized");
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Update user profile
export const updateUserProfile = async (
  displayName: string
): Promise<{ error: string | null }> => {
  try {
    if (!auth) {
      return { error: "Firebase auth is not initialized" };
    }
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      // Also update in Firestore
      if (!db) throw new Error("Firestore is not initialized");
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        displayName,
        updatedAt: new Date(),
      });
    }
    return { error: null };
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Update user password
export const updateUserPassword = async (
  newPassword: string
): Promise<{ error: string | null }> => {
  try {
    if (!auth) {
      return { error: "Firebase auth is not initialized" };
    }
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
    return { error: null };
  } catch (error: unknown) {
    console.error("Error updating password:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Get user role from Firestore
export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  try {
    if (!db) throw new Error("Firestore is not initialized");
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : new Date(data.updatedAt),
      } as UserRole;
    }
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

// Set user role in Firestore
export const setUserRole = async (
  uid: string,
  email: string,
  role: "admin" | "user",
  displayName?: string
): Promise<{ error: string | null }> => {
  try {
    const userData: UserRole = {
      uid,
      email,
      displayName,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (!db) throw new Error("Firestore is not initialized");
    await setDoc(doc(db, "users", uid), userData);
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn('Firebase auth is not initialized. Authentication state changes will not be tracked.');
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};

// Create admin user if doesn't exist
export const createAdminUser = async (): Promise<{
  success: boolean;
  error: string | null;
}> => {
  try {
    if (!auth) {
      return { success: false, error: "Firebase auth is not initialized" };
    }
    console.log("Creating admin user: admin@mirrorbeauty.com");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "admin@mirrorbeauty.com",
      "admin123"
    );

    // Set display name
    await updateProfile(userCredential.user, { displayName: "Admin User" });

    // Create user role in Firestore
    await setUserRole(
      userCredential.user.uid,
      "admin@mirrorbeauty.com",
      "admin",
      "Admin User"
    );

    console.log("Admin user created successfully");
    return { success: true, error: null };
  } catch (error: unknown) {
    console.error("Error creating admin user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Create new user with email and password without affecting current session
export const createNewUser = async (
  email: string,
  password: string,
  displayName: string,
  role: "admin" | "user"
): Promise<{ success: boolean; error: string | null; user?: User }> => {
  try {
    console.log("Creating new user:", email);

    // Save current user info
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return { success: false, error: "No authenticated user found" };
    }

    // Create a secondary Firebase app instance to avoid affecting current session
    const { initializeApp } = await import("firebase/app");
    const { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } =
      await import("firebase/auth");

    // Use the same config but create a secondary app
    const secondaryApp = initializeApp(
      {
        apiKey: "AIzaSyBYQA66rKOPrb4kce-hYCTYAbGKanVGbZ8",
        authDomain: "mirrorsbeautylounge-7c5ff.firebaseapp.com",
        projectId: "mirrorsbeautylounge-7c5ff",
        storageBucket: "mirrorsbeautylounge-7c5ff.firebasestorage.app",
        messagingSenderId: "1029530532506",
        appId: "1:1029530532506:web:2fa18cc521b2524e5afd23",
        measurementId: "G-GMWQSDP9JW"
      },
      "secondary"
    );

    const secondaryAuth = getAuth(secondaryApp);

    // Create user with secondary auth instance
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );

    // Set display name on the new user
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Create user role in Firestore using the main app's database
    await setUserRole(userCredential.user.uid, email, role, displayName);

    // Sign out from secondary auth to clean up
    await signOut(secondaryAuth);

    // Clean up the secondary app (delete method may not be available in all versions)
    try {
      if (
        "delete" in secondaryApp &&
        typeof secondaryApp.delete === "function"
      ) {
        await secondaryApp.delete();
      }
    } catch (error) {
      console.log("Secondary app cleanup not needed or failed:", error);
    }

    console.log(
      "New user created successfully without affecting current session"
    );
    return { success: true, error: null, user: userCredential.user };
  } catch (error: unknown) {
    console.error("Error creating new user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Get current user
export const getCurrentUser = () => {
  if (!auth) {
    console.warn('Firebase auth is not initialized.');
    return null;
  }
  return auth.currentUser;
};
