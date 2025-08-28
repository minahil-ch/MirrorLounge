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
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

// Category interface
export interface Category {
  id?: string;
  name: string;
  description: string;
  serviceCount: number;
  color: string;
  image?: string;
  imageUrl?: string;
  gender: "men" | "women" | "unisex";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Categories collection reference
const categoriesCollection = collection(db, "categories");

// Upload image to Firebase Storage
export const uploadCategoryImage = async (
  file: File,
  categoryId: string
): Promise<string> => {
  try {
    // Create a safe filename by removing special characters and spaces
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const safeFileName = `category_${timestamp}.${fileExtension}`;
    
    const imageRef = ref(storage, `categories/${categoryId}/${safeFileName}`);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Delete image from Firebase Storage
export const deleteCategoryImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the full URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)$/);
    if (pathMatch) {
      const path = decodeURIComponent(pathMatch[1]);
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    // Don't throw error for image deletion as it's not critical
  }
};

// Add new category
export const addCategory = async (
  categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const docRef = await addDoc(categoriesCollection, {
      ...categoryData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

// Update category
export const updateCategory = async (
  categoryId: string,
  categoryData: Partial<Category>
): Promise<void> => {
  try {
    const categoryRef = doc(db, "categories", categoryId);
    await updateDoc(categoryRef, {
      ...categoryData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (
  categoryId: string,
  imageUrl?: string
): Promise<void> => {
  try {
    // Delete image if exists
    if (imageUrl) {
      await deleteCategoryImage(imageUrl);
    }

    // Delete document
    const categoryRef = doc(db, "categories", categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(categoriesCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];

    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      } as Category);
    });

    return categories;
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

// Listen to categories changes (real-time)
export const subscribeToCategoriesChanges = (
  callback: (categories: Category[]) => void
) => {
  const q = query(categoriesCollection, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (querySnapshot) => {
      const categories: Category[] = [];
      querySnapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data(),
        } as Category);
      });
      callback(categories);
    },
    (error) => {
      console.error("Error listening to categories:", error);
    }
  );
};
