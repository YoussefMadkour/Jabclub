'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';
import ClassCard from '@/components/classes/ClassCard';
import BookingModal from '@/components/classes/BookingModal';

interface Coach {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
}

interface ClassInstance {
  id: number;
  classType: string;
  description: string;
  duration: number;
  startTime: string;
  endTime: string;
  coach: Coach;
  location: Location;
  capacity: number;
  bookedCount: number;
  availableSpots: number;
  isFull: boolean;
}

interface FilterOptions {
  locations: Location[];
  coaches: Coach[];
}

export default function ClassSchedule() {
  const [classes, setClasses] = useState<ClassInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    locations: [],
    coaches: []
  });

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInstance | null>(null);

  // Fetch filter options (locations and coaches)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Extract unique locations and coaches from classes
        const response = await apiClient.get('/classes/schedule');
        const allClasses = response.data.data.classes;
        
        // Get unique locations
        const uniqueLocations = Array.from(
          new Map(
            allClasses.map((c: ClassInstance) => [c.location.id, c.location])
          ).values()
        ) as Location[];
        
        // Get unique coaches
        const uniqueCoaches = Array.from(
          new Map(
            allClasses.map((c: ClassInstance) => [c.coach.id, c.coach])
          ).values()
        ) as Coach[];
        
        setFilterOptions({
          locations: uniqueLocations,
          coaches: uniqueCoaches
        });
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    
    fetchFilterOptions();
  }, []);

  // Fetch classes based on filters
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (selectedLocation) params.append('location', selectedLocation);
        if (selectedDate) params.append('date', selectedDate);
        if (selectedCoach) params.append('coach', selectedCoach);
        
        const response = await apiClient.get(`/classes/schedule?${params.toString()}`);
        setClasses(response.data.data.classes);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, [selectedLocation, selectedDate, selectedCoach]);

  const handleClearFilters = () => {
    setSelectedLocation('');
    setSelectedDate('');
    setSelectedCoach('');
  };

  const hasActiveFilters = selectedLocation || selectedDate || selectedCoach;

  const handleBookClass = (classId: number) => {
    const classToBook = classes.find(c => c.id === classId);
    if (classToBook) {
      setSelectedClass(classToBook);
      setIsBookingModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    // Refresh the class list to update availability
    const fetchClasses = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedLocation) params.append('location', selectedLocation);
        if (selectedDate) params.append('date', selectedDate);
        if (selectedCoach) params.append('coach', selectedCoach);
        
        const response = await apiClient.get(`/classes/schedule?${params.toString()}`);
        setClasses(response.data.data.classes);
      } catch (err) {
        console.error('Error refreshing classes:', err);
      }
    };
    
    fetchClasses();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Class Schedule</h1>
        <p className="mt-2 text-gray-600">Browse and book available classes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location Filter */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {filterOptions.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Coach Filter */}
          <div>
            <label htmlFor="coach" className="block text-sm font-medium text-gray-700 mb-1">
              Coach
            </label>
            <select
              id="coach"
              value={selectedCoach}
              onChange={(e) => setSelectedCoach(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Coaches</option>
              {filterOptions.coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="mt-4">
            <button
              onClick={handleClearFilters}
              className="text-sm text-[#FF7A00] hover:text-orange-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Classes List */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No classes found matching your filters.</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-[#FF7A00] hover:text-orange-800 font-medium"
              >
                Clear filters to see all classes
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classInstance) => (
              <ClassCard 
                key={classInstance.id} 
                classInstance={classInstance}
                onBook={handleBookClass}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedClass && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          classInstance={selectedClass}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
