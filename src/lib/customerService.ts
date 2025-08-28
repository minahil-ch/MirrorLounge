import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Customer, CustomerFormData, CustomerFilter, CustomerStats } from '../types/customer';
import { isNetworkError, retryWithBackoff, getFirestoreConnectionStatus, setFirestoreConnectionStatus } from './networkUtils';
import { saveCustomersToCache, loadCustomersFromCache } from './offlineCache';
import { ServiceResponse, BulkOperationResult } from '../types/api';

const CUSTOMERS_COLLECTION = 'customers';

// Get all customers with optional filtering and pagination
export const getCustomers = async (filter?: CustomerFilter, limitCount = 50, lastDoc?: QueryDocumentSnapshot<DocumentData>): Promise<ServiceResponse<{customers: Customer[], lastDoc?: QueryDocumentSnapshot<DocumentData>, hasMore: boolean}>> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      return {
        success: false,
        error: 'Firebase is not configured. Please set up your Firebase environment variables.'
      };
    }

    if (!getFirestoreConnectionStatus()) {
      return {
        success: false,
        error: 'No network connection available'
      };
    }

    const fetchCustomers = async () => {
      let q = query(
        collection(db, CUSTOMERS_COLLECTION),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filter?.status && filter.status !== 'all') {
        q = query(q, where('status', '==', filter.status));
      }
      
      if (filter?.membershipTier && filter.membershipTier !== 'all') {
        q = query(q, where('membershipTier', '==', filter.membershipTier));
      }

      if (filter?.branch) {
        q = query(q, where('preferences.preferredBranch', '==', filter.branch));
      }

      // Add pagination
      q = query(q, limit(limitCount));
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const customers: Customer[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate(),
          visitHistory: {
            ...data.visitHistory,
            lastVisit: data.visitHistory?.lastVisit?.toDate()
          }
        } as Customer);
      });

      return {
        customers,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === limitCount
      };
    };

    const result = await retryWithBackoff(fetchCustomers, 2, 1000);
    
    // Cache the successful result
    saveCustomersToCache(result.customers);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error getting customers:', error);
    
    if (isNetworkError(error)) {
      setFirestoreConnectionStatus(false);
    }
    
    // Try to load from cache as fallback
    const cachedCustomers = loadCustomersFromCache();
    if (cachedCustomers) {
      console.warn('Using cached customer data due to connection issues');
      return {
        success: true,
        data: {
          customers: cachedCustomers,
          lastDoc: undefined,
          hasMore: false
        },

      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get customers'
    };
  }
};

// Search customers by name, email, or phone
export const searchCustomers = async (searchTerm: string): Promise<ServiceResponse<Customer[]>> => {
  try {
    if (!isFirebaseConfigured() || !db) {
      return {
        success: false,
        error: 'Firebase is not configured. Please set up your Firebase environment variables.'
      };
    }

    const customers: Customer[] = [];
    
    // Search by name (case-insensitive)
    const nameQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      limit(20)
    );
    
    const nameSnapshot = await getDocs(nameQuery);
    nameSnapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dateOfBirth: data.dateOfBirth?.toDate(),
        visitHistory: {
          ...data.visitHistory,
          lastVisit: data.visitHistory?.lastVisit?.toDate()
        }
      } as Customer);
    });

    // Search by email
    const emailQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(20)
    );
    
    const emailSnapshot = await getDocs(emailQuery);
    emailSnapshot.forEach((doc) => {
      const data = doc.data();
      const customer = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dateOfBirth: data.dateOfBirth?.toDate(),
        visitHistory: {
          ...data.visitHistory,
          lastVisit: data.visitHistory?.lastVisit?.toDate()
        }
      } as Customer;
      
      // Avoid duplicates
      if (!customers.find(c => c.id === customer.id)) {
        customers.push(customer);
      }
    });

    return {
      success: true,
      data: customers
    };
  } catch (error) {
    console.error('Error searching customers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search customers'
    };
  }
};

// Subscribe to real-time customer updates
export const subscribeToCustomers = (callback: (customers: Customer[]) => void): (() => void) => {
  if (!isFirebaseConfigured() || !db) {
    console.warn('Firebase is not configured, skipping real-time subscription');
    return () => {}; // Return empty unsubscribe function
  }

  if (!getFirestoreConnectionStatus()) {
    console.warn('Firestore connection unavailable, skipping real-time subscription');
    return () => {}; // Return empty unsubscribe function
  }

  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  
  let unsubscribe: (() => void) | null = null;
  
  try {
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      const customers: Customer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        customers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate(),
          visitHistory: {
            ...data.visitHistory,
            lastVisit: data.visitHistory?.lastVisit?.toDate()
          }
        } as Customer);
      });
      callback(customers);
      
      // Reset connection status on successful data
      setFirestoreConnectionStatus(true);
    }, (error) => {
      console.error('Error in customer subscription:', error);
      
      if (isNetworkError(error)) {
        setFirestoreConnectionStatus(false);
        console.warn('Firestore connection lost, disabling real-time updates');
      }
    });
  } catch (error) {
    console.error('Failed to create Firestore subscription:', error);
    if (isNetworkError(error)) {
      setFirestoreConnectionStatus(false);
    }
    return () => {};
  }
  
  return unsubscribe || (() => {});
};

