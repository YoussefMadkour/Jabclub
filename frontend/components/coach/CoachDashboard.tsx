'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import apiClient from '@/lib/axios';
import Link from 'next/link';

interface ClassInstance {
  id: number;
  classType: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  locationAddress: string;
  capacity: number;
  bookingCount: number;
  availableSpots: number;
  isFull: boolean;
}

interface CoachClassesResponse {
  filter: string;
  classes: ClassInstance[];
  totalClasses: number;
}

export default function CoachDashboard() {
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');

  // Fetch coach's classes
  const { data, isLoading, error } = useQuery<CoachClassesResponse>({
    queryKey: ['coach-classes', filter],
    queryFn: async () => {
      const response = await apiClient.get(`/coach/classes?filter=${filter}`);
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load classes. Please try again.</p>
      </div>
    );
  }

  const classes = data?.classes || [];

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your classes and attendance</p>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'today'
                  ? 'bg-[#FF7A00] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'week'
                  ? 'bg-[#FF7A00] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-[#FF7A00] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Upcoming
            </button>
          </div>
        </div>
      </div>

      {/* All Classes List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {filter === 'today' ? "Today's Schedule" : filter === 'week' ? 'This Week' : 'All Upcoming Classes'}
          </h2>
          <span className="text-sm text-gray-600">
            {classes.length} {classes.length === 1 ? 'class' : 'classes'}
          </span>
        </div>
        
        {classes.length > 0 ? (
          <div className="space-y-4">
            {classes.map((classInstance) => {
              const classDate = new Date(classInstance.startTime);
              const isToday = classDate.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={classInstance.id} 
                  className={`border rounded-lg p-4 hover:border-orange-300 transition-colors ${
                    isToday ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{classInstance.classType}</h3>
                        {isToday && (
                          <span className="px-2 py-1 bg-[#FF7A00] text-white text-xs rounded-full font-medium">
                            Today
                          </span>
                        )}
                        {classInstance.isFull && (
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
                          {format(new Date(classInstance.startTime), 'h:mm a')} - {format(new Date(classInstance.endTime), 'h:mm a')}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">📍</span>
                          {classInstance.location}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">👥</span>
                          {classInstance.bookingCount}/{classInstance.capacity} attendees
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 lg:items-end">
                      <div className="text-center lg:text-right">
                        <p className="text-2xl font-bold text-gray-900">{classInstance.bookingCount}</p>
                        <p className="text-xs text-gray-600">attendees</p>
                      </div>
                      <Link
                        href={`/coach/roster/${classInstance.id}`}
                        className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] transition-colors text-center"
                      >
                        View Class
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No classes scheduled</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === 'today' && 'You have no classes today'}
              {filter === 'week' && 'You have no classes this week'}
              {filter === 'all' && 'You have no upcoming classes'}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Attendees</p>
              <p className="text-3xl font-bold text-gray-900">
                {classes.reduce((sum, c) => sum + c.bookingCount, 0)}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Spots</p>
              <p className="text-3xl font-bold text-gray-900">
                {classes.reduce((sum, c) => sum + c.availableSpots, 0)}
              </p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>
      </div>
    </div>
  );
}
