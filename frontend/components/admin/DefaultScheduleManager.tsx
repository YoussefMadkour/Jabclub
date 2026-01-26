'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

interface Schedule {
  id: number;
  classType: string;
  classTypeId: number;
  durationMinutes: number;
  coach: string;
  coachId: number;
  coachEmail: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  capacity: number;
  instanceCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LocationSchedule {
  locationId: number;
  locationName: string;
  locationAddress: string;
  schedules: Schedule[];
}

interface DefaultSchedulesResponse {
  locations: LocationSchedule[];
  totalLocations: number;
  totalSchedules: number;
}

interface GridCell {
  classTypeId: string;
  classTypeName: string;
}

export default function DefaultScheduleManager() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [applyToCurrentMonth, setApplyToCurrentMonth] = useState(false);
  const [form, setForm] = useState({
    classTypeId: '',
    coachId: '',
    locationId: '',
    dayOfWeek: '',
    startTime: '',
    capacity: ''
  });
  
  // Bulk import state
  const [bulkForm, setBulkForm] = useState({
    locationId: '',
    coachId: '',
    capacity: '20'
  });
  const [timeSlots, setTimeSlots] = useState<string[]>(['19:00', '20:00']); // Default to 7:00 PM and 8:00 PM in 24-hour format
  const [scheduleGrid, setScheduleGrid] = useState<Record<string, GridCell>>({});
  const [processing, setProcessing] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<DefaultSchedulesResponse>({
    queryKey: ['admin-default-schedules'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/schedules/default');
      return response.data.data;
    }
  });

