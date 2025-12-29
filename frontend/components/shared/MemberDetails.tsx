'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import apiClient from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Helper function to safely format dates
const safeFormatDate = (date: string | null | undefined, formatStr: string): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

interface MemberDetailsProps {
  memberId: number;
  isAdmin?: boolean;
}

interface MemberDetailsData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  statistics: {
    totalCredits?: number;
    activePackagesCount?: number;
    totalPackagesCount?: number;
    totalBookings: number;
    confirmedBookings: number;
    attendedBookings: number;
    noShowBookings: number;
    cancelledBookings?: number;
    totalPayments?: number;
    approvedPayments?: number;
    pendingPayments?: number;
    rejectedPayments?: number;
    totalBookingsWithCoach?: number;
    attendanceRate?: string;
  };
  children: Array<{
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    createdAt?: string;
    statistics?: {
      totalBookings?: number;
      totalBookingsWithCoach?: number;
      confirmedBookings?: number;
      attendedBookings?: number;
      noShowBookings?: number;
      cancelledBookings?: number;
      attendanceRate?: string;
    };
    recentBookings?: Array<{
      id: number;
      classType: string;
      location: string;
      coach?: string;
      startTime: string;
      status: string;
      bookedAt: string;
      attendanceMarkedAt: string | null;
    }>;
  }>;
  packages?: Array<{
    id: number;
    packageName: string;
    sessionsTotal: number;
    sessionsRemaining: number;
    purchaseDate: string;
    expiryDate: string;
    isExpired: boolean;
    price: number;
  }>;
  payments?: Array<{
    id: number;
    packageName: string;
    amount: number;
    status: string;
    screenshotUrl: string;
    submittedAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    rejectionReason: string | null;
  }>;
  recentBookings: Array<{
    id: number;
    classType: string;
    location: string;
    coach?: string;
    startTime: string;
    bookedFor: string;
    status: string;
    bookedAt: string;
    attendanceMarkedAt: string | null;
  }>;
  recentTransactions?: Array<{
    id: number;
    transactionType: string;
    creditsChange: number;
    balanceAfter: number;
    notes: string | null;
    createdAt: string;
  }>;
}

