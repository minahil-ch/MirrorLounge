'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Search,
  RefreshCw
} from 'lucide-react';
import { PaymentProvider, PaymentStatus, DashboardStats } from '@/types/payment';

interface ProviderStatus {
  name: string;
  provider: PaymentProvider;
  enabled: boolean;
  configured: boolean;
  status: 'active' | 'inactive' | 'error';
}

interface PaymentSearchResult {
  id: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  customerEmail?: string;
}

export default function PaymentsDashboard() {
  const [providers, setProviders] = useState<ProviderStatus[]>([
    { name: 'Stripe', provider: 'stripe', enabled: false, configured: false, status: 'inactive' },
    { name: 'Tamara', provider: 'tamara', enabled: false, configured: false, status: 'inactive' },
    { name: 'Tabby', provider: 'tabby', enabled: false, configured: false, status: 'inactive' }
  ]);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    totalRevenue: 0,
    currency: 'SAR',
    averageOrderValue: 0,
    conversionRate: 0,
    topPaymentMethod: 'stripe'
  });
  
  const [searchPaymentId, setSearchPaymentId] = useState('');
  const [searchProvider, setSearchProvider] = useState<PaymentProvider>('stripe');
  const [searchResult, setSearchResult] = useState<PaymentSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [activeTab, setActiveTab] = useState<'providers' | 'search'>('providers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProviderStatus();
    loadDashboardStats();
  }, [checkProviderStatus]);

  const checkProviderStatus = useCallback(async () => {
    try {
      // Check each provider's configuration status
      const updatedProviders = await Promise.all(
        providers.map(async (provider) => {
          try {
            // This would typically call an API endpoint to check provider status
            // For now, we'll simulate the check based on environment variables
            const configured = await checkProviderConfiguration(provider.provider);
            return {
              ...provider,
              configured,
              enabled: configured,
              status: configured ? 'active' as const : 'inactive' as const
            };
          } catch {
            return {
              ...provider,
              configured: false,
              enabled: false,
              status: 'error' as const
            };
          }
        })
      );
      
      setProviders(updatedProviders);
    } catch {
      console.error('Failed to check provider status');
    } finally {
      setLoading(false);
    }
  }, [providers]);

  const checkProviderConfiguration = async (provider: PaymentProvider): Promise<boolean> => {
    // This would typically make an API call to check if the provider is configured
    // For demonstration, we'll return true if certain conditions are met
    switch (provider) {
      case 'stripe':
        return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      case 'tamara':
        return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_TAMARA_API_URL;
      case 'tabby':
        return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_TABBY_API_URL;
      default:
        return false;
    }
  };

  const loadDashboardStats = async () => {
    try {
      // This would typically fetch real statistics from your database
      // For demonstration, we'll use mock data
      const mockStats: DashboardStats = {
        totalPayments: 1247,
        successfulPayments: 1156,
        failedPayments: 91,
        totalRevenue: 45678.50,
        currency: 'SAR',
        averageOrderValue: 367.25,
        conversionRate: 92.7,
        topPaymentMethod: 'stripe'
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const handlePaymentSearch = async () => {
    if (!searchPaymentId.trim()) {
      setSearchError('Please enter a payment ID');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const response = await fetch('/api/payments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: searchPaymentId,
          provider: searchProvider
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payment');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setSearchResult({
          id: data.data.id,
          provider: searchProvider,
          amount: data.data.amount,
          currency: data.data.currency,
          status: data.data.status,
          createdAt: data.data.created_at || new Date().toISOString(),
          customerEmail: data.data.customer_email,
          updatedAt: data.data.updated_at
        });
      } else {
        throw new Error('Payment not found');
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to search payment');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      succeeded: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      canceled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      requires_action: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getProviderStatusBadge = (provider: ProviderStatus) => {
    if (provider.status === 'active') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
    } else if (provider.status === 'error') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payment Dashboard</h1>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <div key={provider.name} className="bg-white rounded-lg border shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <h3 className="text-sm font-medium capitalize">
                {provider.name}
              </h3>
              {getProviderIcon(provider.name)}
            </div>
            <div className="p-6 pt-0">
              <div className="flex items-center space-x-2">
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    provider.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </span>
                {provider.configured ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {provider.configured ? 'Configured' : 'Not configured'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="text-sm font-medium">Total Revenue</h3>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {stats.currency} {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Average: {stats.currency} {stats.averageOrderValue.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="text-sm font-medium">Total Payments</h3>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.totalPayments.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              {stats.successfulPayments} successful, {stats.failedPayments} failed
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="text-sm font-medium">Conversion Rate</h3>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-gray-500">
              Top method: {stats.topPaymentMethod}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="text-sm font-medium">Active Providers</h3>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {providers.filter(p => p.status === 'active').length}/{providers.length}
            </div>
            <p className="text-xs text-gray-500">
              Payment methods available
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'providers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Providers
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Search
            </button>
          </nav>
        </div>
        
        {activeTab === 'providers' && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 pb-2">
              <h3 className="text-lg font-semibold">Payment Provider Status</h3>
              <p className="text-sm text-gray-600">
                Monitor the status and configuration of your payment providers
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div key={provider.provider} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-gray-600">
                          {provider.configured ? 'Configured' : 'Not configured'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getProviderStatusBadge(provider)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'search' && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 pb-2">
              <h3 className="text-lg font-semibold">Payment Search</h3>
              <p className="text-sm text-gray-600">
                Search for specific payments by ID and provider
              </p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="paymentId" className="block text-sm font-medium text-gray-700">Payment ID</label>
                  <input
                    id="paymentId"
                    type="text"
                    placeholder="Enter payment ID"
                    value={searchPaymentId}
                    onChange={(e) => setSearchPaymentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700">Provider</label>
                  <select
                    id="provider"
                    className="w-full p-2 border rounded-md"
                    value={searchProvider}
                    onChange={(e) => setSearchProvider(e.target.value as PaymentProvider)}
                  >
                    <option value="stripe">Stripe</option>
                    <option value="tamara">Tamara</option>
                    <option value="tabby">Tabby</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handlePaymentSearch}
                    disabled={isSearching}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSearching ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Search
                  </button>
                </div>
              </div>
              
              {searchError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{searchError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {searchResult && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-6 pb-2">
                    <h3 className="text-lg font-semibold">Payment Details</h3>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Payment ID</label>
                        <p className="text-sm text-gray-600">{searchResult.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Provider</label>
                        <p className="text-sm text-gray-600 capitalize">{searchResult.provider}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Amount</label>
                        <p className="text-sm text-gray-600">
                          {searchResult.currency} {searchResult.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <div className="mt-1">
                          {getStatusBadge(searchResult.status)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Created At</label>
                        <p className="text-sm text-gray-600">
                          {new Date(searchResult.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {searchResult.customerEmail && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Customer Email</label>
                          <p className="text-sm text-gray-600">{searchResult.customerEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}