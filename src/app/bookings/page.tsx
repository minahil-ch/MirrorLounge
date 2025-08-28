'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CreditCard, 
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface BookingService {
  serviceId: string;
  serviceName: string;
  category: string;
  duration: number;
  price: number;
  quantity: number;
}

interface Booking {
  id: string;
  userId: string;
  customerName: string;
  services: BookingService[];
  bookingDate: Date;
  bookingTime: string;
  branch: string;
  totalPrice: number;
  totalDuration: number;
  status: 'upcoming' | 'past' | 'cancelled';
  paymentMethod: string;
  emailConfirmation: boolean;
  smsConfirmation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<{[key: string]: User}>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load bookings from Firebase
  useEffect(() => {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || '',
          customerName: data.customerName || '',
          services: data.services || [],
          bookingDate: data.bookingDate?.toDate() || new Date(),
          bookingTime: data.bookingTime || '',
          branch: data.branch || '',
          totalPrice: data.totalPrice || 0,
          totalDuration: data.totalDuration || 0,
          status: data.status || 'upcoming',
          paymentMethod: data.paymentMethod || 'cash',
          emailConfirmation: data.emailConfirmation || false,
          smsConfirmation: data.smsConfirmation || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Booking;
      });
      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user details
  useEffect(() => {
    const loadUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: {[key: string]: User} = {};
      
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        usersData[doc.id] = {
          id: doc.id,
          name: data.name || data.displayName || 'Unknown User',
          email: data.email || '',
          phone: data.phone || data.phoneNumber || ''
        };
      });
      
      setUsers(usersData);
    };

    loadUsers();
  }, []);

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.services.some(service => 
        service.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment status icon
  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
      case 'credit':
      case 'debit':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-3 text-pink-600">Loading bookings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto dark:text-white">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bookings Management</h1>
          <p className="text-gray-600 dark:text-white">Manage all customer bookings and appointments</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by customer name, branch, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full max-w-screen overflow-hidden bg-black text-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'upcoming').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Past</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'past').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => {
                  const user = users[booking.userId];
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-pink-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.services.slice(0, 2).map((service, index) => (
                            <div key={index} className="mb-1">
                              {service.serviceName} {service.quantity > 1 && `(x${service.quantity})`}
                            </div>
                          ))}
                          {booking.services.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{booking.services.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div>{format(booking.bookingDate, 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {booking.bookingTime}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {booking.branch}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            {getPaymentIcon(booking.paymentMethod)}
                            <span className="ml-2">${booking.totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {booking.paymentMethod}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                          getStatusBadge(booking.status)
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetails(true);
                            }}
                            className="text-pink-600 hover:text-pink-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {booking.status === 'upcoming' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'past')}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No bookings have been made yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Booking Details Modal */}
        {showDetails && selectedBooking && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBooking.customerName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        getStatusBadge(selectedBooking.status)
                      }`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(selectedBooking.bookingDate, 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBooking.bookingTime}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Branch</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.branch}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Services</label>
                    <div className="mt-1 space-y-2">
                      {selectedBooking.services.map((service, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
                            <p className="text-xs text-gray-500">{service.category} • {service.duration} min</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${service.price.toFixed(2)} x {service.quantity}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${(service.price * service.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Duration</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedBooking.totalDuration} minutes</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Price</label>
                      <p className="mt-1 text-sm font-bold text-gray-900">${selectedBooking.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedBooking.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirmations</label>
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-600">
                          Email: {selectedBooking.emailConfirmation ? '✓ Sent' : '✗ Not sent'}
                        </p>
                        <p className="text-xs text-gray-600">
                          SMS: {selectedBooking.smsConfirmation ? '✓ Sent' : '✗ Not sent'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-xs text-gray-500">
                        {format(selectedBooking.createdAt, 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="mt-1 text-xs text-gray-500">
                        {format(selectedBooking.updatedAt, 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}