'use client';

import { useState, useEffect } from 'react';
import { addNetworkStatusListener, isOnline, getFirestoreConnectionStatus } from '../lib/networkUtils';

interface NetworkStatus {
  isOnline: boolean;
  isFirestoreConnected: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: isOnline(),
    isFirestoreConnected: getFirestoreConnectionStatus()
  });

  useEffect(() => {
    // Update initial status
    setNetworkStatus({
      isOnline: isOnline(),
      isFirestoreConnected: getFirestoreConnectionStatus()
    });

    // Listen for network changes
    const cleanup = addNetworkStatusListener((online) => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: online,
        isFirestoreConnected: online ? getFirestoreConnectionStatus() : false
      }));
    });

    // Check Firestore connection status periodically
    const firestoreCheckInterval = setInterval(() => {
      setNetworkStatus(prev => ({
        ...prev,
        isFirestoreConnected: getFirestoreConnectionStatus()
      }));
    }, 5000); // Check every 5 seconds

    return () => {
      cleanup?.();
      clearInterval(firestoreCheckInterval);
    };
  }, []);

  return networkStatus;
};

export default useNetworkStatus;