'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import Link from 'next/link';

interface ClassInstance {
  id: number;
  classType: {
    id: number;
    name: string;
  };
  location: {
    id: number;
    name: string;
  };
  coach: {
    id: number;
    firstName: string;
    lastName: string;
  };
  startTime: string;
  endTime: string;
  capacity: number;
  bookingCount: number;
  availableSpots: number;
  isCancelled: boolean;
}

interface Location {
  id: number;
  name: string;
}

export default function AdminScheduleGridView() {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [locations, setLocations] = useState<Location[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await apiClient.get('/admin/locations');
        const locationsData = (response.data.data.locations || []).filter((l: any) => l.isActive);
        setLocations(locationsData);
        if (locationsData.length > 0 && !selectedLocationId) {
          setSelectedLocationId(locationsData[0].id);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };
    fetchLocations();
  }, []);

  // Fetch classes for the selected week and location
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['admin-schedule-grid', selectedLocationId, currentWeek],
    queryFn: async () => {
      if (!selectedLocationId) return { classes: [] };
      
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 }); // Start on Saturday
      const weekEnd = addDays(weekStart, 6);

      // Use UTC date strings so the backend (UTC) boundaries align correctly
      const toUTC = (d: Date) =>
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      
      const response = await apiClient.get('/admin/classes', {
        params: {
          location: selectedLocationId.toString(),
          startDate: toUTC(weekStart),
          endDate: toUTC(weekEnd)
        }
      });
      
      const allClasses = response.data.data.classes || [];
      return { classes: allClasses };
    },
    enabled: !!selectedLocationId,
    staleTime: 0, // always refetch on mount so synced data is immediately visible
  });

  const classes = classesData?.classes || [];

  // Get week start (Saturday) — work in UTC to match server-stored ISO dates
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // UTC date string for a Date object (avoids local-timezone day shift)
  const toUTCDateStr = (d: Date): string => {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  // Extract "HH:MM" from an ISO datetime string converted to Egypt local time (UTC+2)
  const isoToHHMM = (iso: string): string => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Extract "YYYY-MM-DD" from ISO string using LOCAL date (Egypt time)
  const isoToDateStr = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Helper function to convert 24-hour time string to 12-hour AM/PM format
  const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Derive time slots dynamically from actual classes this week (using UTC times)
  const timeSlots = (() => {
    const seen = new Map<string, { start: string; end: string }>();
    classes.forEach((c: ClassInstance) => {
      const startKey = isoToHHMM(c.startTime);
      if (!seen.has(startKey)) {
        seen.set(startKey, { start: startKey, end: isoToHHMM(c.endTime) });
      }
    });
    return Array.from(seen.values()).sort((a, b) => a.start.localeCompare(b.start));
  })();

  // Local date string for a Date object (used for column headers and matching)
  const toLocalDateStr = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Helper function to get class for a specific day and time slot (local time)
  const getClassForSlot = (day: Date, timeSlot: { start: string; end: string }) => {
    const dayStr = toLocalDateStr(day);
    return classes.find((c: ClassInstance) => {
      return isoToDateStr(c.startTime) === dayStr && isoToHHMM(c.startTime) === timeSlot.start;
    });
  };

  const handleSyncClasses = useCallback(async () => {
    if (!confirm('This will delete ALL unbooked future classes and regenerate them from the current default schedule.\n\nClasses with existing bookings will NOT be deleted.\n\nContinue?')) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await apiClient.post('/admin/schedules/force-resync', {
        locationId: selectedLocationId
      });
      const deleted = res.data?.data?.deleted ?? 0;
      setSyncMessage(`✓ Synced: removed ${deleted} outdated class${deleted !== 1 ? 'es' : ''}, regenerated from current schedule.`);
      queryClient.invalidateQueries({ queryKey: ['admin-schedule-grid'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-grid'] });
    } catch (err: any) {
      setSyncMessage('✗ Sync failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSyncing(false);
    }
  }, [selectedLocationId, queryClient]);

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
    <div className="bg-gray-900 min-h-screen p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="text-orange-500 text-xs sm:text-sm font-medium mb-1 sm:mb-2">ADMIN CLASS SCHEDULE</div>
        <div className="text-white text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">CLASS MANAGEMENT</div>
        
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

          {/* Sync button */}
          <button
            onClick={handleSyncClasses}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-3 py-2 rounded text-xs sm:text-sm transition-colors"
            title="Remove outdated classes and regenerate from current schedule"
          >
            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing…' : 'Sync Classes'}
          </button>
          
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
      {syncMessage && (
        <div className={`mb-3 px-4 py-2 rounded text-sm ${syncMessage.startsWith('✓') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
          {syncMessage}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {timeSlots.length === 0 && !isLoading && (
          <div className="py-16 text-center text-gray-500 text-sm">
            No classes scheduled for this week at this location.
          </div>
        )}
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
                    <div className="hidden sm:block">{formatTime12Hour(timeSlot.start)} - {formatTime12Hour(timeSlot.end)}</div>
                    <div className="sm:hidden font-medium">{formatTime12Hour(timeSlot.start)}</div>
                  </td>
                  
                  {/* Day Columns */}
                  {daysOfWeek.map((day) => {
                    const classInstance = getClassForSlot(day, timeSlot);
                    const isToday = toLocalDateStr(day) === toLocalDateStr(new Date());
                    const isPast = day < new Date() && !isToday;
                    
                    return (
                      <td
                        key={`${day.toISOString()}-${timeSlot.start}`}
                        className={`py-2 px-1 sm:py-4 sm:px-4 border-r border-gray-700 last:border-r-0 text-center transition-all ${
                          classInstance
                            ? classInstance.isCancelled
                              ? 'bg-red-600 text-white'
                              : 'bg-orange-500 text-white'
                            : isToday
                            ? 'bg-gray-700 text-gray-500'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {classInstance ? (
                          <Link
                            href={`/admin/classes/${classInstance.id}/roster`}
                            className="flex flex-col items-center justify-center gap-1 min-h-[60px] sm:min-h-[80px] hover:opacity-90 transition-opacity"
                          >
                            <div className="text-[10px] sm:text-xs font-medium leading-tight px-1">
                              {classInstance.classType.name}
                            </div>
                            <div className="text-[9px] sm:text-xs text-white/80">
                              {classInstance.bookingCount}/{classInstance.capacity}
                            </div>
                            {classInstance.isCancelled && (
                              <span className="text-[9px] sm:text-xs text-white font-semibold">CANCELLED</span>
                            )}
                            <div className="text-[9px] sm:text-xs text-white/70 mt-1">
                              {classInstance.coach.firstName} {classInstance.coach.lastName}
                            </div>
                          </Link>
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

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-gray-400">Scheduled Class</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span className="text-gray-400">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded"></div>
          <span className="text-gray-400">Today</span>
        </div>
      </div>
    </div>
  );
}
