'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import BookingModal from './BookingModal';

interface ClassInstance {
  id: number;
  classType: string;
  description?: string | null;
  duration: number;
  location: {
    id: number;
    name: string;
    address?: string;
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
  isFull?: boolean;
  isBooked?: boolean;
  bookingId?: number | null;
}

interface Location {
  id: number;
  name: string;
}

export default function ScheduleGridView() {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInstance | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch active locations from the member endpoint (admin/locations requires admin role)
  const { data: locationsData } = useQuery({
    queryKey: ['member-locations'],
    queryFn: async () => {
      const response = await apiClient.get('/members/locations');
      return (response.data.data?.locations || response.data.data || []) as Location[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (locationsData && locationsData.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locationsData[0].id);
    }
    if (locationsData) setLocations(locationsData);
  }, [locationsData]);

  // Week boundaries — computed once, used by query key, query fn, and grid render
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
  const weekEnd = addDays(weekStart, 6);
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch classes for the selected week and location
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['schedule-grid', selectedLocationId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!selectedLocationId) return { classes: [] };

      const response = await apiClient.get('/classes/schedule', {
        params: {
          location: selectedLocationId.toString(),
          startDate: format(weekStart, "yyyy-MM-dd'T'00:00:00"),
          endDate: format(weekEnd, "yyyy-MM-dd'T'23:59:59"),
        }
      });

      return { classes: response.data.data.classes || [] };
    },
    enabled: !!selectedLocationId
  });

  const classes = classesData?.classes || [];

  // Helper function to convert 24-hour time string to 12-hour AM/PM format
  const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Parse HH:MM from an ISO string using LOCAL time
  // The backend stores times in UTC but Egypt is UTC+2, so 20:00 UTC = 22:00 local.
  // We display local time in the grid headers, so matching must also use local time.
  const isoToHHMM = (iso: string): string => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Parse YYYY-MM-DD from an ISO string using LOCAL time
  const isoToDateStr = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Derive time slots dynamically from actual classes (sorted, deduplicated)
  const timeSlots = (() => {
    const seen = new Set<string>();
    const slots: { start: string; end: string; label: string; mobileLabel: string }[] = [];
    [...classes]
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .forEach((c: ClassInstance) => {
        const start = isoToHHMM(c.startTime);
        const end = isoToHHMM(c.endTime);
        if (!seen.has(start)) {
          seen.add(start);
          slots.push({ start, end, label: `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`, mobileLabel: formatTime12Hour(start) });
        }
      });
    return slots;
  })();

  // Get class for a specific day and time slot — both use local time
  const getClassForSlot = (day: Date, timeSlot: { start: string }) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return classes.find((c: ClassInstance) =>
      isoToDateStr(c.startTime) === dayStr && isoToHHMM(c.startTime) === timeSlot.start
    );
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

  const handleClassClick = (classInstance: ClassInstance) => {
    if (classInstance.isFull || !classInstance.availableSpots || classInstance.isBooked) return;
    setSelectedClass(classInstance);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    // Refetch classes to update availability
    queryClient.invalidateQueries({ queryKey: ['schedule-grid'] });
    setIsBookingModalOpen(false);
    setSelectedClass(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="text-orange-500 text-xs sm:text-sm font-medium mb-1 sm:mb-2">CLASS SCHEDULE</div>
        <div className="text-white text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">WORKING SCHEDULE</div>
        
        {/* Location Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <select
            value={selectedLocationId || ''}
            onChange={(e) => setSelectedLocationId(Number(e.target.value))}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base flex-1 sm:flex-none"
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
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors touch-target"
              aria-label="Previous week"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm touch-target"
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors touch-target"
              aria-label="Next week"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Location Name */}
        {selectedLocationId && (
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={handlePreviousWeek}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors touch-target sm:hidden"
              aria-label="Previous week"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-white text-base sm:text-xl font-semibold text-center truncate flex-1 sm:flex-none">
              {locations.find(l => l.id === selectedLocationId)?.name.toUpperCase()}
            </div>
            <button
              onClick={handleNextWeek}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors touch-target sm:hidden"
              aria-label="Next week"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Schedule Grid */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full border-collapse min-w-[600px]">
            {/* Header Row */}
            <thead>
              <tr>
                <th className="bg-gray-800 text-gray-400 text-[10px] sm:text-xs font-medium py-2 sm:py-3 px-3 sm:px-4 text-left border-r border-gray-700 sticky left-0 z-10 min-w-[70px] sm:min-w-auto">
                  TIME
                </th>
                {daysOfWeek.map((day) => (
                  <th
                    key={day.toISOString()}
                    className="bg-gray-800 text-white text-[10px] sm:text-xs font-medium py-2 sm:py-3 px-1 sm:px-4 text-center border-r border-gray-700 last:border-r-0 min-w-[80px] sm:min-w-[100px]"
                  >
                    <div className="hidden sm:block">{format(day, 'EEEE').toUpperCase()}</div>
                    <div className="sm:hidden">{format(day, 'EEE').toUpperCase()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Time Slot Rows */}
            <tbody>
              {timeSlots.map((timeSlot, slotIndex) => (
                <tr key={`${timeSlot.start}-${timeSlot.end}`} className="border-b border-gray-700">
                  {/* Time Column */}
                  <td className="bg-gray-800 text-gray-400 text-[10px] sm:text-xs py-2 sm:py-4 px-3 sm:px-4 border-r border-gray-700 whitespace-nowrap sticky left-0 z-10 min-w-[70px] sm:min-w-auto">
                    <div className="hidden sm:block">{timeSlot.label}</div>
                    <div className="sm:hidden font-medium">{timeSlot.mobileLabel || formatTime12Hour(timeSlot.start)}</div>
                  </td>
                  
                  {/* Day Columns */}
                  {daysOfWeek.map((day) => {
                    const classInstance = getClassForSlot(day, timeSlot);
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    // Check if class is in the past (compare full datetime, not just date)
                    const classDateTime = classInstance ? new Date(classInstance.startTime) : null;
                    const now = new Date();
                    const isPast = classDateTime ? classDateTime < now : false;
                    const isBooked = classInstance?.isBooked || false;
                    const isClickable = classInstance && 
                                      !classInstance.isFull && 
                                      classInstance.availableSpots > 0 && 
                                      !isPast &&
                                      !isBooked;
                    
                    return (
                      <td
                        key={`${day.toISOString()}-${timeSlot.start}`}
                        className={`py-2 px-1 sm:py-4 sm:px-4 border-r border-gray-700 last:border-r-0 text-center transition-all ${
                          classInstance
                            ? isBooked
                              ? 'bg-green-600 text-white'
                              : classInstance.isFull || isPast
                              ? 'bg-gray-600 text-gray-400'
                              : 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer active:scale-95'
                            : isToday
                            ? 'bg-gray-700 text-gray-500'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                        onClick={() => isClickable && handleClassClick(classInstance)}
                      >
                        {classInstance ? (
                          <div className="flex flex-col items-center justify-center gap-1 min-h-[60px] sm:min-h-[80px]">
                            <div className="text-[10px] sm:text-xs font-medium leading-tight px-1">
                              {classInstance.classType}
                            </div>
                            {isBooked && (
                              <span className="text-[9px] sm:text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded mt-1">
                                BOOKED
                              </span>
                            )}
                            {isClickable && !isBooked && (
                              <button
                                className="text-[9px] sm:text-xs font-semibold bg-white text-orange-500 px-2 py-0.5 sm:px-3 sm:py-1 rounded mt-1 hover:bg-orange-50 transition-colors touch-target"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClassClick(classInstance);
                                }}
                              >
                                BOOK
                              </button>
                            )}
                            {classInstance.isFull && !isBooked && (
                              <span className="text-[9px] sm:text-xs text-gray-300">FULL</span>
                            )}
                            {isPast && (
                              <span className="text-[9px] sm:text-xs text-gray-400">PAST</span>
                            )}
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
      <div className="mt-3 sm:mt-4 text-center text-gray-400 text-xs sm:text-sm">
        {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
      </div>

      {/* Booking Modal */}
      {selectedClass && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedClass(null);
          }}
          classInstance={selectedClass}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}

