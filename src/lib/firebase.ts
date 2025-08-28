// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Validate Firebase environment variables
function validateFirebaseConfig() {
  // Using hardcoded values, so configuration is always valid
  return {
    isValid: true,
    missingVars: []
  };
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYQA66rKOPrb4kce-hYCTYAbGKanVGbZ8",
  authDomain: "mirrorsbeautylounge-7c5ff.firebaseapp.com",
  projectId: "mirrorsbeautylounge-7c5ff",
  storageBucket: "mirrorsbeautylounge-7c5ff.firebasestorage.app",
  messagingSenderId: "1029530532506",
  appId: "1:1029530532506:web:2fa18cc521b2524e5afd23",
  measurementId: "G-GMWQSDP9JW"
};

// Initialize Firebase services
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

// Initialize Firebase only on client side
function initializeFirebase() {
  if (typeof window === 'undefined') {
    return;
  }
  
  if (app) {
    return;
  }
  
  const configValidation = validateFirebaseConfig();
  
  if (configValidation.isValid) {
    try {
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      
      // Initialize Firebase services
      db = getFirestore(app);
      storage = getStorage(app);
      auth = getAuth(app);
      

      
      // Initialize Analytics with error handling
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn('Firebase Analytics initialization failed:', error);
        analytics = null;
      }
      

    } catch (error) {
      console.error('Firebase initialization failed:', error);
      // Ensure auth is null on error
      auth = null;
    }
  } else {

    // Explicitly set auth to null when config is invalid
    auth = null;
  }
}

// Initialize Firebase on client side
if (typeof window !== 'undefined') {
  initializeFirebase();
}

// Export Firebase services (may be null if not configured)
export { db, storage, auth, analytics, initializeFirebase };
export default app;

// Helper function to check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return app !== null;
}

// Helper function to get Firebase configuration status
export function getFirebaseStatus() {
  const configValidation = validateFirebaseConfig();
  return {
    configured: app !== null,
    services: {
      app: app !== null,
      db: db !== null,
      storage: storage !== null,
      auth: auth !== null,
      analytics: analytics !== null
    },
    missingVars: configValidation.isValid ? [] : configValidation.missingVars
  };
}