  // Fetch class types and coaches for dropdowns
  const { data: classTypesData, isLoading: isLoadingClassTypes } = useQuery({
    queryKey: ['admin-class-types'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/class-types');
        const classTypes = response.data?.data?.classTypes || response.data?.classTypes || [];
        console.log('Class types fetched:', classTypes);
        return classTypes;
      } catch (error) {
        console.error('Error fetching class types:', error);
        return [];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  const { data: coachesData, isLoading: isLoadingCoaches } = useQuery({
    queryKey: ['admin-coaches'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/coaches');
        const coaches = response.data?.data?.coaches || response.data?.coaches || [];
        console.log('Coaches fetched:', coaches);
        return coaches;
      } catch (error) {
        console.error('Error fetching coaches:', error);
        return [];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Fetch locations for create modal
  const { data: locationsData } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/locations');
      return response.data.data.locations.filter((loc: any) => loc.isActive);
    }
  });

  const openCreateModal = () => {
    setSelectedSchedule(null);
    setForm({
      classTypeId: '',
      coachId: '',
      locationId: '',
      dayOfWeek: '',
      startTime: '',
      capacity: '20'
    });
    setShowCreateModal(true);
  };


  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm({
      classTypeId: '',
      coachId: '',
      locationId: '',
      dayOfWeek: '',
      startTime: '',
      capacity: '20'
    });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedSchedule(null);
    setApplyToCurrentMonth(false);
    setForm({
      classTypeId: '',
      coachId: '',
      locationId: '',
      dayOfWeek: '',
      startTime: '',
      capacity: ''
    });
  };

  const handleCreate = async () => {
    if (!form.classTypeId || !form.coachId || !form.locationId || form.dayOfWeek === '' || !form.startTime || !form.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.post('/admin/schedules', {
        classTypeId: parseInt(form.classTypeId),
        coachId: parseInt(form.coachId),
        locationId: parseInt(form.locationId),
        dayOfWeek: parseInt(form.dayOfWeek),
        startTime: form.startTime,
        capacity: parseInt(form.capacity)
      });
      alert('Default schedule created successfully! Classes will be generated automatically each month.');
      closeCreateModal();
      queryClient.invalidateQueries({ queryKey: ['admin-default-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create schedule');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSchedule) return;

    if (!form.classTypeId || !form.coachId || form.dayOfWeek === '' || !form.startTime || !form.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.put(`/admin/schedules/${selectedSchedule.id}`, {
        classTypeId: parseInt(form.classTypeId),
        coachId: parseInt(form.coachId),
        locationId: parseInt(form.locationId),
        dayOfWeek: parseInt(form.dayOfWeek),
        startTime: form.startTime,
        capacity: parseInt(form.capacity),
        applyToCurrentMonth: applyToCurrentMonth
      });
      alert(applyToCurrentMonth 
        ? 'Default schedule updated successfully. Changes have been applied to this month and future months.'
        : 'Default schedule updated successfully. Changes will only affect future months.');
      closeEditModal();
      queryClient.invalidateQueries({ queryKey: ['admin-default-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update schedule');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (scheduleId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmMessage = currentStatus 
      ? 'Are you sure you want to deactivate this schedule? Future months will not generate classes from this schedule.'
      : 'Are you sure you want to activate this schedule? Classes will be generated automatically each month starting from next month.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Use PUT to update isActive status instead of DELETE
      await apiClient.put(`/admin/schedules/${scheduleId}`, {
        isActive: !currentStatus
      });
      const successMessage = currentStatus 
        ? 'Schedule deactivated successfully. Future months will not generate classes from this schedule.'
        : 'Schedule activated successfully! Classes will be generated automatically each month starting from next month.';
      alert(successMessage);
      queryClient.invalidateQueries({ queryKey: ['admin-default-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || `Failed to ${action} schedule`);
    }
  };

  // Bulk import functions
  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, '19:00']); // Default to 7:00 PM
  };

  const removeTimeSlot = (index: number) => {
    const newTimeSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(newTimeSlots);
    // Remove grid entries for this time slot
    const newGrid = { ...scheduleGrid };
    const days = ['0', '1', '2', '3', '4', '5', '6']; // Sunday to Saturday
    days.forEach(day => {
      delete newGrid[`${index}-${day}`];
    });
    setScheduleGrid(newGrid);
  };

  const updateTimeSlot = (index: number, value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = value;
    setTimeSlots(newTimeSlots);
  };

  const updateGridCell = (timeIndex: number, dayOfWeek: number, classTypeId: string, classTypeName: string) => {
    const key = `${timeIndex}-${dayOfWeek}`;
    if (classTypeId) {
      setScheduleGrid({ ...scheduleGrid, [key]: { classTypeId, classTypeName } });
    } else {
      const newGrid = { ...scheduleGrid };
      delete newGrid[key];
      setScheduleGrid(newGrid);
    }
  };

  const formatTimeDisplay = (time24: string): string => {
    // Convert 24-hour format (HH:MM) to 12-hour format (h:mm AM/PM)
    if (!time24 || !time24.includes(':')) return time24;
    
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const convertToTimeInput = (timeStr: string): string => {
    // If already in HH:MM format, return as is
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
      return timeStr;
    }
    // Try to convert from 12-hour format
    const trimmed = timeStr.trim().toUpperCase();
    const time12Regex = /^([0-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/;
    const match = trimmed.match(time12Regex);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3];

      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    return '19:00'; // Default to 7:00 PM
  };

  const convertTo24Hour = (timeStr: string): string | null => {
    // Handle formats like "7:00 PM", "7:00PM", "19:00", "7:00"
    const trimmed = timeStr.trim().toUpperCase();
    
    // Check if it's already in 24-hour format (HH:MM)
    const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (time24Regex.test(trimmed)) {
      return trimmed;
    }

    // Handle 12-hour format (e.g., "7:00 PM")
    const time12Regex = /^([0-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/;
    const match = trimmed.match(time12Regex);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3];

      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    return null;
  };

  const handleBulkImport = async () => {
    if (!bulkForm.locationId || !bulkForm.coachId || !bulkForm.capacity) {
      alert('Please select location, coach, and set capacity');
      return;
    }

    // Collect all schedules to create
    const schedulesToCreate: Array<{
      classTypeId: number;
      coachId: number;
      locationId: number;
      dayOfWeek: number;
      startTime: string;
      capacity: number;
    }> = [];

    const days = [
      { value: 0, name: 'Sunday' },
      { value: 1, name: 'Monday' },
      { value: 2, name: 'Tuesday' },
      { value: 3, name: 'Wednesday' },
      { value: 4, name: 'Thursday' },
      { value: 5, name: 'Friday' },
      { value: 6, name: 'Saturday' }
    ];

    for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
      const timeSlot = timeSlots[timeIndex];
      if (!timeSlot.trim()) continue;
      
      // Convert time format (e.g., "7:00 PM" to "19:00")
      const time24 = convertTo24Hour(timeSlot.trim());
      if (!time24) {
        alert(`Invalid time format: ${timeSlot}. Please use format like "7:00 PM" or "19:00"`);
        return;
      }

      days.forEach(day => {
        const key = `${timeIndex}-${day.value}`;
        const cell = scheduleGrid[key];
        if (cell && cell.classTypeId) {
          schedulesToCreate.push({
            classTypeId: parseInt(cell.classTypeId),
            coachId: parseInt(bulkForm.coachId),
            locationId: parseInt(bulkForm.locationId),
            dayOfWeek: day.value,
            startTime: time24,
            capacity: parseInt(bulkForm.capacity)
          });
        }
      });
    }

    if (schedulesToCreate.length === 0) {
      alert('Please fill in at least one class in the grid');
      return;
    }

    try {
      setBulkProcessing(true);
      
      // Create schedules one by one (or we could create a bulk endpoint)
      const results = await Promise.allSettled(
        schedulesToCreate.map(schedule => 
          apiClient.post('/admin/schedules', schedule)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) {
        alert(`Created ${successful} schedules successfully. ${failed} failed. Some schedules may already exist.`);
      } else {
        alert(`Successfully created ${successful} schedules! Classes will be generated automatically each month.`);
      }

      setShowBulkImportModal(false);
      setBulkForm({ locationId: '', coachId: '', capacity: '20' });
      setTimeSlots(['19:00', '20:00']);
      setScheduleGrid({});
      queryClient.invalidateQueries({ queryKey: ['admin-default-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create schedules');
    } finally {
      setBulkProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading default schedules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load default schedules. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const scheduleLocations = data?.locations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Default Schedule</h1>
            <p className="text-gray-600 mt-1">
              Manage recurring schedules that automatically generate classes each month. 
              Changes only affect future months, not current or past months.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#FF7A00] hover:bg-[#F57A00] text-white rounded-lg transition-colors"
            >
              + Add Schedule
            </button>
            <button
              onClick={() => {
                setBulkForm({ locationId: '', coachId: '', capacity: '20' });
                setTimeSlots(['19:00', '20:00']);
                setScheduleGrid({});
                setShowBulkImportModal(true);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              📋 Bulk Import
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-[#FF7A00] mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-orange-800">
            <p className="font-semibold mb-1">How Default Schedules Work:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Default schedules automatically generate classes each month</li>
              <li>Editing a default schedule only affects future months (not current or past)</li>
              <li>You can manually edit or remove specific class instances in the Classes page</li>
              <li>Manual edits to individual classes do not affect the default schedule</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Schedules by Location */}
      {scheduleLocations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-lg">No default schedules found</p>
          <p className="text-gray-500 text-sm mt-2">Create schedules in the Classes page to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {scheduleLocations.map((location) => (
            <div key={location.locationId} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{location.locationName}</h2>
                <p className="text-sm text-gray-600 mt-1">{location.locationAddress}</p>
              </div>
              
              {location.schedules.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No schedules for this location
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coach
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Day
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capacity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Instances
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {location.schedules.map((schedule) => (
                        <tr key={schedule.id} className={`hover:bg-gray-50 ${!schedule.isActive ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900">{schedule.classType}</div>
                              {!schedule.isActive && (
                                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{schedule.coach}</div>
                            <div className="text-xs text-gray-500">{schedule.coachEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{schedule.dayName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{schedule.startTime}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{schedule.durationMinutes} min</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{schedule.capacity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{schedule.instanceCount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  // Add locationId to form when editing
                                  setForm({
                                    ...form,
                                    locationId: location.locationId.toString(),
                                    classTypeId: schedule.classTypeId.toString(),
                                    coachId: schedule.coachId.toString(),
                                    dayOfWeek: schedule.dayOfWeek.toString(),
                                    startTime: schedule.startTime,
                                    capacity: schedule.capacity.toString()
                                  });
                                  setSelectedSchedule(schedule);
                                  setShowEditModal(true);
                                }}
                                className="text-[#FF7A00] hover:text-orange-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleActive(schedule.id, schedule.isActive)}
                                className={schedule.isActive 
                                  ? "text-red-600 hover:text-red-900" 
                                  : "text-green-600 hover:text-green-900"
                                }
                              >
                                {schedule.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Create Default Schedule</h2>
            <p className="text-sm text-gray-600 mb-4">
              This schedule will automatically generate classes each month. You can edit or remove specific classes later.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                >
                  <option value="">Select location</option>
                  {locationsData?.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Type *</label>
                <select
                  value={form.classTypeId}
                  onChange={(e) => setForm({ ...form, classTypeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                  disabled={isLoadingClassTypes}
                >
                  <option value="">{isLoadingClassTypes ? 'Loading class types...' : 'Select class type'}</option>
                  {Array.isArray(classTypesData) && classTypesData.length > 0 && classTypesData.map((ct: any) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} ({ct.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach *</label>
                <select
                  value={form.coachId}
                  onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                  disabled={isLoadingCoaches}
                >
                  <option value="">{isLoadingCoaches ? 'Loading coaches...' : 'Select coach'}</option>
                  {Array.isArray(coachesData) && coachesData.length > 0 ? (
                    coachesData.map((coach: any) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.firstName} {coach.lastName}
                      </option>
                    ))
                  ) : (
                    !isLoadingCoaches && <option value="" disabled>No coaches available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week *</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                >
                  <option value="">Select day</option>
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (HH:MM) *</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={processing}
                className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] disabled:opacity-50"
              >
                {processing ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Edit Default Schedule</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose when to apply these changes.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                >
                  <option value="">Select location</option>
                  {locationsData?.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Type *</label>
                <select
                  value={form.classTypeId}
                  onChange={(e) => setForm({ ...form, classTypeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                  disabled={isLoadingClassTypes}
                >
                  <option value="">{isLoadingClassTypes ? 'Loading class types...' : 'Select class type'}</option>
                  {Array.isArray(classTypesData) && classTypesData.length > 0 && classTypesData.map((ct: any) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} ({ct.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach *</label>
                <select
                  value={form.coachId}
                  onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                  disabled={isLoadingCoaches}
                >
                  <option value="">{isLoadingCoaches ? 'Loading coaches...' : 'Select coach'}</option>
                  {Array.isArray(coachesData) && coachesData.length > 0 ? (
                    coachesData.map((coach: any) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.firstName} {coach.lastName}
                      </option>
                    ))
                  ) : (
                    !isLoadingCoaches && <option value="" disabled>No coaches available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week *</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                >
                  <option value="">Select day</option>
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (HH:MM) *</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  min="1"
                  required
                />
              </div>
              
              <div className="pt-2 pb-2 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Apply Changes To:</label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="applyOption"
                      checked={!applyToCurrentMonth}
                      onChange={() => setApplyToCurrentMonth(false)}
                      className="mr-2 h-4 w-4 text-[#FF7A00] focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Future months only (recommended)
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="applyOption"
                      checked={applyToCurrentMonth}
                      onChange={() => setApplyToCurrentMonth(true)}
                      className="mr-2 h-4 w-4 text-[#FF7A00] focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      This month and future months
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {applyToCurrentMonth 
                    ? 'Warning: This will update existing classes this month. Classes with bookings may be affected.'
                    : 'Current and past months will remain unchanged.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={processing}
                className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] disabled:opacity-50"
              >
                {processing ? 'Updating...' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Bulk Import Schedules</h2>
            <p className="text-sm text-gray-600 mb-4">
              Fill in the grid below to create multiple schedules at once. Select a class type for each time slot and day combination.
            </p>
            
            {/* Bulk Form Settings */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  value={bulkForm.locationId}
                  onChange={(e) => setBulkForm({ ...bulkForm, locationId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                >
                  <option value="">Select location</option>
                  {locationsData?.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach *</label>
                <select
                  value={bulkForm.coachId}
                  onChange={(e) => setBulkForm({ ...bulkForm, coachId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                >
                  <option value="">Select coach</option>
                  {Array.isArray(coachesData) && coachesData.length > 0 ? (
                    coachesData.map((coach: any) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.firstName} {coach.lastName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No coaches available</option>
                  )}
                </select>
                {Array.isArray(coachesData) && coachesData.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No coaches found. Please create coaches first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="number"
                  value={bulkForm.capacity}
                  onChange={(e) => setBulkForm({ ...bulkForm, capacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Time Slots Management */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Time Slots</label>
                <button
                  onClick={addTimeSlot}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  + Add Time Slot
                </button>
              </div>
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={slot || '19:00'}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    {timeSlots.length > 1 && (
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Grid */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border border-gray-300">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border border-gray-300">
                      Sun
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border border-gray-300">
                      Mon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border border-gray-300">
                      Tue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border border-gray-300">
                      Wed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border border-gray-300">
                      Thu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border border-gray-300">
                      Fri
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border border-gray-300">
                      Sat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot, timeIndex) => (
                    <tr key={timeIndex}>
                      <td className="px-4 py-3 border border-gray-300 font-medium bg-gray-50">
                        {timeSlot ? formatTimeDisplay(timeSlot) : `Time ${timeIndex + 1}`}
                      </td>
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                        const key = `${timeIndex}-${dayOfWeek}`;
                        const cell = scheduleGrid[key];
                        return (
                          <td key={dayOfWeek} className="px-2 py-2 border border-gray-300">
                            <select
                              value={cell?.classTypeId || ''}
                              onChange={(e) => {
                                const selectedClassType = classTypesData?.find((ct: any) => ct.id.toString() === e.target.value);
                                updateGridCell(
                                  timeIndex,
                                  dayOfWeek,
                                  e.target.value,
                                  selectedClassType?.name || ''
                                );
                              }}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                            >
                              <option value="">-</option>
                              {Array.isArray(classTypesData) && classTypesData.map((ct: any) => (
                                <option key={ct.id} value={ct.id}>
                                  {ct.name}
                                </option>
                              ))}
                            </select>
                            {cell?.classTypeName && (
                              <div className="mt-1 text-xs text-gray-600 truncate">
                                {cell.classTypeName}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowBulkImportModal(false);
                  setBulkForm({ locationId: '', coachId: '', capacity: '20' });
                  setTimeSlots(['19:00', '20:00']);
                  setScheduleGrid({});
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={bulkProcessing || Object.keys(scheduleGrid).length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkProcessing ? 'Creating...' : `Create ${Object.keys(scheduleGrid).length} Schedule(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

