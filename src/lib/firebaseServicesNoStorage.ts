import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// Category interface - using base64 images instead of Storage URLs
export interface Category {
  id?: string;
  name: string;
  description: string;
  serviceCount: number;
  color: string;
  imageBase64?: string; // Store image as base64 string
  gender: 'men' | 'women' | 'unisex';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Categories collection reference - will be initialized when Firebase is configured
let categoriesCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  categoriesCollection = collection(db, 'categories');
}

// Convert file to base64 string
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

// Compress image to reduce size (optional - for better performance)
export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => reject(new Error('Error loading image'));
    img.src = URL.createObjectURL(file);
  });
};

// Add new category
export const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!isFirebaseConfigured() || !db || !categoriesCollection) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const docRef = await addDoc(categoriesCollection, {
      ...categoryData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Update category
export const updateCategory = async (categoryId: string, categoryData: Partial<Category>): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      ...categoryData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    if (!isFirebaseConfigured() || !db || !categoriesCollection) {
      console.warn('Firebase is not configured, returning empty categories list');
      return [];
    }

    const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];
    
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      } as Category);
    });
    
    return categories;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

// Listen to categories changes (real-time)
export const subscribeToCategoriesChanges = (
  callback: (categories: Category[]) => void,
  errorCallback?: (error: Error) => void
) => {
  if (!isFirebaseConfigured() || !db || !categoriesCollection) {
    console.warn('Firebase is not configured, skipping categories subscription');
    return () => {}; // Return empty unsubscribe function
  }

  const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      } as Category);
    });
    callback(categories);
  }, (error) => {
    console.error('Error listening to categories:', error);
    if (errorCallback) {
      errorCallback(error);
    }
  });
};

// ==================== SERVICES FUNCTIONS ====================

// Service interface
export interface Service {
  id?: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  isActive: boolean;
  imageBase64?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Services collection reference - will be initialized when Firebase is configured
let servicesCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  servicesCollection = collection(db, 'services');
}

// Add new service
export const addService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!isFirebaseConfigured() || !db || !servicesCollection) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const docRef = await addDoc(servicesCollection, {
      ...serviceData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};

// Update service
export const updateService = async (serviceId: string, serviceData: Partial<Service>): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

// Delete service
export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const serviceRef = doc(db, 'services', serviceId);
    await deleteDoc(serviceRef);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Get all services
export const getServices = async (): Promise<Service[]> => {
  try {
    if (!isFirebaseConfigured() || !db || !servicesCollection) {
      console.warn('Firebase is not configured, returning empty services list');
      return [];
    }

    const q = query(servicesCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const services: Service[] = [];
    
    querySnapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data()
      } as Service);
    });
    
    return services;
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

// Listen to services changes (real-time)
export const subscribeToServicesChanges = (
  callback: (services: Service[]) => void,
  errorCallback?: (error: Error) => void
) => {
  if (!isFirebaseConfigured() || !db || !servicesCollection) {
    console.warn('Firebase is not configured, skipping services subscription');
    return () => {}; // Return empty unsubscribe function
  }

  const q = query(servicesCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const services: Service[] = [];
    querySnapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data()
      } as Service);
    });
    callback(services);
  }, (error) => {
    console.error('Error listening to services:', error);
    if (errorCallback) {
      errorCallback(error);
    }
  });
};

// ==================== BRANCHES FUNCTIONS ====================

// Branch interface
export interface Branch {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  openingHours: string;
  isActive: boolean;
  imageBase64?: string;
  city: string;
  country: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Branches collection reference - will be initialized when Firebase is configured
let branchesCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  branchesCollection = collection(db, 'branches');
}

// Add new branch
export const addBranch = async (branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!isFirebaseConfigured() || !db || !branchesCollection) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const docRef = await addDoc(branchesCollection, {
      ...branchData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding branch:', error);
    throw error;
  }
};