// Create a new customer
export const createCustomer = async (customerData: CustomerFormData): Promise<ServiceResponse<string>> => {
  try {
    const now = Timestamp.now();
    const customer = {
      ...customerData,
      dateOfBirth: customerData.dateOfBirth ? Timestamp.fromDate(new Date(customerData.dateOfBirth)) : null,
      visitHistory: {
        totalVisits: 0,
        totalSpent: 0,
        favoriteServices: []
      },
      loyaltyPoints: 0,
      membershipTier: 'bronze' as const,
      status: 'active' as const,
      tags: customerData.tags ? customerData.tags.split(',').map(tag => tag.trim()) : [],
      createdAt: now,
      updatedAt: now
    };

    // Remove undefined values to prevent Firebase errors
    Object.keys(customer).forEach(key => {
      if (customer[key as keyof typeof customer] === undefined) {
        delete customer[key as keyof typeof customer];
      }
    });

    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), customer);
    return {
      success: true,
      data: docRef.id
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer'
    };
  }
};

// Update customer
export const updateCustomer = async (customerId: string, updates: Partial<CustomerFormData>): Promise<ServiceResponse<void>> => {
  try {
    if (!customerId) {
      return {
        success: false,
        error: 'Customer ID is required'
      };
    }
    
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const updateData = {
      ...updates,
      dateOfBirth: updates.dateOfBirth ? Timestamp.fromDate(new Date(updates.dateOfBirth)) : undefined,
      tags: updates.tags ? updates.tags.split(',').map(tag => tag.trim()) : undefined,
      updatedAt: Timestamp.now()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    await updateDoc(customerRef, updateData);
    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('Error updating customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update customer'
    };
  }
};

// Update customer status
export const updateCustomerStatus = async (customerId: string, status: 'active' | 'inactive' | 'blocked'): Promise<ServiceResponse<void>> => {
  try {
    if (!customerId) {
      return {
        success: false,
        error: 'Customer ID is required'
      };
    }
    
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(customerRef, {
      status,
      updatedAt: Timestamp.now()
    });
    
    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('Error updating customer status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update customer status'
    };
  }
};

// Update customer visit history
export const updateCustomerVisitHistory = async (customerId: string, serviceAmount: number, services: string[]) => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(customerRef, {
      'visitHistory.totalVisits': (await getDocs(query(collection(db, CUSTOMERS_COLLECTION), where('__name__', '==', customerId)))).docs[0]?.data()?.visitHistory?.totalVisits + 1 || 1,
      'visitHistory.totalSpent': (await getDocs(query(collection(db, CUSTOMERS_COLLECTION), where('__name__', '==', customerId)))).docs[0]?.data()?.visitHistory?.totalSpent + serviceAmount || serviceAmount,
      'visitHistory.lastVisit': Timestamp.now(),
      'visitHistory.favoriteServices': services,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating customer visit history:', error);
    throw error;
  }
};

// Delete customer
export const deleteCustomer = async (customerId: string): Promise<ServiceResponse<void>> => {
  try {
    if (!customerId) {
      return {
        success: false,
        error: 'Customer ID is required'
      };
    }
    
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await deleteDoc(customerRef);
    
    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete customer'
    };
  }
};

// Get customer statistics
export const getCustomerStats = async (): Promise<ServiceResponse<CustomerStats>> => {
  try {
    const allCustomersQuery = query(collection(db, CUSTOMERS_COLLECTION));
    const allCustomersSnapshot = await getDocs(allCustomersQuery);
    
    const activeCustomersQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('status', '==', 'active')
    );
    const activeCustomersSnapshot = await getDocs(activeCustomersQuery);

    // Get customers from this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newCustomersQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('createdAt', '>=', Timestamp.fromDate(thisMonth))
    );
    const newCustomersSnapshot = await getDocs(newCustomersQuery);

    // Get top spenders
    const topSpendersQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy('visitHistory.totalSpent', 'desc'),
      limit(5)
    );
    const topSpendersSnapshot = await getDocs(topSpendersQuery);
    
    const topSpenders: Customer[] = [];
    topSpendersSnapshot.forEach((doc) => {
      const data = doc.data();
      topSpenders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dateOfBirth: data.dateOfBirth?.toDate(),
        visitHistory: {
          ...data.visitHistory,
          lastVisit: data.visitHistory?.lastVisit?.toDate()
        }
      } as Customer);
    });

    // Calculate membership distribution
    const membershipDistribution = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    };

    allCustomersSnapshot.forEach((doc) => {
      const data = doc.data();
      const tier = data.membershipTier || 'bronze';
      membershipDistribution[tier as keyof typeof membershipDistribution]++;
    });

    const stats: CustomerStats = {
      totalCustomers: allCustomersSnapshot.size,
      activeCustomers: activeCustomersSnapshot.size,
      newCustomersThisMonth: newCustomersSnapshot.size,
      topSpenders,
      membershipDistribution
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting customer stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get customer statistics'
    };
  }
};

// Bulk import customers
export const bulkImportCustomers = async (customers: CustomerFormData[]): Promise<BulkOperationResult> => {
  try {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    const data: Record<string, unknown>[] = [];

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      try {
        const customerId = await createCustomer(customer);
        successful++;
        data.push({ customerId: customerId.data, customer, row: i + 1 });
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${i + 1}: ${errorMessage}`);
        data.push({ error: errorMessage, customer, row: i + 1 });
      }
    }

    return {
      successful,
      failed,
      errors,
      data
    };
  } catch (error) {
    console.error('Error bulk importing customers:', error);
    throw error;
  }
};