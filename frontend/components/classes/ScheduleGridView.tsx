'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';

interface ClassInstance {
  id: number;
  classType: string;
  duration: number;
  location: {
    id: number;
    name: string;
  };
  coach: {
    id: number;
    name: string;
  };
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  availableSpots: number;
}

interface Location {
  id: number;
  name: string;
}

export default function ScheduleGridView() {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [locations, setLocations] = useState<Location[]>([]);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await apiClient.get('/classes/schedule');
        const allClasses = response.data.data.classes;
        const uniqueLocations = Array.from(
          new Map(
            allClasses.map((c: ClassInstance) => [c.location.id, c.location])
          ).values()
        ) as Location[];
        setLocations(uniqueLocations);
        if (uniqueLocations.length > 0 && !selectedLocationId) {
          setSelectedLocationId(uniqueLocations[0].id);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };
    fetchLocations();
  }, []);

  // Fetch classes for the selected week and location
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['schedule-grid', selectedLocationId, currentWeek],
    queryFn: async () => {
      if (!selectedLocationId) return { classes: [] };
      
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 }); // Start on Saturday
      const weekEnd = addDays(weekStart, 6);
      
      const response = await apiClient.get('/classes/schedule', {
        params: {
          location: selectedLocationId.toString()
        }
      });
      
      // Filter classes for the selected week
      const allClasses = response.data.data.classes || [];
      const filteredClasses = allClasses.filter((c: ClassInstance) => {
        const classDate = new Date(c.startTime);
        return classDate >= weekStart && classDate <= weekEnd;
      });
      
      return { classes: filteredClasses };
    },
    enabled: !!selectedLocationId
  });

  const classes = classesData?.classes || [];

  // Get week start (Saturday)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Define time slots (6 PM to 10 PM)
  const timeSlots = [
    { start: '18:00', end: '19:00', label: '6:00 PM - 7:00 PM' },
    { start: '19:00', end: '20:00', label: '7:00 PM - 8:00 PM' },
    { start: '20:00', end: '21:00', label: '8:00 PM - 9:00 PM' },
    { start: '20:30', end: '21:30', label: '8:30 PM - 9:30 PM' },
    { start: '21:00', end: '22:00', label: '9:00 PM - 10:00 PM' }
  ];

  // Helper function to get class for a specific day and time slot
  const getClassForSlot = (day: Date, timeSlot: { start: string; end: string }) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const [hours, minutes] = timeSlot.start.split(':').map(Number);
    
    return classes.find((c: ClassInstance) => {
      const classDate = new Date(c.startTime);
      const classDayStr = format(classDate, 'yyyy-MM-dd');
      const classHours = classDate.getHours();
      const classMinutes = classDate.getMinutes();
      
      return classDayStr === dayStr && 
             classHours === hours && 
             classMinutes === minutes;
    });
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="text-orange-500 text-sm font-medium mb-2">CLASS SCHEDULE</div>
        <div className="text-white text-3xl font-bold mb-4">WORKING SCHEDULE</div>
        
        {/* Location Selector */}
        <div className="flex items-center gap-4 mb-4">
          <select
            value={selectedLocationId || ''}
            onChange={(e) => setSelectedLocationId(Number(e.target.value))}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Location Name */}
        {selectedLocationId && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePreviousWeek}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-white text-xl font-semibold">
              {locations.find(l => l.id === selectedLocationId)?.name.toUpperCase()}
            </div>
            <button
              onClick={handleNextWeek}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Schedule Grid */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header Row */}
            <thead>
              <tr>
                <th className="bg-gray-800 text-gray-400 text-xs font-medium py-3 px-4 text-left border-r border-gray-700">
                  TIME
                </th>
                {daysOfWeek.map((day) => (
                  <th
                    key={day.toISOString()}
                    className="bg-gray-800 text-white text-xs font-medium py-3 px-4 text-center border-r border-gray-700 last:border-r-0"
                  >
                    {format(day, 'EEEE').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Time Slot Rows */}
            <tbody>
              {timeSlots.map((timeSlot, slotIndex) => (
                <tr key={`${timeSlot.start}-${timeSlot.end}`} className="border-b border-gray-700">
                  {/* Time Column */}
                  <td className="bg-gray-800 text-gray-400 text-xs py-4 px-4 border-r border-gray-700 whitespace-nowrap">
                    {timeSlot.label}
                  </td>
                  
                  {/* Day Columns */}
                  {daysOfWeek.map((day) => {
                    const classInstance = getClassForSlot(day, timeSlot);
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <td
                        key={`${day.toISOString()}-${timeSlot.start}`}
                        className={`py-4 px-4 border-r border-gray-700 last:border-r-0 text-center ${
                          classInstance
                            ? 'bg-orange-500 text-white'
                            : isToday
                            ? 'bg-gray-700 text-gray-500'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {classInstance ? (
                          <div className="text-xs font-medium">
                            {classInstance.classType}
                          </div>
                        ) : format(day, 'EEEE') === 'Friday' ? (
                          <span className="text-xs text-gray-500">OFF</span>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Week Range Display */}
      <div className="mt-4 text-center text-gray-400 text-sm">
        {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
      </div>
    </div>
  );
}