export default function MemberDetails({ memberId, isAdmin = false }: MemberDetailsProps) {
  const router = useRouter();
  const endpoint = isAdmin ? `/admin/members/${memberId}` : `/coach/members/${memberId}`;

  const { data, isLoading, error } = useQuery<MemberDetailsData>({
    queryKey: ['member-details', memberId, isAdmin],
    queryFn: async () => {
      const response = await apiClient.get(endpoint);
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load member details. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {data.firstName} {data.lastName}
            </h1>
            <p className="text-gray-600 mt-1">Member Details</p>
          </div>
          <div className="flex gap-2 items-center">
            {isAdmin && <MemberActions memberId={memberId} memberData={data} />}
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-lg font-medium">{data.email}</p>
          </div>
          {data.phone && (
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-lg font-medium">{data.phone}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="text-lg font-medium">
              {safeFormatDate(data.createdAt, 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900">{data.statistics.totalBookings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Attended</p>
          <p className="text-2xl font-bold text-green-600">{data.statistics.attendedBookings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">No-Show</p>
          <p className="text-2xl font-bold text-red-600">{data.statistics.noShowBookings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-2xl font-bold text-blue-600">{data.statistics.confirmedBookings}</p>
        </div>
        {isAdmin && data.statistics.totalCredits !== undefined && (
          <>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-purple-600">{data.statistics.totalCredits}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Active Packages</p>
              <p className="text-2xl font-bold text-indigo-600">
                {data.statistics.activePackagesCount}
              </p>
            </div>
          </>
        )}
        {!isAdmin && data.statistics.attendanceRate && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Attendance Rate</p>
            <p className="text-2xl font-bold text-indigo-600">
              {data.statistics.attendanceRate}%
            </p>
          </div>
        )}
      </div>

      {/* Children as Sub-Members */}
      {data.children.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Children (Sub-Members)</h2>
          <div className="space-y-6">
            {data.children.map((child) => (
              <div key={child.id} className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                {/* Child Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">Age: {child.age}</p>
                  </div>
                  {child.statistics && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="text-sm font-medium">
                        {child.createdAt ? safeFormatDate(child.createdAt, 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Child Statistics */}
                {child.statistics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Total Bookings</p>
                      <p className="text-xl font-bold text-gray-900">
                        {child.statistics.totalBookings || child.statistics.totalBookingsWithCoach || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Attended</p>
                      <p className="text-xl font-bold text-green-600">
                        {child.statistics.attendedBookings || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">No-Show</p>
                      <p className="text-xl font-bold text-red-600">
                        {child.statistics.noShowBookings || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Confirmed</p>
                      <p className="text-xl font-bold text-blue-600">
                        {child.statistics.confirmedBookings || 0}
                      </p>
                    </div>
                    {child.statistics.attendanceRate && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600">Attendance Rate</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {child.statistics.attendanceRate}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Child Recent Bookings */}
                {child.recentBookings && child.recentBookings.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Recent Bookings for {child.firstName}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Class
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Location
                            </th>
                            {isAdmin && (
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Coach
                              </th>
                            )}
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Date & Time
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {child.recentBookings.map((booking) => (
                            <tr key={booking.id}>
                              <td className="px-3 py-2 text-sm font-medium">{booking.classType}</td>
                              <td className="px-3 py-2 text-sm">{booking.location}</td>
                              {isAdmin && booking.coach && (
                                <td className="px-3 py-2 text-sm">{booking.coach}</td>
                              )}
                              <td className="px-3 py-2 text-sm">
                                {safeFormatDate(booking.startTime, 'MMM dd, yyyy h:mm a')}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                    booking.status
                                  )}`}
                                >
                                  {booking.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {(!child.recentBookings || child.recentBookings.length === 0) && (
                  <p className="text-sm text-gray-500 mt-2">No bookings yet</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages (Admin only) */}
      {isAdmin && data.packages && data.packages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Packages</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Package
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sessions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Remaining
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Purchase Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Expiry Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td className="px-4 py-3 text-sm font-medium">{pkg.packageName}</td>
                    <td className="px-4 py-3 text-sm">{pkg.sessionsTotal}</td>
                    <td className="px-4 py-3 text-sm">{pkg.sessionsRemaining}</td>
                    <td className="px-4 py-3 text-sm">
                      {safeFormatDate(pkg.purchaseDate, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {safeFormatDate(pkg.expiryDate, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          pkg.isExpired
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {pkg.isExpired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member-Specific Package Prices (Admin Only) */}
      {isAdmin && <MemberPackagePricesSection memberId={memberId} />}

      {/* Recent Bookings (Parent Only) */}
      {data.recentBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isAdmin ? 'Recent Bookings (Parent)' : 'Recent Bookings with You (Parent)'}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Coach
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Booked For
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 text-sm font-medium">{booking.classType}</td>
                    <td className="px-4 py-3 text-sm">{booking.location}</td>
                    {isAdmin && booking.coach && (
                      <td className="px-4 py-3 text-sm">{booking.coach}</td>
                    )}
                    <td className="px-4 py-3 text-sm">
                      {safeFormatDate(booking.startTime, 'MMM dd, yyyy h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-sm">{booking.bookedFor}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Member Actions Component (Admin Only)
function MemberActions({ memberId, memberData }: { memberId: number; memberData: MemberDetailsData }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handlePause = async () => {
    if (!confirm('Are you sure you want to pause this member account? They will not be able to log in.')) {
      return;
    }
    try {
      setProcessing(true);
      await apiClient.put(`/admin/members/${memberId}/pause`);
      alert('Member account paused successfully');
      queryClient.invalidateQueries({ queryKey: ['member-details', memberId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to pause member');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnpause = async () => {
    try {
      setProcessing(true);
      await apiClient.put(`/admin/members/${memberId}/unpause`);
      alert('Member account unpaused successfully');
      queryClient.invalidateQueries({ queryKey: ['member-details', memberId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to unpause member');
    } finally {
      setProcessing(false);
    }
  };

  const handleFreeze = async () => {
    if (!confirm('Are you sure you want to freeze this member account? They will not be able to make bookings or purchase packages.')) {
      return;
    }
    try {
      setProcessing(true);
      await apiClient.put(`/admin/members/${memberId}/freeze`);
      alert('Member account frozen successfully');
      queryClient.invalidateQueries({ queryKey: ['member-details', memberId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to freeze member');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfreeze = async () => {
    try {
      setProcessing(true);
      await apiClient.put(`/admin/members/${memberId}/unfreeze`);
      alert('Member account unfrozen successfully');
      queryClient.invalidateQueries({ queryKey: ['member-details', memberId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to unfreeze member');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this member account? This action cannot be undone. The member will be soft-deleted.')) {
      return;
    }
    try {
      setProcessing(true);
      await apiClient.delete(`/admin/members/${memberId}`);
      alert('Member account deleted successfully');
      router.push('/admin/members');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete member');
    } finally {
      setProcessing(false);
    }
  };

  if (memberData.deletedAt) {
    return (
      <div className="px-4 py-2 bg-red-100 text-red-800 rounded-md">
        Account Deleted
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {memberData.isPaused ? (
          <button
            onClick={handleUnpause}
            disabled={processing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Unpause
          </button>
        ) : (
          <button
            onClick={handlePause}
            disabled={processing}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            Pause
          </button>
        )}
        {memberData.isFrozen ? (
          <button
            onClick={handleUnfreeze}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Unfreeze
          </button>
        ) : (
          <button
            onClick={handleFreeze}
            disabled={processing}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            Freeze
          </button>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={processing}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {/* Status Badges */}
      {(memberData.isPaused || memberData.isFrozen) && (
        <div className="mt-2 flex gap-2">
          {memberData.isPaused && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
              Paused
            </span>
          )}
          {memberData.isFrozen && (
            <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
              Frozen
            </span>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Member Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{memberData.firstName} {memberData.lastName}</strong>?
              This will soft-delete the account. The member will not be able to log in, but their data will be preserved.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Member Package Prices Section Component
interface PackagePriceData {
  packageId: number;
  packageName: string;
  sessionCount: number;
  defaultPrice: number;
  expiryDays: number;
  hasCustomPrice: boolean;
  customPrice: number | null;
  isActive: boolean;
}

interface MemberPackagePricesData {
  member: {
    id: number;
    name: string;
    email: string;
  };
  packages: PackagePriceData[];
}

function MemberPackagePricesSection({ memberId }: { memberId: number }) {
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackagePriceData | null>(null);
  const [priceForm, setPriceForm] = useState({ price: '', isActive: true });
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<MemberPackagePricesData>({
    queryKey: ['member-package-prices', memberId],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/members/${memberId}/package-prices`);
      return response.data.data;
    }
  });

  const openPriceModal = (pkg: PackagePriceData) => {
    setSelectedPackage(pkg);
    setPriceForm({
      price: pkg.hasCustomPrice ? pkg.customPrice!.toString() : pkg.defaultPrice.toString(),
      isActive: pkg.isActive
    });
    setShowPriceModal(true);
  };

  const handleSetPrice = async () => {
    if (!selectedPackage) return;

    const price = parseFloat(priceForm.price);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid positive price');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.put(
        `/admin/members/${memberId}/package-prices/${selectedPackage.packageId}`,
        {
          price,
          isActive: priceForm.isActive
        }
      );
      
      alert('Member-specific price updated successfully! This price will apply when the member renews their package.');
      setShowPriceModal(false);
      setSelectedPackage(null);
      queryClient.invalidateQueries({ queryKey: ['member-package-prices', memberId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update member price');
      console.error('Error updating member price:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemovePrice = async (pkg: PackagePriceData) => {
    if (!confirm('Remove member-specific price? Member will use normal location-based pricing.')) {
      return;
    }

    try {
      setProcessing(true);
      await apiClient.delete(
        `/admin/members/${memberId}/package-prices/${pkg.packageId}`
      );
      alert('Member-specific price removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['member-package-prices', memberId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to remove member price');
      console.error('Error removing member price:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Renewal Package Prices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Set custom prices for this member when they renew packages. If not set, member will pay normal location-based prices.
            </p>
          </div>
        </div>

        {data.packages.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No packages available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Package
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Default Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Member Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.packages.map((pkg) => (
                  <tr key={pkg.packageId}>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{pkg.packageName}</div>
                      <div className="text-xs text-gray-500">{pkg.sessionCount} sessions</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      EGP {typeof pkg.defaultPrice === 'string' ? parseFloat(pkg.defaultPrice).toFixed(2) : pkg.defaultPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {pkg.hasCustomPrice ? (
                        <span className="font-semibold text-green-600">
                          EGP {typeof pkg.customPrice === 'string' ? parseFloat(pkg.customPrice).toFixed(2) : pkg.customPrice!.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          pkg.hasCustomPrice && pkg.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pkg.hasCustomPrice && pkg.isActive ? 'Active' : 'Not Set'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPriceModal(pkg)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          {pkg.hasCustomPrice ? 'Edit' : 'Set'}
                        </button>
                        {pkg.hasCustomPrice && (
                          <button
                            onClick={() => handleRemovePrice(pkg)}
                            disabled={processing}
                            className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Price Modal */}
      {showPriceModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Set Renewal Price for {selectedPackage.packageName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This price will apply when the member renews this package. If they don't renew and buy a new package, they'll pay normal rates.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renewal Price (EGP) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={priceForm.price}
                  onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                  placeholder={selectedPackage.defaultPrice.toString()}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default price: EGP {typeof selectedPackage.defaultPrice === 'string' ? parseFloat(selectedPackage.defaultPrice).toFixed(2) : selectedPackage.defaultPrice.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="priceActive"
                  checked={priceForm.isActive}
                  onChange={(e) => setPriceForm({ ...priceForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="priceActive" className="ml-2 block text-sm text-gray-700">
                  Active (apply this price for renewals)
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setSelectedPackage(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetPrice}
                disabled={processing}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Saving...' : 'Save Price'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

