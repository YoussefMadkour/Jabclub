'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';
import Link from 'next/link';

interface Booking {
  id: number;
  member: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  bookedFor: {
    type: 'self' | 'child';
    id?: number;
    name: string;
    age?: number;
  };
  class: {
    id: number;
    type: string;
    startTime: string;
    endTime: string;
    duration: number;
    location: string;
    locationAddress: string;
    coach: string;
    isCancelled: boolean;
  };
  status: string;
  bookedAt: string;
  cancelledAt: string | null;
  attendanceMarkedAt: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassInstance {
  id: number;
  classType: {
    name: string;
  };
  startTime: string;
  location: {
    name: string;
  };
  coach: {
    firstName: string;
    lastName: string;
  };
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
}

export default function BookingManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Create booking form
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassInstance[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [createForm, setCreateForm] = useState({
    userId: '',
    classInstanceId: '',
    childId: ''
  });
  
  // Refund form
  const [refundForm, setRefundForm] = useState({
    userId: '',
    credits: '1',
    reason: ''
  });
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/admin/bookings');
      setBookings(response.data.data.bookings);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would need a new endpoint to list all users
      // For now, we'll leave it empty and users can type the user ID
      setUsers([]);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes/schedule');
      // API returns { data: { classes: [...], total: ... } }
      setClasses(response.data.data?.classes || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClasses([]); // Set to empty array on error
    }
  };

  const fetchChildren = async (userId: string) => {
    if (!userId) {
      setChildren([]);
      return;
    }
    try {
      // This would need admin access to member's children
      // For now, we'll leave it empty
      setChildren([]);
    } catch (err) {
      console.error('Error fetching children:', err);
    }
  };

  const handleCreateBooking = async () => {
    if (!createForm.userId || !createForm.classInstanceId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      const payload: any = {
        userId: parseInt(createForm.userId),
        classInstanceId: parseInt(createForm.classInstanceId)
      };
      
      if (createForm.childId) {
        payload.childId = parseInt(createForm.childId);
      }

      await apiClient.post('/admin/bookings', payload);
      
      alert('Booking created successfully!');
      setShowCreateModal(false);
      setCreateForm({ userId: '', classInstanceId: '', childId: '' });
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create booking');
      console.error('Error creating booking:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setProcessing(true);
      await apiClient.delete(`/admin/bookings/${selectedBooking.id}`);
      
      alert('Booking cancelled successfully! Credit has been refunded.');
      setShowCancelModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel booking');
      console.error('Error cancelling booking:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleIssueRefund = async () => {
    if (!refundForm.userId || !refundForm.credits) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.post('/admin/refund', {
        userId: parseInt(refundForm.userId),
        credits: parseInt(refundForm.credits),
        reason: refundForm.reason
      });
      
      alert('Refund issued successfully!');
      setShowRefundModal(false);
      setRefundForm({ userId: '', credits: '1', reason: '' });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to issue refund');
      console.error('Error issuing refund:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'attended':
        return 'bg-orange-100 text-orange-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Status filter
    if (statusFilter !== 'all' && booking.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        booking.member.name.toLowerCase().includes(search) ||
        booking.member.email.toLowerCase().includes(search) ||
        booking.class.type.toLowerCase().includes(search) ||
        booking.bookedFor.name.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600 mt-1">{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCreateModal(true);
              fetchClasses();
            }}
            className="px-4 py-2 bg-[#FF7A00] hover:bg-[#F57A00] text-white rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Booking
          </button>
          <button
            onClick={() => setShowRefundModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            Issue Refund
          </button>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by member, email, or class..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="attended">Attended</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-lg">No bookings found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked For</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.member.name}</div>
                        <div className="text-sm text-gray-500">{booking.member.email}</div>
                        <Link
                          href={`/admin/members/${booking.member.id}`}
                          className="text-xs text-[#FF7A00] hover:text-orange-700 font-medium mt-1 inline-block"
                        >
                          View Details →
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.bookedFor.name}</div>
                      <div className="text-sm text-gray-500">
                        {booking.bookedFor.type === 'child' ? `Child (${booking.bookedFor.age}y)` : 'Self'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{booking.class.type}</div>
                      <div className="text-sm text-gray-500">{booking.class.location}</div>
                      <div className="text-sm text-gray-500">Coach: {booking.class.coach}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(booking.class.startTime)}</div>
                      <div className="text-sm text-gray-500">{booking.class.duration} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => openCancelModal(booking)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Manual Booking</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID *</label>
                <input
                  type="number"
                  value={createForm.userId}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, userId: e.target.value });
                    fetchChildren(e.target.value);
                  }}
                  placeholder="Enter user ID"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <select
                  value={createForm.classInstanceId}
                  onChange={(e) => setCreateForm({ ...createForm, classInstanceId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a class</option>
                  {Array.isArray(classes) && classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.classType.name} - {formatDate(cls.startTime)} - {cls.location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Child ID (Optional)</label>
                <input
                  type="number"
                  value={createForm.childId}
                  onChange={(e) => setCreateForm({ ...createForm, childId: e.target.value })}
                  placeholder="Leave empty for self booking"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ userId: '', classInstanceId: '', childId: '' });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBooking}
                disabled={processing}
                className="flex-1 bg-[#FF7A00] hover:bg-[#F57A00] disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Booking</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this booking? The credit will be refunded to the member's account.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{selectedBooking.member.name}</p>
                <p className="text-gray-600">Booked for: {selectedBooking.bookedFor.name}</p>
                <p className="text-gray-600">{selectedBooking.class.type}</p>
                <p className="text-gray-600">{formatDate(selectedBooking.class.startTime)}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Manual Refund</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID *</label>
                <input
                  type="number"
                  value={refundForm.userId}
                  onChange={(e) => setRefundForm({ ...refundForm, userId: e.target.value })}
                  placeholder="Enter user ID"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credits *</label>
                <input
                  type="number"
                  min="1"
                  value={refundForm.credits}
                  onChange={(e) => setRefundForm({ ...refundForm, credits: e.target.value })}
                  placeholder="Number of credits"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="Optional reason for refund"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundForm({ userId: '', credits: '1', reason: '' });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueRefund}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Processing...' : 'Issue Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
