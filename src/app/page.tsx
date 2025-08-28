'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { 
  Category,
  Service,
  Branch,
  Offer,
  subscribeToCategoriesChanges,
  subscribeToServicesChanges,
  subscribeToBranchesChanges,
  subscribeToOffersChanges
} from '@/lib/firebaseServicesNoStorage';

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates for all collections
  useEffect(() => {
    console.log('📊 Dashboard: Starting Firebase subscriptions');
    let loadedCount = 0;
    const totalCollections = 4;

    const checkAllLoaded = () => {
      loadedCount++;
      console.log(`📊 Dashboard: Collection loaded (${loadedCount}/${totalCollections})`);
      if (loadedCount === totalCollections) {
        console.log('📊 Dashboard: All collections loaded, setting loading to false');
        setLoading(false);
      }
    };

    // Subscribe to categories
    console.log('📊 Dashboard: Setting up categories subscription');
    const unsubscribeCategories = subscribeToCategoriesChanges(
      (updatedCategories) => {
        console.log('📊 Dashboard: Categories data received:', updatedCategories.length, 'items');
        setCategories(updatedCategories);
        checkAllLoaded();
      },
      (error) => {
        console.error('📊 Dashboard: Categories error:', error);
        checkAllLoaded();
      }
    );

    // Subscribe to services
    console.log('📊 Dashboard: Setting up services subscription');
    const unsubscribeServices = subscribeToServicesChanges(
      (updatedServices) => {
        console.log('📊 Dashboard: Services data received:', updatedServices.length, 'items');
        setServices(updatedServices);
        checkAllLoaded();
      },
      (error) => {
        console.error('📊 Dashboard: Services error:', error);
        checkAllLoaded();
      }
    );

    // Subscribe to branches
    console.log('📊 Dashboard: Setting up branches subscription');
    const unsubscribeBranches = subscribeToBranchesChanges(
      (updatedBranches) => {
        console.log('📊 Dashboard: Branches data received:', updatedBranches.length, 'items');
        setBranches(updatedBranches);
        checkAllLoaded();
      },
      (error) => {
        console.error('📊 Dashboard: Branches error:', error);
        checkAllLoaded();
      }
    );

    // Subscribe to offers
    console.log('📊 Dashboard: Setting up offers subscription');
    const unsubscribeOffers = subscribeToOffersChanges(
      (updatedOffers) => {
        console.log('📊 Dashboard: Offers data received:', updatedOffers.length, 'items');
        setOffers(updatedOffers);
        checkAllLoaded();
      },
      (error) => {
        console.error('📊 Dashboard: Offers error:', error);
        checkAllLoaded();
      }
    );

    return () => {
      console.log('📊 Dashboard: Cleaning up Firebase subscriptions');
      unsubscribeCategories();
      unsubscribeServices();
      unsubscribeBranches();
      unsubscribeOffers();
    };
  }, []);

  // Calculate real-time statistics
  const menServices = services.filter(service => service.category.toLowerCase().includes('men'));
  const womenServices = services.filter(service => service.category.toLowerCase().includes('women'));

  const activeServices = services.filter(service => service.isActive);
  // const activeBranches = branches.filter(branch => branch.isActive);
  const activeOffers = offers.filter(offer => offer.isActive && new Date(offer.validTo) >= new Date());

  // Calculate total revenue from services (example calculation)
  const totalRevenue = services.reduce((sum, service) => sum + (service.price || 0), 0);

  const stats = [
    { 
      name: 'Total Services', 
      value: services.length.toString(), 
      change: `${activeServices.length} active`,
      color: 'pink'
    },
    { 
      name: 'Categories', 
      value: categories.length.toString(), 
      change: `${categories.filter(cat => cat.serviceCount > 0).length} with services`,
      color: 'blue'
    },
    // { 
    //   name: 'Branches', 
    //   value: branches.length.toString(), 
    //   change: `${activeBranches.length} active`,
    //   color: 'green'
    // },
    { 
      name: 'Active Offers', 
      value: activeOffers.length.toString(), 
      change: `AED ${totalRevenue.toFixed(0)} total value`,
      color: 'purple'
    },
  ];

  // Get recent activity (last 5 items sorted by creation date)
  const recentActivity = [
    ...services.slice(0, 2).map(service => ({
      action: 'Service added',
      item: service.name,
      time: service.createdAt ? getTimeAgo(service.createdAt.toDate()) : 'Recently',
      type: 'service'
    })),
    ...categories.slice(0, 2).map(category => ({
      action: 'Category added',
      item: category.name,
      time: category.createdAt ? getTimeAgo(category.createdAt.toDate()) : 'Recently',
      type: 'category'
    })),
    ...branches.slice(0, 1).map(branch => ({
      action: 'Branch added',
      item: branch.name,
      time: branch.createdAt ? getTimeAgo(branch.createdAt.toDate()) : 'Recently',
      type: 'branch'
    }))
  ].slice(0, 5);

  const quickActions = [
    { name: 'Add Service', href: '/services', icon: '✂️' },
    { name: 'Add Category', href: '/catagories', icon: '📂' },
    // { name: 'Add Branch', href: '/branches', icon: '🏢' },
    { name: 'Create Offer', href: '/offers', icon: '🏷️' },
  ];

  // Helper function to get icon based on stat name
  const getStatIcon = (statName: string) => {
    const iconClass = "w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm";
    switch (statName.toLowerCase()) {
      case 'categories':
        return (
          
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v2h2V6H5zM3 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm2 2v2h2v-2H5zM13 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm2 2v2h2V6h-2zM13 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4zm2 2v2h2v-2h-2z" clipRule="evenodd" />
          </svg>
        );
      case 'services':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        );
      case 'branches':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
          </svg>
        );
      case 'offers':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.856.048L9.5 13.9l-4.409 1.645a1 1 0 01-1.298-1.298L5.438 9.838 1.134 6.9a1 1 0 010-1.732L5.438 2.162 6.793.807a1 1 0 011.298 1.298L9.5 6.1l1.611-3.404A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
        );
    }
  };

  // Helper function to get gradient colors based on stat color
   const getStatGradient = (color: string) => {
     switch (color) {
       case 'pink':
         return 'from-pink-500 to-pink-600';
       case 'purple':
         return 'from-purple-500 to-pink-500';
       case 'blue':
         return 'from-blue-500 to-pink-500';
       case 'green':
         return 'from-green-500 to-pink-500';
       case 'yellow':
         return 'from-yellow-500 to-pink-500';
       case 'red':
         return 'from-red-500 to-pink-500';
       default:
         return 'from-pink-500 to-pink-600';
     }
   };

   // Helper function to get action icons
   const getActionIcon = (iconType: string) => {
     const iconClass = "w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm";
     switch (iconType) {
       case 'plus':
         return (
           <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
           </svg>
         );
       case 'gift':
         return (
           <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.856.048L9.5 13.9l-4.409 1.645a1 1 0 01-1.298-1.298L5.438 9.838 1.134 6.9a1 1 0 010-1.732L5.438 2.162 6.793.807a1 1 0 011.298 1.298L9.5 6.1l1.611-3.404A1 1 0 0112 2z" clipRule="evenodd" />
           </svg>
         );
       case 'chart':
         return (
           <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
             <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
             <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
           </svg>
         );
       case 'settings':
         return (
           <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
           </svg>
         );
       default:
         return (
           <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v2h2V6H5z" clipRule="evenodd" />
           </svg>
         );
     }
   };

  // Helper function to calculate time ago
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 relative overflow-hidden">
        {/* Subtle background pattern for loading */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 70% 70%, rgba(219, 39, 119, 0.08) 0%, transparent 50%)`
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(30deg, transparent, transparent 40px, rgba(236, 72, 153, 0.03) 40px, rgba(236, 72, 153, 0.03) 80px)`
          }} />
        </div>
        
        {/* Animated background particles */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-2 h-2 bg-pink-300/30 dark:bg-black rounded-full animate-pulse" />
          <div className="absolute top-40 right-20 w-1 h-1 bg-pink-400/40 dark:bg-black rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-pink-200/50 dark:bg-black rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 right-10 w-1 h-1 bg-pink-300/40 dark:bg-black rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-pink-400/30 dark:bg-black rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />
          <div className="absolute bottom-1/2 right-1/3 w-1.5 h-1.5 bg-pink-300/25 dark:bg-black rounded-full animate-pulse" style={{ animationDelay: '1.8s' }} />
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {/* Loading header skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gradient-to-r from-pink-200/60 to-pink-100/40 rounded-xl w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gradient-to-r from-pink-100/50 to-pink-50/30 rounded-lg w-96 animate-pulse" />
          </div>
          
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[...Array(4)].map((_, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-white/95 via-pink-50/80 to-white/90 dark:bg-black backdrop-blur-xl border border-pink-200/40 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_8px_32px_rgba(233,30,99,0.12)] dark:bg-black  animate-pulse"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-200/60 to-pink-300/40  dark:bg-black rounded-xl sm:rounded-2xl" />
                  <div className="hidden sm:block">
                    <div className="w-12 h-3 bg-pink-100/60 rounded-full mb-1" />
                    <div className="w-8 h-0.5 bg-pink-200/50 rounded-full ml-auto" />
                  </div>
                </div>
                <div className="mb-2">
                  <div className="h-8 bg-gradient-to-r from-pink-200/50 to-pink-100/30 rounded-lg mb-2" />
                  <div className="h-4 bg-pink-100/40 rounded w-20" />
                </div>
                <div className="sm:hidden">
                  <div className="h-3 bg-pink-100/50 rounded w-16 mb-1" />
                  <div className="w-full h-0.5 bg-pink-200/40 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick actions skeleton */}
          <div className="bg-gradient-to-br from-white/95 via-pink-50/80 to-white/90 dark:bg-black backdrop-blur-xl border border-pink-200/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_8px_32px_rgba(233,30,99,0.12)] mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gradient-to-r from-pink-200/60 to-pink-100/40 dark:bg-black rounded-lg w-32" />
              <div className="w-8 h-0.5 bg-pink-200/50 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-br from-white/90 to-pink-50/60 border border-pink-200/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center animate-pulse"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 bg-gradient-to-br from-pink-200/60 to-pink-300/40 rounded-xl sm:rounded-2xl" />
                  <div className="h-4 bg-pink-100/50 rounded w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent activity skeleton */}
          <div className="bg-gradient-to-br from-white/95 via-pink-50/80 to-white/90  dark:bg-black backdrop-blur-xl border border-pink-200/40  dark:bg-black rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_8px_32px_rgba(233,30,99,0.12)]">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gradient-to-r from-pink-200/60 to-pink-100/40 rounded-lg w-36" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-300/60 rounded-full animate-pulse" />
                <div className="w-8 h-3 bg-pink-100/50 rounded" />
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-200/60 via-pink-300/40 to-pink-200/60 rounded-full" />
              
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div 
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-white/60 to-pink-50/40 border border-pink-200/30 animate-pulse"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-200/60 to-pink-300/40 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-pink-100/50 rounded mb-2 w-3/4" />
                      <div className="h-3 bg-pink-50/60 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Centered loading indicator */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-pink-200/50 dark:bg-black  rounded-full animate-spin" />
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDuration: '1s' }} />
                <div className="absolute inset-2 w-16 h-16 border-2 border-transparent border-t-pink-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
              </div>
              <div className="mt-6">
                <p className="text-pink-600 font-semibold text-lg mb-2">Loading Dashboard</p>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-white to-pink-100 dark:bg-black dark:text-white p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(219, 39, 119, 0.08) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.05) 0%, transparent 70%)`
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(236, 72, 153, 0.02) 35px, rgba(236, 72, 153, 0.02) 70px)`
        }} />
      </div>
      
      {/* Animated floating elements */}
      <div className="absolute inset-0 pointer-events-none dark:bg-black">
        <div className="absolute top-20 left-10 w-4 h-4 bg-pink-200/20 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-2 h-2 bg-pink-300/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-pink-100/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-pink-200/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-pink-400/25 rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-pink-300/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <div className="relative z-10 p-2 sm:p-3 dark:bg-black">
        <div className="max-w-5xl mx-auto">
        {/* Compact Header */}
        
        <div className="mb-4 sm:mb-6 px-2 sm:px-0 dark:bg-black">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mb-2">
            Dashboard Overview
          </h1>
          <p className="text-xs text-gray-600 dark:text-pink-500">
          Realtime overview of your services and offers
        </p>
        </div>
  
        {/* Enhanced Real-time Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 px-2 sm:px-0">
          {stats.map((stat, index) => (
            <div 
              key={stat.name} 
              className="group relative bg-gradient-to-br from-white/95 via-pink-50/80 to-white/90 backdrop-blur-xl border border-pink-200/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-[0_8px_32px_rgba(233,30,99,0.12)] transition-all duration-500 hover:shadow-[0_16px_48px_rgba(233,30,99,0.2)] hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] will-change-transform touch-manipulation"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-pink-400/5 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Floating particles effect */}
              <div className="absolute top-2 right-2 w-1 h-1 bg-pink-400/30 rounded-full animate-pulse" />
              <div className="absolute top-4 right-4 w-0.5 h-0.5 bg-pink-300/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`relative w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${getStatGradient(stat.color)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl" />
                    {getStatIcon(stat.name)}
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-400/20 to-pink-600/20 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs lg:text-sm text-pink-600/80 font-medium mb-0.5">{stat.change}</div>
                    <div className="w-8 lg:w-12 h-0.5 bg-gradient-to-r from-pink-300 to-pink-500 rounded-full ml-auto" />
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-700 to-pink-600 bg-clip-text text-transparent mb-1 group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base lg:text-lg text-pink-700 font-semibold tracking-wide">{stat.name}</div>
                </div>
                
                {/* Mobile change indicator */}
                <div className="sm:hidden">
                  <div className="text-xs text-pink-600/80 font-medium mb-2">{stat.change}</div>
                  <div className="w-full h-1 bg-gradient-to-r from-pink-300 to-pink-500 rounded-full" />
                </div>
                
                {/* Animated progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-100/50 rounded-b-2xl sm:rounded-b-3xl overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-b-2xl sm:rounded-b-3xl transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out"
                    style={{ animationDelay: `${index * 200}ms` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Real-time Services Overview */}
          <div>
            <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 dark:bg-black rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[0_8px_30px_rgb(233,30,99,0.15)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(233,30,99,0.25)]">
              <h2 className="text-sm font-semibold text-pink-700 mb-2 sm:mb-3">Services by Gender</h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-blue-50/50">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-blue-700">Men Services</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{menServices.length}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-pink-50/50">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-xs font-medium text-pink-700">Women Services</span>
                  </div>
                  <span className="text-sm font-bold text-pink-700">{womenServices.length}</span>
                </div>

              </div>
            </div>
          </div>

          {/* Enhanced Real-time Recent Activity */}
          <div>
            <div className="bg-gradient-to-br from-white/95 via-pink-50/80 to-white/90 dark:bg-black backdrop-blur-xl border border-pink-200/40  rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-[0_8px_32px_rgba(233,30,99,0.12)] mx-2 sm:mx-0">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-700 to-pink-600 dark:bg-black bg-clip-text text-transparent">Recent Activity</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-400 rounded-full animate-pulse dark:bg-black" />
                  <span className="text-xs lg:text-sm text-pink-600/80 font-medium">Live</span>
                </div>
              </div>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 lg:left-6 top-0 bottom-0 w-0.5 lg:w-1 bg-gradient-to-b from-pink-300 via-pink-400 to-pink-300 dark:bg-black rounded-full" />
                
                <div className="space-y-6 lg:space-y-8">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div 
                        key={index} 
                        className="group relative flex items-start space-x-4 lg:space-x-6 p-4 lg:p-6 rounded-xl lg:rounded-2xl bg-gradient-to-r from-white/60 to-pink-50/40 dark:bg-black hover:from-white/80 hover:to-pink-50/60 border border-pink-200/30 hover:border-pink-300/50 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(233,30,99,0.15)] hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-pink-500 to-pink-600  dark:bg-black rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white dark:bg-black rounded-full" />
                            <div className="absolute -inset-1 bg-pink-400/30 rounded-full blur opacity-0 group-hover:opacity-100 dark:bg-black transition-opacity duration-300" />
                          </div>
                          {/* Connecting line to timeline */}
                          <div className="absolute top-4 lg:top-5 -left-4 lg:-left-6 w-4 lg:w-6 h-0.5 lg:h-1 bg-gradient-to-r from-pink-400 to-pink-300  dark:bg-black" />
                        </div>
                        
                        {/* Activity content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm sm:text-base lg:text-lg text-pink-700 font-semibold group-hover:text-pink-800 dark:bg-black transition-colors duration-200">
                              {activity.action}: <span className="text-pink-600">{activity.item}</span>
                            </p>
                            <div className="flex items-center space-x-1 ml-2">
                              <div className="w-1 h-1 bg-pink-400/60 dark:bg-black rounded-full" />
                              <div className="w-1 h-1 bg-pink-300/60 dark:bg-black rounded-full" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs sm:text-sm lg:text-base text-pink-600/80 font-medium">{activity.time}</p>
                            <div className="w-12 h-0.5 bg-gradient-to-r from-pink-300 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                        
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-pink-400/5 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 bg-pink-300 rounded-full opacity-50" />
                      </div>
                      <p className="text-sm text-pink-500 font-medium mb-2">No recent activity</p>
                      <p className="text-xs text-pink-400">Start by adding some data to see live updates!</p>
                    </div>
                  )}
                </div>
                
                {/* Timeline end indicator */}
                {recentActivity.length > 0 && (
                  <div className="absolute left-3 -bottom-2 w-2 h-2 bg-pink-300 rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mt-3 sm:mt-4">
          <div className="bg-gradient-to-br from-white/95 via-pink-50/80 to-white/90 backdrop-blur-xl border border-pink-200/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-[0_8px_32px_rgba(233,30,99,0.12)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(233,30,99,0.25)] mx-2 sm:mx-0">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-700 to-pink-600 bg-clip-text text-transparent">Quick Actions</h2>
              <div className="w-12 lg:w-16 h-0.5 bg-gradient-to-r from-pink-300 to-pink-500 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {quickActions.map((action, index) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="group relative bg-gradient-to-br from-white/90 to-pink-50/60 dark:bg-black  hover:from-white hover:to-pink-50/80 border border-pink-200/50 hover:border-pink-300/60 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 text-center transition-all duration-300 hover:shadow-[0_8px_32px_rgba(233,30,99,0.2)] hover:scale-105 hover:-translate-y-1 active:scale-95 will-change-transform touch-manipulation"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Floating particles */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-pink-400/40 rounded-full animate-pulse" />
                  <div className="absolute top-2 right-3 w-0.5 h-0.5 bg-pink-300/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                  
                  {/* Icon container */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 mx-auto mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl" />
                    <span className="text-white text-lg sm:text-xl">{action.icon}</span>
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-400/30 to-pink-600/30 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Action name */}
                  <div className="text-sm sm:text-base lg:text-lg font-semibold text-pink-700 group-hover:text-pink-800 transition-colors duration-200">
                    {action.name}
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-pink-400/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 group-hover:w-8 h-0.5 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Summary Cards */}
        <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Categories Summary */}
          <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[0_8px_30px_rgb(233,30,99,0.15)]">
            <h3 className="text-sm font-semibold text-pink-700 mb-2">Categories</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-blue-600">Men: {categories.filter(cat => cat.gender === 'men').length}</span>
                <span className="text-pink-600">Women: {categories.filter(cat => cat.gender === 'women').length}</span>
              </div>

            </div>
          </div>

          {/* Branches Summary */}
          {/* <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-2xl p-4 shadow-[0_8px_30px_rgb(233,30,99,0.15)]">
            <h3 className="text-sm font-semibold text-pink-700 mb-2">Branches</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Active: {activeBranches.length}</span>
                <span className="text-gray-600">Inactive: {branches.length - activeBranches.length}</span>
              </div>
              <div className="text-xs text-pink-600">
                Total Locations: {branches.length}
              </div>
            </div>
          </div> */}

          {/* Offers Summary */}
          <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-[0_8px_30px_rgb(233,30,99,0.15)]">
            <h3 className="text-sm font-semibold text-pink-700 mb-2">Offers</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Active: {activeOffers.length}</span>
                <span className="text-gray-600">Total: {offers.length}</span>
              </div>
              <div className="text-xs text-pink-600">
                Expired: {offers.filter(offer => new Date(offer.validTo) < new Date()).length}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
