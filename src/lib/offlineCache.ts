// Offline cache utility for customer data
import { Customer } from '../types/customer';

const CACHE_KEY = 'mirror_beauty_customers_cache';
const CACHE_TIMESTAMP_KEY = 'mirror_beauty_customers_cache_timestamp';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Save customers to local storage
export const saveCustomersToCache = (customers: Customer[]): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const cacheData = {
      customers,
      timestamp: Date.now()
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    console.warn('Failed to save customers to cache');
  }
};

// Load customers from local storage
export const loadCustomersFromCache = (): Customer[] | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const cachedData = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cachedData || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    if (cacheAge > CACHE_EXPIRY_MS) {
      // Cache expired, remove it
      clearCustomersCache();
      return null;
    }
    
    const parsed = JSON.parse(cachedData);
    
    // Convert date strings back to Date objects
    return parsed.customers.map((customer: Customer) => ({
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
      dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth) : undefined,
      visitHistory: {
        ...customer.visitHistory,
        lastVisit: customer.visitHistory?.lastVisit ? new Date(customer.visitHistory.lastVisit) : undefined
      }
    }));
  } catch {
    console.warn('Failed to load customers from cache');
    return null;
  }
};

// Clear customers cache
export const clearCustomersCache = (): void => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch {
    console.warn('Failed to clear customers cache');
  }
};

// Check if cache is valid
export const isCacheValid = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    return cacheAge <= CACHE_EXPIRY_MS;
  } catch {
    return false;
  }
};

// Get cache info
export const getCacheInfo = (): { isValid: boolean; age: number; count: number } => {
  try {
    if (typeof window === 'undefined') {
      return { isValid: false, age: 0, count: 0 };
    }
    
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!timestamp || !cachedData) {
      return { isValid: false, age: 0, count: 0 };
    }
    
    const age = Date.now() - parseInt(timestamp);
    const isValid = age <= CACHE_EXPIRY_MS;
    
    let count = 0;
    try {
      const parsed = JSON.parse(cachedData);
      count = parsed.customers?.length || 0;
    } catch {
      count = 0;
    }
    
    return { isValid, age, count };
  } catch {
    return { isValid: false, age: 0, count: 0 };
  }
};