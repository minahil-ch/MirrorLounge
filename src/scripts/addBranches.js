// Script to add specific branch options to Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import 'dotenv/config';

// Firebase configuration using environment variables
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
const db = getFirestore(app);

// Branch data to add
const branchesToAdd = [
  {
    name: 'Mirrors Beauty Lounge - Batutta Mall',
    address: 'Batutta Mall, Dubai, UAE',
    phone: '+971-XX-XXXXXXX',
    email: 'batutta@mirrorsbeautylounge.com',
    manager: 'Branch Manager',
    openingHours: '10:00 AM - 10:00 PM',
    isActive: true,
    city: 'Dubai',
    country: 'UAE'
  },
  {
    name: 'Mirrors Beauty Lounge - AlI Bustan Centre',
    address: 'AlI Bustan Centre, Dubai, UAE',
    phone: '+971-XX-XXXXXXX',
    email: 'alibustan@mirrorsbeautylounge.com',
    manager: 'Branch Manager',
    openingHours: '10:00 AM - 10:00 PM',
    isActive: true,
    city: 'Dubai',
    country: 'UAE'
  },
  {
    name: 'Mirrors Beauty Lounge - Muraqabat',
    address: 'Muraqabat, Dubai, UAE',
    phone: '+971-XX-XXXXXXX',
    email: 'muraqabat@mirrorsbeautylounge.com',
    manager: 'Branch Manager',
    openingHours: '10:00 AM - 10:00 PM',
    isActive: true,
    city: 'Dubai',
    country: 'UAE'
  },
  {
    name: 'Mirrors Beauty Lounge - Barsha Heights',
    address: 'Barsha Heights, Dubai, UAE',
    phone: '+971-XX-XXXXXXX',
    email: 'barshaheights@mirrorsbeautylounge.com',
    manager: 'Branch Manager',
    openingHours: '10:00 AM - 10:00 PM',
    isActive: true,
    city: 'Dubai',
    country: 'UAE'
  },
  {
    name: 'Mirrors Beauty Lounge - Marina',
    address: 'Marina, Dubai, UAE',
    phone: '+971-XX-XXXXXXX',
    email: 'marina@mirrorsbeautylounge.com',
    manager: 'Branch Manager',
    openingHours: '10:00 AM - 10:00 PM',
    isActive: true,
    city: 'Dubai',
    country: 'UAE'
  }
];

async function addBranches() {
  try {
    console.log('Starting to add branches...');
    
    const branchesCollection = collection(db, 'branches');
    
    for (const branchData of branchesToAdd) {
      // Check if branch already exists
      const existingQuery = query(branchesCollection, where('name', '==', branchData.name));
      const existingDocs = await getDocs(existingQuery);
      
      if (existingDocs.empty) {
        // Add timestamp fields
        const branchWithTimestamp = {
          ...branchData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const docRef = await addDoc(branchesCollection, branchWithTimestamp);
        console.log(`✅ Added branch: ${branchData.name} with ID: ${docRef.id}`);
      } else {
        console.log(`⚠️  Branch already exists: ${branchData.name}`);
      }
    }
    
    console.log('✅ Finished adding branches!');
  } catch (error) {
    console.error('❌ Error adding branches:', error);
  }
}

// Run the script
addBranches();