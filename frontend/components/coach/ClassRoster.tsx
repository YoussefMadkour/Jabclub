'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import apiClient from '@/lib/axios';
import Link from 'next/link';

interface Booking {
  bookingId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  bookedFor: string;
  isChildBooking: boolean;
  childAge?: number;
  status: 'confirmed' | 'attended' | 'no_show';
  bookedAt: string;
  attendanceMarkedAt?: string;
}

interface ClassInfo {
  id: number;
  classType: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  locationAddress: string;
  capacity: number;
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

interface ClassRosterProps {
  classInstanceId: number;
}

export default function ClassRoster({ classInstanceId }: ClassRosterProps) {
  const queryClient = useQueryClient();
  const [markingAttendance, setMarkingAttendance] = useState<number | null>(null);

  // Fetch class roster
  const { data, isLoading, error } = useQuery<ClassRosterResponse>({
    queryKey: ['class-roster', classInstanceId],
    queryFn: async () => {
      const response = await apiClient.get(`/coach/classes/${classInstanceId}/roster`);
      return response.data.data;
    }
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: 'attended' | 'no_show' }) => {
      const response = await apiClient.put(`/coach/attendance/${bookingId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      // Refetch roster data
      queryClient.invalidateQueries({ queryKey: ['class-roster', classInstanceId] });
      setMarkingAttendance(null);
    },
    onError: (error: any) => {
      console.error('Attendance marking error:', error);
      alert(error.response?.data?.error?.message || 'Failed to mark attendance');
      setMarkingAttendance(null);
    }
  });

  const handleMarkAttendance = async (bookingId: number, status: 'attended' | 'no_show') => {
    setMarkingAttendance(bookingId);
    await markAttendanceMutation.mutateAsync({ bookingId, status });
  };

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

  return (
    <div className="space-y-6">
      {/* Class Information Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{classInfo.classType}</h1>
              {isToday && (
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full font-medium">
                  Today
                </span>
              )}
            </div>
            
            <div className="space-y-1 text-gray-600">
              <p className="flex items-center gap-2">
                <span className="font-medium">📅</span>
                {format(classDate, 'EEEE, MMMM dd, yyyy')}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">🕐</span>
                {format(new Date(classInfo.startTime), 'h:mm a')} - {format(new Date(classInfo.endTime), 'h:mm a')}
                {classInfo.duration && ` (${classInfo.duration} min)`}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">📍</span>
                {classInfo.location}
              </p>
            </div>
          </div>
          
          <div className="text-center lg:text-right">
            <p className="text-4xl font-bold text-gray-900">{summary.total}</p>
            <p className="text-sm text-gray-600">Total Attendees</p>
            <p className="text-xs text-gray-500 mt-1">
              Capacity: {classInfo.capacity}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
            <p className="text-sm text-gray-600 mt-1">Total Bookings</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-md p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{summary.confirmed}</p>
            <p className="text-sm text-blue-800 mt-1">Confirmed</p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-md p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{summary.attended}</p>
            <p className="text-sm text-green-800 mt-1">Attended</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{summary.noShow}</p>
            <p className="text-sm text-red-800 mt-1">No-Show</p>
          </div>
        </div>
      </div>

      {/* Roster List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Class Roster</h2>
        
        {roster.length > 0 ? (
          <div className="space-y-3">
            {roster.map((booking) => (
              <div 
                key={booking.bookingId} 
                className={`border rounded-lg p-4 ${
                  booking.status === 'attended' 
                    ? 'border-green-300 bg-green-50' 
                    : booking.status === 'no_show'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{booking.memberName}</h3>
                      {booking.isChildBooking && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                          Child: {booking.bookedFor}
                          {booking.childAge && ` (${booking.childAge}y)`}
                        </span>
                      )}
                      {!booking.isChildBooking && booking.bookedFor !== 'Self' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          {booking.bookedFor}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📧 {booking.memberEmail}</p>
                      <p>🕐 Booked {format(new Date(booking.bookedAt), 'MMM dd, yyyy h:mm a')}</p>
                      {booking.attendanceMarkedAt && (
                        <p className="text-xs text-gray-500">
                          Attendance marked {format(new Date(booking.attendanceMarkedAt), 'MMM dd, yyyy h:mm a')}
                        </p>
                      )}
                      <Link
                        href={`/coach/members/${booking.memberId}`}
                        className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Member Details →
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 lg:items-end">
                    {/* Status Badge */}
                    {booking.status === 'attended' && (
                      <span className="px-4 py-2 bg-green-600 text-white rounded-md font-medium text-center">
                        ✓ Present
                      </span>
                    )}
                    {booking.status === 'no_show' && (
                      <span className="px-4 py-2 bg-red-600 text-white rounded-md font-medium text-center">
                        ✗ No-Show
                      </span>
                    )}
                    
                    {/* Attendance Buttons (only for confirmed bookings on class day) */}
                    {booking.status === 'confirmed' && isToday && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkAttendance(booking.bookingId, 'attended')}
                          disabled={markingAttendance === booking.bookingId}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {markingAttendance === booking.bookingId ? 'Marking...' : 'Present'}
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(booking.bookingId, 'no_show')}
                          disabled={markingAttendance === booking.bookingId}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {markingAttendance === booking.bookingId ? 'Marking...' : 'No-Show'}
                        </button>
                      </div>
                    )}
                    
                    {booking.status === 'confirmed' && !isToday && (
                      <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md text-center text-sm">
                        Attendance on class day only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No attendees yet</p>
            <p className="text-gray-500 text-sm mt-2">Bookings will appear here as members sign up</p>
          </div>
        )}
      </div>

      {/* Attendance Instructions */}
      {isToday && summary.confirmed > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="font-medium text-blue-900">Attendance Marking</p>
              <p className="text-sm text-blue-800 mt-1">
                Mark attendance for each participant as they arrive. Use "Present" for attendees and "No-Show" for those who don't show up.
                Attendance can only be marked on the day of the class.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
