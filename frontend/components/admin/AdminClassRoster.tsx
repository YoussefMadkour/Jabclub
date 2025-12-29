'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import apiClient from '@/lib/axios';
import Link from 'next/link';

interface Booking {
  bookingId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  memberPhone: string | null;
  bookedFor: {
    type: 'child' | 'self';
    id?: number;
    name: string;
    age?: number;
  };
  isChildBooking: boolean;
  status: 'confirmed' | 'attended' | 'no_show';
  bookedAt: string;
  attendanceMarkedAt: string | null;
}

interface ClassInfo {
  id: number;
  classType: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  locationAddress: string;
  coach: string;
  coachEmail: string;
  capacity: number;
  isCancelled: boolean;
}

interface Summary {
  total: number;
  confirmed: number;
  attended: number;
  noShow: number;
}

interface ClassRosterResponse {
  classInfo: ClassInfo;
  roster: Booking[];
  summary: Summary;
}

interface AdminClassRosterProps {
  classInstanceId: number;
}

export default function AdminClassRoster({ classInstanceId }: AdminClassRosterProps) {
  // Fetch class roster
  const { data, isLoading, error } = useQuery<ClassRosterResponse>({
    queryKey: ['admin-class-roster', classInstanceId],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/classes/${classInstanceId}/roster`);
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load class roster. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { classInfo, roster, summary } = data;
  const classDate = new Date(classInfo.startTime);
  const isToday = classDate.toDateString() === new Date().toDateString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/admin/classes"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>←</span>
          <span>Back to Classes</span>
        </Link>
      </div>

      {/* Class Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{classInfo.classType}</h1>
              {isToday && (
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full font-medium">
                  Today
                </span>
              )}
              {classInfo.isCancelled && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                  Cancelled
                </span>
              )}
            </div>
            <p className="text-gray-600">Class Roster and Attendance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="text-lg font-medium">{format(classDate, 'EEEE, MMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-lg font-medium">
              {format(new Date(classInfo.startTime), 'h:mm a')} - {format(new Date(classInfo.endTime), 'h:mm a')}
            </p>
            <p className="text-xs text-gray-500">{classInfo.duration} min</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-lg font-medium">{classInfo.location}</p>
            <p className="text-xs text-gray-500">{classInfo.locationAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Coach</p>
            <p className="text-lg font-medium">{classInfo.coach}</p>
            <p className="text-xs text-gray-500">{classInfo.coachEmail}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
              <p className="text-xs text-gray-500 mt-1">Capacity: {classInfo.capacity}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Confirmed</p>
              <p className="text-3xl font-bold text-blue-600">{summary.confirmed}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attended</p>
              <p className="text-3xl font-bold text-green-600">{summary.attended}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">No-Show</p>
              <p className="text-3xl font-bold text-red-600">{summary.noShow}</p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </div>
      </div>

      {/* Roster List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Class Roster</h2>
        
        {roster.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Booked For
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Booked At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Attendance Marked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roster.map((booking) => (
                  <tr 
                    key={booking.bookingId} 
                    className={`${
                      booking.status === 'attended' 
                        ? 'bg-green-50' 
                        : booking.status === 'no_show'
                        ? 'bg-red-50'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.memberName}</div>
                        <div className="text-sm text-gray-500">{booking.memberEmail}</div>
                        {booking.memberPhone && (
                          <div className="text-sm text-gray-500">{booking.memberPhone}</div>
                        )}
                        <Link
                          href={`/admin/members/${booking.memberId}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                        >
                          View Member →
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.isChildBooking ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.bookedFor.name}</div>
                          <div className="text-sm text-gray-500">Child ({booking.bookedFor.age}y)</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">Self</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.bookedAt), 'MMM dd, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.attendanceMarkedAt 
                        ? format(new Date(booking.attendanceMarkedAt), 'MMM dd, yyyy h:mm a')
                        : 'Not marked'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/bookings?classInstanceId=${classInstanceId}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View Booking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No bookings yet</p>
            <p className="text-gray-500 text-sm mt-2">Bookings will appear here as members sign up</p>
          </div>
        )}
      </div>
    </div>
  );
}

