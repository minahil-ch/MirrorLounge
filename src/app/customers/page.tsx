'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Upload, Trash2, Eye } from 'lucide-react';
import { Customer, CustomerFilter, CustomerStats } from '../../types/customer';
import { getCustomers, searchCustomers, deleteCustomer, getCustomerStats } from '../../lib/customerService';
import { useAuth } from '../../contexts/AuthContext';
import DataImport from '../../components/DataImport';
// Removed unused import

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter] = useState<CustomerFilter>({ status: 'all' });
  const [showImport, setShowImport] = useState(false);
  // Removed unused state variables
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    topSpenders: [],
    membershipDistribution: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    }
  });

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCustomers(filter);
      if (result.success && result.data) {
        setCustomers(result.data.customers);
        setFilteredCustomers(result.data.customers);
        setUsingCachedData(result.fromCache || false);
      } else {
        console.error('Failed to fetch customers:', result.error);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const result = await getCustomerStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error('Failed to fetch stats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Search customers
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    try {
      const result = await searchCustomers(term);
      if (result.success && result.data) {
        setFilteredCustomers(result.data);
      } else {
        // Fallback to client-side filtering
        const filtered = customers.filter(customer =>
          customer.name.toLowerCase().includes(term.toLowerCase()) ||
          customer.email.toLowerCase().includes(term.toLowerCase()) ||
          customer.phone.includes(term)
        );
        setFilteredCustomers(filtered);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      // Fallback to client-side filtering
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(term.toLowerCase()) ||
        customer.email.toLowerCase().includes(term.toLowerCase()) ||
        customer.phone.includes(term)
      );
      setFilteredCustomers(filtered);
    }
  };



  // Delete customer
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const result = await deleteCustomer(id);
      if (result.success) {
        fetchCustomers();
        fetchStats();
      } else {
        console.error('Failed to delete customer:', result.error);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [filter, fetchCustomers, fetchStats]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the customer management system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="max-w-7xl mx-auto">

        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage your beauty salon customers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
              <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newCustomersThisMonth}</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platinum Members</p>
                <p className="text-2xl font-bold text-purple-600">{stats.membershipDistribution.platinum}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Import
              </button>
              

            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => customer.id && handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <DataImport
          onImportComplete={() => {
            setShowImport(false);
            fetchCustomers();
            fetchStats();
          }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}