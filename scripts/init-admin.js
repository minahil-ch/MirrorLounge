/**
 * Admin User Initialization Script
 * 
 * This script creates the admin user with the correct credentials
 * that match the demo credentials shown on the signin page.
 * 
 * Run this script with: node scripts/init-admin.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration (same as in your project)
const firebaseConfig = {
  apiKey: "AIzaSyBYQA66rKOPrb4kce-hYCTYAbGKanVGbZ8",
  authDomain: "mirrorsbeautylounge-7c5ff.firebaseapp.com",
  projectId: "mirrorsbeautylounge-7c5ff",
  storageBucket: "mirrorsbeautylounge-7c5ff.firebasestorage.app",
  messagingSenderId: "1029530532506",
  appId: "1:1029530532506:web:2fa18cc521b2524e5afd23",
  measurementId: "G-GMWQSDP9JW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    console.log('Creating admin user: admin@mirrorbeauty.com');
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@mirrorbeauty.com',
      'admin123'
    );

    console.log('User created successfully with UID:', userCredential.user.uid);

    // Set display name
    await updateProfile(userCredential.user, { 
      displayName: 'Admin User' 
    });

    console.log('Display name updated');

    // Create user role document in Firestore
    const userData = {
      uid: userCredential.user.uid,
      email: 'admin@mirrorbeauty.com',
      displayName: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@mirrorbeauty.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin user already exists with this email.');
    } else if (error.code === 'auth/weak-password') {
      console.log('ℹ️  Password should be at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('ℹ️  Invalid email address.');
    }
    
    process.exit(1);
  }
}

// Run the script
createAdminUser();