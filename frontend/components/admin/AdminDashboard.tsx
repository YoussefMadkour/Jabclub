'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import apiClient from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  overview: {
    totalMembers: number;
    totalCoaches: number;
    pendingPaymentsCount: number;
    totalBookings: number;
    todayBookings: number;
    weekBookings: number;
    upcomingClasses: number;
    todayClasses: number;
    totalRevenue: string;
    thisMonthRevenue: string;
  };
  recentPendingPayments: Array<{
    id: number;
    member: string;
    email: string;
    package: string;
    amount: string;
    submittedAt: string;
  }>;
  upcomingClasses: Array<{
    id: number;
    classType: string;
    location: string;
    coach: string;
    startTime: string;
    bookingCount: number;
    capacity: number;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();

  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard/stats');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { overview, recentPendingPayments, upcomingClasses } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your fitness club operations</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{overview.totalMembers}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Coaches</p>
              <p className="text-3xl font-bold text-gray-900">{overview.totalCoaches}</p>
            </div>
            <div className="text-4xl">🏋️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
              <p className="text-3xl font-bold text-orange-600">{overview.pendingPaymentsCount}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
          {overview.pendingPaymentsCount > 0 && (
            <Link
              href="/admin/payments"
              className="mt-3 block text-sm text-[#FF7A00] hover:text-orange-700 font-medium"
            >
              Review payments →
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">EGP {overview.totalRevenue}</p>
              <p className="text-xs text-gray-500 mt-1">This month: EGP {overview.thisMonthRevenue}</p>
            </div>
            <div className="text-4xl">💵</div>
          </div>
        </div>
      </div>

      {/* Bookings & Classes Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{overview.totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">
                Today: {overview.todayBookings} • This week: {overview.weekBookings}
              </p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming Classes</p>
              <p className="text-3xl font-bold text-[#FF7A00]">{overview.upcomingClasses}</p>
              <p className="text-xs text-gray-500 mt-1">Today: {overview.todayClasses}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Bookings</p>
              <p className="text-3xl font-bold text-purple-600">{overview.todayBookings}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Week</p>
              <p className="text-3xl font-bold text-indigo-600">{overview.weekBookings}</p>
              <p className="text-xs text-gray-500 mt-1">Bookings</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Recent Pending Payments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Pending Payments</h2>
          <Link
            href="/admin/payments"
            className="text-sm text-[#FF7A00] hover:text-orange-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {recentPendingPayments.length > 0 ? (
          <div className="space-y-3">
            {recentPendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{payment.member}</p>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                        Pending
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{payment.email}</p>
                      <p>Package: {payment.package} • EGP {payment.amount}</p>
                      <p className="text-xs text-gray-500">
                        Submitted {format(new Date(payment.submittedAt), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin/payments"
                    className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] transition-colors text-center text-sm"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No pending payments</p>
          </div>
        )}
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Classes</h2>
          <Link
            href="/admin/classes"
            className="text-sm text-[#FF7A00] hover:text-orange-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {upcomingClasses.length > 0 ? (
          <div className="space-y-3">
            {upcomingClasses.map((classInstance) => {
              const classDate = new Date(classInstance.startTime);
              const isToday = classDate.toDateString() === new Date().toDateString();
              const isFull = classInstance.bookingCount >= classInstance.capacity;

              return (
                <div
                  key={classInstance.id}
                  className={`border rounded-lg p-4 hover:border-orange-300 transition-colors ${
                    isToday ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{classInstance.classType}</h3>
                        {isToday && (
                          <span className="px-2 py-1 bg-[#FF7A00] text-white text-xs rounded-full font-medium">
                            Today
                          </span>
                        )}
                        {isFull && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                            Full
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <span className="font-medium">📅</span>
                          {format(classDate, 'EEEE, MMM dd, yyyy')}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">🕐</span>
                          {format(new Date(classInstance.startTime), 'h:mm a')}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">📍</span>
                          {classInstance.location}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">👤</span>
                          {classInstance.coach}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <div className="text-center sm:text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {classInstance.bookingCount}/{classInstance.capacity}
                        </p>
                        <p className="text-xs text-gray-600">bookings</p>
                      </div>
                      <Link
                        href={`/admin/classes/${classInstance.id}/roster`}
                        className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] transition-colors text-center text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">No upcoming classes</p>
            <Link
              href="/admin/classes"
              className="inline-block px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] transition-colors"
            >
              Create Class
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/payments"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900 mb-1">Review Payments</h3>
            <p className="text-sm text-gray-600">Approve or reject payment submissions</p>
          </Link>

          <Link
            href="/admin/classes"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-semibold text-gray-900 mb-1">Manage Classes</h3>
            <p className="text-sm text-gray-600">Create and manage class schedules</p>
          </Link>

          <Link
            href="/admin/bookings"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-semibold text-gray-900 mb-1">View Bookings</h3>
            <p className="text-sm text-gray-600">See all member bookings</p>
          </Link>

          <Link
            href="/admin/reports/revenue"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-1">View Reports</h3>
            <p className="text-sm text-gray-600">Revenue and attendance reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

