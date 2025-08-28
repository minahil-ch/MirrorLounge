// Network utility functions for handling connection issues

// Check if the browser is online
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// Network status listener
export const addNetworkStatusListener = (callback: (isOnline: boolean) => void) => {
  if (typeof window === 'undefined') return;
  
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Check if error is network-related
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorCode.includes('unavailable') ||
    errorCode.includes('deadline-exceeded') ||
    errorCode.includes('network-error')
  );
};

// Firestore connection status
let firestoreConnectionStatus = true;

export const setFirestoreConnectionStatus = (status: boolean) => {
  firestoreConnectionStatus = status;
};

export const getFirestoreConnectionStatus = (): boolean => {
  return firestoreConnectionStatus && isOnline();
};