// Update branch
export const updateBranch = async (branchId: string, branchData: Partial<Branch>): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const branchRef = doc(db, 'branches', branchId);
    await updateDoc(branchRef, {
      ...branchData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating branch:', error);
    throw error;
  }
};

// Delete branch
export const deleteBranch = async (branchId: string): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const branchRef = doc(db, 'branches', branchId);
    await deleteDoc(branchRef);
  } catch (error) {
    console.error('Error deleting branch:', error);
    throw error;
  }
};

// Get all branches
export const getBranches = async (): Promise<Branch[]> => {
  try {
    if (!isFirebaseConfigured() || !db || !branchesCollection) {
      console.warn('Firebase is not configured, returning empty branches list');
      return [];
    }

    const q = query(branchesCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const branches: Branch[] = [];
    
    querySnapshot.forEach((doc) => {
      branches.push({
        id: doc.id,
        ...doc.data()
      } as Branch);
    });
    
    return branches;
  } catch (error) {
    console.error('Error getting branches:', error);
    throw error;
  }
};

// Listen to branches changes (real-time)
export const subscribeToBranchesChanges = (
  callback: (branches: Branch[]) => void,
  errorCallback?: (error: Error) => void
) => {
  if (!isFirebaseConfigured() || !db || !branchesCollection) {
    console.warn('Firebase is not configured, skipping branches subscription');
    return () => {}; // Return empty unsubscribe function
  }

  const q = query(branchesCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const branches: Branch[] = [];
    querySnapshot.forEach((doc) => {
      branches.push({
        id: doc.id,
        ...doc.data()
      } as Branch);
    });
    callback(branches);
  }, (error) => {
    console.error('Error listening to branches:', error);
    if (errorCallback) {
      errorCallback(error);
    }
  });
};

// ==================== OFFERS FUNCTIONS ====================

// Offer interface
export interface Offer {
  id?: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  imageBase64?: string;
  selectedBranches: string[]; // Array of branch IDs
  selectedServices: string[]; // Array of service IDs
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Offers collection reference - will be initialized when Firebase is configured
let offersCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  offersCollection = collection(db, 'offers');
}

// Add new offer
export const addOffer = async (offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!isFirebaseConfigured() || !db || !offersCollection) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const docRef = await addDoc(offersCollection, {
      ...offerData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding offer:', error);
    throw error;
  }
};

// Update offer
export const updateOffer = async (offerId: string, offerData: Partial<Offer>): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const offerRef = doc(db, 'offers', offerId);
    await updateDoc(offerRef, {
      ...offerData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
};

// Delete offer
export const deleteOffer = async (offerId: string): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
    }

    const offerRef = doc(db, 'offers', offerId);
    await deleteDoc(offerRef);
  } catch (error) {
    console.error('Error deleting offer:', error);
    throw error;
  }
};

// Get all offers
export const getOffers = async (): Promise<Offer[]> => {
  try {
    if (!isFirebaseConfigured() || !db || !offersCollection) {
      console.warn('Firebase is not configured, returning empty offers list');
      return [];
    }

    const q = query(offersCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const offers: Offer[] = [];
    
    querySnapshot.forEach((doc) => {
      offers.push({
        id: doc.id,
        ...doc.data()
      } as Offer);
    });
    
    return offers;
  } catch (error) {
    console.error('Error getting offers:', error);
    throw error;
  }
};

// Listen to offers changes (real-time)
export const subscribeToOffersChanges = (
  callback: (offers: Offer[]) => void,
  errorCallback?: (error: Error) => void
) => {
  const q = query(offersCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const offers: Offer[] = [];
    querySnapshot.forEach((doc) => {
      offers.push({
        id: doc.id,
        ...doc.data()
      } as Offer);
    });
    callback(offers);
  }, (error) => {
    console.error('Error listening to offers:', error);
    if (errorCallback) {
      errorCallback(error);
    }
  });
};