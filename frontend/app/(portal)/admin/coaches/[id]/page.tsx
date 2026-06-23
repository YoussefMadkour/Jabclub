'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { format } from 'date-fns';
import Link from 'next/link';
import CoachActions from '@/components/admin/CoachActions';

interface CoachDetails {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isPaused: boolean;
  isFrozen: boolean;
  deletedAt: string | null;
  createdAt: string;
  classes: Array<{
    id: number;
    className: string;
    classDescription: string | null;
    duration: number;
    location: string;
    locationAddress: string;
    startTime: string;
    endTime: string;
    capacity: number;
    isCancelled: boolean;
    bookings: Array<{
      id: number;
      memberName: string;
      memberEmail: string;
      status: string;
      bookedAt: string;
    }>;
  }>;
  stats: {
    totalClasses: number;
    upcomingClasses: number;
    pastClasses: number;
    totalBookings: number;
    totalAttendees: number;
  };
}

export default function AdminCoachDetailsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const coachId = parseInt(params.id as string);

  const { data: coachData, isLoading, error } = useQuery<{ data: CoachDetails }>({
    queryKey: ['admin-coach', coachId],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/coaches/${coachId}`);
      return response.data;
    },
    enabled: !!coachId && !isNaN(coachId)
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (!coachId || isNaN(coachId)) {
    return (
      <div className="min-h-screen bg-[#121214] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Invalid coach ID</p>
        </div>
      </div>
    );
  }

  if (error || !coachData?.data) {
    return (
      <div className="min-h-screen bg-[#121214] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load coach details</p>
        </div>
      </div>
    );
  }

  const coach = coachData.data;

  return (
    <div className="min-h-screen bg-[#121214]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {coach.firstName} {coach.lastName}
                </h1>
                <p className="text-gray-400 mt-1">Coach Details</p>
              </div>
              <Link
                href="/admin/coaches"
                className="px-4 py-2 bg-[#26262B] text-gray-300 rounded-md hover:bg-white/10 transition-colors"
              >
                ← Back
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-medium">{coach.email}</p>
              </div>
              {coach.phone && (
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="text-white font-medium">{coach.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Member Since</p>
                <p className="text-white font-medium">
                  {format(new Date(coach.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    coach.isPaused
                      ? 'bg-yellow-100 text-yellow-800'
                      : coach.isFrozen
                      ? 'bg-red-100 text-red-800'
                      : coach.deletedAt
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {coach.isPaused ? 'Paused' : coach.isFrozen ? 'Frozen' : coach.deletedAt ? 'Deleted' : 'Active'}
                </span>
              </div>
            </div>

            {/* Coach Actions */}
            <div className="mt-6 pt-6 border-t border-[#26262B]">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Account Actions</h3>
              <CoachActions coachId={coach.id} coachData={coach} />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-400">Total Classes</p>
              <p className="text-2xl font-bold text-white">{coach.stats.totalClasses}</p>
            </div>
            <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{coach.stats.upcomingClasses}</p>
            </div>
            <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-400">Past</p>
              <p className="text-2xl font-bold text-gray-400">{coach.stats.pastClasses}</p>
            </div>
            <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold text-purple-600">{coach.stats.totalBookings}</p>
            </div>
            <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-400">Attendees</p>
              <p className="text-2xl font-bold text-green-600">{coach.stats.totalAttendees}</p>
            </div>
          </div>

          {/* Classes List */}
          <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[#26262B]">
              <h2 className="text-lg font-semibold text-white">Classes</h2>
            </div>
            {coach.classes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No classes found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#26262B]">
                  <thead className="bg-[#121214]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#16161a] divide-y divide-[#26262B]">
                    {coach.classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{cls.className}</div>
                          {cls.classDescription && (
                            <div className="text-sm text-gray-400">{cls.classDescription}</div>
                          )}
                          <div className="text-xs text-gray-400">{cls.duration} minutes</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">{cls.location}</div>
                          <div className="text-xs text-gray-400">{cls.locationAddress}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {format(new Date(cls.startTime), 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm text-gray-400">
                            {format(new Date(cls.startTime), 'h:mm a')} - {format(new Date(cls.endTime), 'h:mm a')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">
                            {cls.bookings.length} / {cls.capacity}
                          </div>
                          {cls.bookings.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {cls.bookings.filter(b => b.status === 'attended').length} attended
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              cls.isCancelled
                                ? 'bg-red-100 text-red-800'
                                : new Date(cls.startTime) >= new Date()
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {cls.isCancelled ? 'Cancelled' : new Date(cls.startTime) >= new Date() ? 'Upcoming' : 'Past'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

