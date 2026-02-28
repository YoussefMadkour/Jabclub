'use client';

import { useState, useEffect } from 'react';
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
    capacity: '20',
    scheduleScope: 'ongoing' as 'ongoing' | 'month-only' | 'window',
    windowName: '',
    overrideStartDate: '',
    overrideEndDate: ''
  });

  // Main grid — pending empty time slot rows
  const [pendingGridTimeslots, setPendingGridTimeslots] = useState<{id: string; time: string}[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>(['19:00', '20:00']); // Default to 7:00 PM and 8:00 PM in 24-hour format
  const [scheduleGrid, setScheduleGrid] = useState<Record<string, GridCell>>({});
  const [showConflictPreview, setShowConflictPreview] = useState(false);
  const [conflictPreview, setConflictPreview] = useState<{ conflicts: number; newSchedules: number; updates: number } | null>(null);
  const [conflictAction, setConflictAction] = useState<'skip' | 'update' | 'cancel'>('skip');
  const [processing, setProcessing] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [selectedLocationIdx, setSelectedLocationIdx] = useState(0);
  const [selectedCoachFilter, setSelectedCoachFilter] = useState<string>('all');

  // Drag & drop
  const [draggingScheduleId, setDraggingScheduleId] = useState<number | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    scheduleId: number; classType: string;
    fromDay: number; fromTime: string;
    toDay: number; toTime: string;
  } | null>(null);
  const [moveApplyCurrentMonth, setMoveApplyCurrentMonth] = useState(false);
  const [movingSchedule, setMovingSchedule] = useState(false);

  // New class type creation
  const [showNewClassTypeModal, setShowNewClassTypeModal] = useState(false);
  const [newClassTypeForm, setNewClassTypeForm] = useState({ name: '', durationMinutes: '60', description: '' });
  const [creatingClassType, setCreatingClassType] = useState(false);
  const [newClassTypeTarget, setNewClassTypeTarget] = useState<'form' | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ['schedule-grid'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedule-grid'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create schedule');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSchedule) return;

    if (!form.classTypeId || !form.coachId || !form.locationId || form.dayOfWeek === '' || !form.startTime || !form.capacity) {
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
      queryClient.invalidateQueries({ queryKey: ['schedule-grid'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedule-grid'] });
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
      queryClient.invalidateQueries({ queryKey: ['schedule-grid'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedule-grid'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || `Failed to ${action} schedule`);
    }
  };

  // Move schedule (drag & drop result)
  const executeMoveSchedule = async (applyCurrentMonth: boolean) => {
    if (!pendingMove) return;
    try {
      setMovingSchedule(true);
      await apiClient.put(`/admin/schedules/${pendingMove.scheduleId}`, {
        dayOfWeek: pendingMove.toDay,
        startTime: pendingMove.toTime,
        applyToCurrentMonth: applyCurrentMonth
      });
      setPendingMove(null);
      setMoveApplyCurrentMonth(false);
      queryClient.invalidateQueries({ queryKey: ['admin-default-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-grid'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedule-grid'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to move schedule');
    } finally {
      setMovingSchedule(false);
    }
  };

  // Create new class type inline
  const handleCreateClassType = async () => {
    if (!newClassTypeForm.name.trim() || !newClassTypeForm.durationMinutes) {
      alert('Please enter a name and duration');
      return;
    }
    try {
      setCreatingClassType(true);
      const response = await apiClient.post('/admin/class-types', {
        name: newClassTypeForm.name.trim(),
        durationMinutes: parseInt(newClassTypeForm.durationMinutes),
        description: newClassTypeForm.description.trim() || undefined
      });
      const newType = response.data.data.classType;
      queryClient.invalidateQueries({ queryKey: ['admin-class-types'] });
      if (newClassTypeTarget === 'form') {
        setForm(prev => ({ ...prev, classTypeId: newType.id.toString() }));
      }
      setShowNewClassTypeModal(false);
      setNewClassTypeForm({ name: '', durationMinutes: '60', description: '' });
      setNewClassTypeTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create class type');
    } finally {
      setCreatingClassType(false);
    }
  };

  const openNewClassTypeModal = (target: 'form' | null = null) => {
    setNewClassTypeTarget(target);
    setNewClassTypeForm({ name: '', durationMinutes: '60', description: '' });
    setShowNewClassTypeModal(true);
  };

  // Main grid — pending time slot helpers
  const addPendingGridTimeslot = () => {
    setPendingGridTimeslots(prev => [...prev, { id: Date.now().toString(), time: '19:00' }]);
  };
  const removePendingGridTimeslot = (id: string) => {
    setPendingGridTimeslots(prev => prev.filter(p => p.id !== id));
  };
  const updatePendingGridTimeslot = (id: string, time: string) => {
    setPendingGridTimeslots(prev => prev.map(p => p.id === id ? { ...p, time } : p));
  };

  // Ramadan 2026 preset (approx. Feb 28 – Mar 29, 2026)
  const applyRamadanPreset = () => {
    const now = new Date();
    const year = now.getFullYear();
    // Rough Ramadan estimate for current/next year (Hijri calendar offset ~11 days/year)
    // 2026: ~Feb 28 – Mar 29; 2027: ~Feb 17 – Mar 18
    const ramadanStart = year <= 2026 ? `${year}-02-28` : `${year}-02-17`;
    const ramadanEnd = year <= 2026 ? `${year}-03-29` : `${year}-03-18`;
    setBulkForm(f => ({ ...f, scheduleScope: 'window', windowName: 'Ramadan', overrideStartDate: ramadanStart, overrideEndDate: ramadanEnd }));
  };

  const applyThisMonthPreset = () => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setBulkForm(f => ({ ...f, scheduleScope: 'window', overrideStartDate: start, overrideEndDate: end }));
  };

  const currentMonthLabel = () => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
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


  // Check for conflicts before submission
  const checkConflicts = (): { conflicts: number; updates: number; newSchedules: number; schedulesToCreate: any[] } => {
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
      
      const time24 = convertTo24Hour(timeSlot.trim());
      if (!time24) continue;

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

    // conflicts/updates are now detected server-side via the smart import
    return { conflicts: 0, updates: 0, newSchedules: schedulesToCreate.length, schedulesToCreate };
  };

  const handleBulkImport = async () => {
    if (!bulkForm.locationId || !bulkForm.coachId || !bulkForm.capacity) {
      alert('Please select location, coach, and set capacity');
      return;
    }

    // Validate window schedule dates
    if (bulkForm.scheduleScope === 'window') {
      if (!bulkForm.overrideStartDate || !bulkForm.overrideEndDate) {
        alert('Please provide start and end dates for the schedule window');
        return;
      }
      if (new Date(bulkForm.overrideStartDate) >= new Date(bulkForm.overrideEndDate)) {
        alert('Start date must be before end date');
        return;
      }
    }

    // Check for conflicts first
    const { conflicts, updates, newSchedules, schedulesToCreate } = checkConflicts();

    if (schedulesToCreate.length === 0) {
      alert('Please fill in at least one new class in the grid');
      return;
    }

    // Show conflict preview if there are conflicts
    if (conflicts > 0 || updates > 0) {
      setConflictPreview({ conflicts, updates, newSchedules });
      setShowConflictPreview(true);
      return;
    }

    // No conflicts, proceed directly
    await executeBulkImport(schedulesToCreate, 'skip');
  };

  const executeBulkImport = async (schedulesToCreate: any[], action: 'skip' | 'update' | 'cancel') => {
    try {
      setBulkProcessing(true);
      
      const response = await apiClient.post('/admin/schedules/bulk-import-smart', {
        schedules: schedulesToCreate,
        conflictAction: action,
        isTemporary: bulkForm.scheduleScope !== 'ongoing',
        overrideStartDate: bulkForm.scheduleScope !== 'ongoing' ? (
          bulkForm.scheduleScope === 'month-only'
            ? (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`; })()
            : bulkForm.overrideStartDate
        ) : undefined,
        overrideEndDate: bulkForm.scheduleScope !== 'ongoing' ? (
          bulkForm.scheduleScope === 'month-only'
            ? (() => { const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth()+1, 0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()
            : bulkForm.overrideEndDate
        ) : undefined
      });

      const results = response.data.data.results;
      const message = response.data.data.message;

      alert(`✅ ${message}\n\nCreated: ${results.created}\nUpdated: ${results.updated}\nSkipped: ${results.skipped}\nFailed: ${results.failed}`);

      setShowBulkImportModal(false);
      setShowConflictPreview(false);
      setBulkForm({ locationId: '', coachId: '', capacity: '20', scheduleScope: 'ongoing', windowName: '', overrideStartDate: '', overrideEndDate: '' });
      setTimeSlots(['19:00', '20:00']);
      setScheduleGrid({});
      setConflictPreview(null);
      queryClient.invalidateQueries({ queryKey: ['admin-default-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-grid'] });
      queryClient.invalidateQueries({ queryKey: ['admin-schedule-grid'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to import schedules');
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
                setBulkForm({ locationId: '', coachId: '', capacity: '20', scheduleScope: 'ongoing', windowName: '', overrideStartDate: '', overrideEndDate: '' });
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

      {/* Schedules — Weekly Grid View */}
      {scheduleLocations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-lg">No default schedules found</p>
          <p className="text-gray-500 text-sm mt-2">Click "+ Add Schedule" or "Bulk Import" to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Location Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            {scheduleLocations.map((location, idx) => (
              <button
                key={location.locationId}
                onClick={() => { setSelectedLocationIdx(idx); setSelectedCoachFilter('all'); }}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  selectedLocationIdx === idx
                    ? 'border-[#FF7A00] text-[#FF7A00] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {location.locationName}
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {location.schedules.filter((s: any) => s.isActive).length}
                </span>
              </button>
            ))}
          </div>

          {(() => {
            const location = scheduleLocations[selectedLocationIdx];
            if (!location) return null;

            const activeSchedules = location.schedules.filter((s: any) => s.isActive);
            const inactiveSchedules = location.schedules.filter((s: any) => !s.isActive);

            // Collect unique coaches for the filter
            const coaches = Array.from(
              new Map(location.schedules.map((s: any) => [s.coachId, s.coach])).entries()
            );

            // Filter by coach
            const visibleSchedules = selectedCoachFilter === 'all'
              ? activeSchedules
              : activeSchedules.filter((s: any) => s.coachId.toString() === selectedCoachFilter);

            // Derive unique sorted time slots
            const timeSlotSet = Array.from(new Set(visibleSchedules.map((s: any) => s.startTime))).sort() as string[];
            const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            // Columns: only days that have at least one schedule
            const activeDays = Array.from(new Set(visibleSchedules.map((s: any) => s.dayOfWeek))).sort() as number[];

            return (
              <div className="p-4">
                {/* Coach filter + inactive count */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">Filter by coach:</span>
                    <button
                      onClick={() => setSelectedCoachFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCoachFilter === 'all' ? 'bg-[#FF7A00] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      All
                    </button>
                    {coaches.map(([id, name]) => (
                      <button
                        key={id}
                        onClick={() => setSelectedCoachFilter(id.toString())}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCoachFilter === id.toString() ? 'bg-[#FF7A00] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {name as string}
                      </button>
                    ))}
                  </div>
                  {inactiveSchedules.length > 0 && (
                    <span className="text-xs text-gray-400">{inactiveSchedules.length} inactive hidden</span>
                  )}
                </div>

                {visibleSchedules.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">No schedules for this location</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="w-20 py-2 pr-3 text-left text-xs font-semibold text-gray-400 uppercase">Time</th>
                          {activeDays.map(d => (
                            <th key={d} className="py-2 px-2 text-center text-xs font-semibold text-gray-500 uppercase">
                              {dayLabels[d]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlotSet.map(time => (
                          <tr key={time} className="border-t border-gray-100">
                            <td className="py-2 pr-3 text-xs font-medium text-gray-400 whitespace-nowrap align-top pt-3">
                              {formatTimeDisplay(time)}
                            </td>
                            {activeDays.map(day => {
                              const cellKey = `${day}-${time}`;
                              const cellSchedules = visibleSchedules.filter(
                                (s: any) => s.startTime === time && s.dayOfWeek === day
                              );
                              const isDragTarget = dragOverCell === cellKey;
                              const isDragTargetEmpty = isDragTarget && cellSchedules.length === 0;
                              const isDragTargetOccupied = isDragTarget && cellSchedules.length > 0 && !cellSchedules.some((s: any) => s.id === draggingScheduleId);
                              return (
                                <td
                                  key={day}
                                  className={`px-1 py-1 align-top min-w-[110px] rounded transition-colors
                                    ${isDragTargetEmpty ? 'bg-green-50 ring-2 ring-green-400 ring-inset' : ''}
                                    ${isDragTargetOccupied ? 'bg-red-50 ring-2 ring-red-300 ring-inset' : ''}
                                  `}
                                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCell(cellKey); }}
                                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCell(null); }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOverCell(null);
                                    if (!draggingScheduleId) return;
                                    const src = visibleSchedules.find((s: any) => s.id === draggingScheduleId) ||
                                      scheduleLocations.flatMap((l: any) => l.schedules).find((s: any) => s.id === draggingScheduleId);
                                    if (!src) return;
                                    if (src.dayOfWeek === day && src.startTime === time) return;
                                    if (cellSchedules.length > 0 && !cellSchedules.some((s: any) => s.id === draggingScheduleId)) return;
                                    setPendingMove({ scheduleId: src.id, classType: src.classType, fromDay: src.dayOfWeek, fromTime: src.startTime, toDay: day, toTime: time });
                                    setDraggingScheduleId(null);
                                  }}
                                >
                                  {cellSchedules.length === 0 ? (
                                    <div
                                      className={`w-full h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors
                                        ${isDragTargetEmpty ? 'border-green-400 bg-green-50 text-green-500 text-2xl' : 'border-gray-200 text-gray-300 hover:border-[#FF7A00] hover:text-[#FF7A00]'}
                                      `}
                                    >
                                      {isDragTargetEmpty ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setForm({ classTypeId: '', coachId: '', locationId: location.locationId.toString(), dayOfWeek: day.toString(), startTime: time, capacity: '20' });
                                            setSelectedSchedule(null);
                                            setShowCreateModal(true);
                                          }}
                                          className="w-full h-full flex items-center justify-center text-xl"
                                          title="Add schedule"
                                        >+</button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {cellSchedules.map((schedule: any) => (
                                        <div
                                          key={schedule.id}
                                          draggable
                                          onDragStart={(e) => {
                                            setDraggingScheduleId(schedule.id);
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('text/plain', schedule.id.toString());
                                          }}
                                          onDragEnd={() => { setDraggingScheduleId(null); setDragOverCell(null); }}
                                          className={`group relative rounded-lg px-3 py-2 text-white text-xs cursor-grab active:cursor-grabbing select-none
                                            ${schedule.isOverride ? 'bg-orange-500' : 'bg-[#FF7A00]'}
                                            ${draggingScheduleId === schedule.id ? 'opacity-40 ring-2 ring-white' : ''}
                                            ${!schedule.isActive ? 'opacity-50' : ''}
                                          `}
                                        >
                                          {/* Drag handle hint */}
                                          <div className="absolute top-1.5 left-1.5 opacity-30 group-hover:opacity-60">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                                            </svg>
                                          </div>
                                          <div className="pl-3 font-semibold truncate">{schedule.classType}</div>
                                          <div className="pl-3 opacity-80 truncate">{schedule.coach}</div>
                                          <div className="pl-3 opacity-70">Cap: {schedule.capacity}</div>
                                          {schedule.isOverride && (
                                            <span className="absolute top-1 right-1 text-[9px] bg-white text-orange-600 rounded px-1">Temp</span>
                                          )}
                                          {/* Action buttons on hover */}
                                          <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                                            <button
                                              onMouseDown={(e) => e.stopPropagation()}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setForm({
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
                                              className="p-1.5 bg-white rounded-full text-[#FF7A00] hover:bg-orange-50 shadow"
                                              title="Edit"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                              </svg>
                                            </button>
                                            <button
                                              onMouseDown={(e) => e.stopPropagation()}
                                              onClick={(e) => { e.stopPropagation(); handleToggleActive(schedule.id, schedule.isActive); }}
                                              className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-50 shadow"
                                              title="Deactivate"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* Pending (new) time slot rows */}
                        {pendingGridTimeslots.map(pending => (
                          <tr key={pending.id} className="border-t border-dashed border-orange-200">
                            <td className="py-2 pr-3 align-top pt-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={pending.time}
                                  onChange={(e) => updatePendingGridTimeslot(pending.id, e.target.value)}
                                  className="text-xs border border-orange-300 rounded px-1.5 py-0.5 text-gray-700 w-[72px]"
                                />
                                <button
                                  onClick={() => removePendingGridTimeslot(pending.id)}
                                  className="text-gray-300 hover:text-red-500 text-lg leading-none"
                                  title="Remove this time slot row"
                                >×</button>
                              </div>
                            </td>
                            {activeDays.map(day => (
                              <td key={day} className="px-1 py-1 align-top min-w-[110px]">
                                <button
                                  onClick={() => {
                                    setForm({ classTypeId: '', coachId: '', locationId: location.locationId.toString(), dayOfWeek: day.toString(), startTime: pending.time, capacity: '20' });
                                    setSelectedSchedule(null);
                                    setShowCreateModal(true);
                                  }}
                                  className="w-full h-16 rounded-lg border-2 border-dashed border-[#FF7A00] text-[#FF7A00] flex items-center justify-center text-2xl hover:bg-orange-50 transition-colors"
                                  title={`Add schedule at ${formatTimeDisplay(pending.time)}`}
                                >+</button>
                              </td>
                            ))}
                          </tr>
                        ))}
                        {/* Add time slot row */}
                        <tr>
                          <td colSpan={activeDays.length + 1} className="pt-2 pb-1">
                            <button
                              onClick={addPendingGridTimeslot}
                              className="flex items-center gap-1 text-sm text-[#FF7A00] hover:text-orange-700 font-medium"
                            >
                              <span className="text-lg leading-none">+</span> Add time slot
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Inactive schedules collapsible */}
                {inactiveSchedules.length > 0 && (
                  <details className="mt-6 border-t pt-4">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Show {inactiveSchedules.length} inactive schedule{inactiveSchedules.length > 1 ? 's' : ''}
                    </summary>
                    <div className="mt-3 space-y-2">
                      {inactiveSchedules.map((schedule: any) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">{schedule.classType}</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-500">{schedule.dayName} {formatTimeDisplay(schedule.startTime)}</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-500">{schedule.coach}</span>
                          </div>
                          <button
                            onClick={() => handleToggleActive(schedule.id, false)}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Activate
                          </button>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })()}
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
                  onChange={(e) => {
                    if (e.target.value === '__new__') { openNewClassTypeModal('form'); }
                    else { setForm({ ...form, classTypeId: e.target.value }); }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                  disabled={isLoadingClassTypes}
                >
                  <option value="">{isLoadingClassTypes ? 'Loading...' : 'Select class type'}</option>
                  {Array.isArray(classTypesData) && classTypesData.map((ct: any) => (
                    <option key={ct.id} value={ct.id}>{ct.name} ({ct.durationMinutes} min)</option>
                  ))}
                  <option value="__new__">+ Create new class type...</option>
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
                      <option key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800" min="1" required />
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={closeCreateModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleCreate} disabled={processing} className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] disabled:opacity-50">
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
                  onChange={(e) => {
                    if (e.target.value === '__new__') { openNewClassTypeModal('form'); }
                    else { setForm({ ...form, classTypeId: e.target.value }); }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  required
                  disabled={isLoadingClassTypes}
                >
                  <option value="">{isLoadingClassTypes ? 'Loading...' : 'Select class type'}</option>
                  {Array.isArray(classTypesData) && classTypesData.map((ct: any) => (
                    <option key={ct.id} value={ct.id}>{ct.name} ({ct.durationMinutes} min)</option>
                  ))}
                  <option value="__new__">+ Create new class type...</option>
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
                      <option key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName}</option>
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
            <div className="space-y-4 mb-6 pb-4 border-b">
              <div className="grid grid-cols-3 gap-4">
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
              
              {/* Schedule Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'ongoing', icon: '🔁', title: 'Ongoing', sub: 'Repeats every month' },
                    { value: 'month-only', icon: '📆', title: 'This month only', sub: currentMonthLabel() },
                    { value: 'window', icon: '🗓️', title: 'Custom window', sub: 'Ramadan, Summer…' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBulkForm(f => ({ ...f, scheduleScope: opt.value as typeof f.scheduleScope }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all ${
                        bulkForm.scheduleScope === opt.value
                          ? 'border-[#FF7A00] bg-orange-50 text-[#FF7A00]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-xs font-semibold">{opt.title}</span>
                      <span className="text-[10px] text-gray-400 leading-tight">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Window date range */}
              {bulkForm.scheduleScope === 'window' && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-3">
                  {/* Name + quick presets */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Period name (optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bulkForm.windowName}
                        onChange={(e) => setBulkForm(f => ({ ...f, windowName: e.target.value }))}
                        placeholder="e.g. Ramadan, Summer…"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-800"
                      />
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-gray-500 self-center">Quick presets:</span>
                      <button type="button" onClick={applyRamadanPreset}
                        className="px-2 py-1 text-xs bg-white border border-orange-300 text-orange-700 rounded-full hover:bg-orange-50 font-medium">
                        🌙 Ramadan 2026
                      </button>
                      <button type="button" onClick={() => setBulkForm(f => ({ ...f, windowName: 'Summer', overrideStartDate: `${new Date().getFullYear()}-06-01`, overrideEndDate: `${new Date().getFullYear()}-08-31` }))}
                        className="px-2 py-1 text-xs bg-white border border-blue-200 text-blue-700 rounded-full hover:bg-blue-50 font-medium">
                        ☀️ Summer
                      </button>
                      <button type="button" onClick={applyThisMonthPreset}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 text-gray-600 rounded-full hover:bg-gray-50 font-medium">
                        📆 This month
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start date *</label>
                      <input type="date" value={bulkForm.overrideStartDate}
                        onChange={(e) => setBulkForm(f => ({ ...f, overrideStartDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End date *</label>
                      <input type="date" value={bulkForm.overrideEndDate}
                        onChange={(e) => setBulkForm(f => ({ ...f, overrideEndDate: e.target.value }))}
                        min={bulkForm.overrideStartDate}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-800" />
                    </div>
                  </div>
                  {bulkForm.overrideStartDate && bulkForm.overrideEndDate && (
                    <p className="text-xs text-orange-700">
                      Classes will be generated <strong>only</strong> between these dates, replacing the base schedule for this period.
                    </p>
                  )}
                </div>
              )}
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
                                if (e.target.value === '__new__') { openNewClassTypeModal(null); return; }
                                const selectedClassType = classTypesData?.find((ct: any) => ct.id.toString() === e.target.value);
                                updateGridCell(timeIndex, dayOfWeek, e.target.value, selectedClassType?.name || '');
                              }}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                              disabled={bulkProcessing}
                            >
                              <option value="">-</option>
                              {Array.isArray(classTypesData) && classTypesData.map((ct: any) => (
                                <option key={ct.id} value={ct.id}>{ct.name}</option>
                              ))}
                              <option value="__new__">+ New type...</option>
                            </select>
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
                  setBulkForm({ locationId: '', coachId: '', capacity: '20', scheduleScope: 'ongoing', windowName: '', overrideStartDate: '', overrideEndDate: '' });
                  setTimeSlots(['19:00', '20:00']);
                  setScheduleGrid({});
                  setShowConflictPreview(false);
                  setConflictPreview(null);
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
                {bulkProcessing ? 'Processing...' : `Import ${Object.keys(scheduleGrid).length} Schedule(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Preview Modal */}
      {showConflictPreview && conflictPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Conflict Detection</h2>
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">New Schedules: {conflictPreview.newSchedules}</div>
              </div>
              {conflictPreview.conflicts > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium text-yellow-900">Conflicts: {conflictPreview.conflicts}</div>
                  <div className="text-xs text-yellow-700 mt-1">Schedules with different class types at the same time</div>
                </div>
              )}
              {conflictPreview.updates > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900">Updates: {conflictPreview.updates}</div>
                  <div className="text-xs text-green-700 mt-1">Schedules with same class type (will update capacity)</div>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How should conflicts be handled?
              </label>
              <select
                value={conflictAction}
                onChange={(e) => setConflictAction(e.target.value as 'skip' | 'update' | 'cancel')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
              >
                <option value="skip">Skip conflicts (keep existing)</option>
                <option value="update">Update existing schedules</option>
                <option value="cancel">Cancel import</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowConflictPreview(false);
                  setConflictPreview(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { schedulesToCreate } = checkConflicts();
                  await executeBulkImport(schedulesToCreate, conflictAction);
                }}
                disabled={bulkProcessing || conflictAction === 'cancel'}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkProcessing ? 'Processing...' : conflictAction === 'cancel' ? 'Cancelled' : 'Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Move Confirmation Modal */}
      {pendingMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Move Schedule</h2>
            <p className="text-sm text-gray-500 mb-4">
              Moving <span className="font-semibold text-gray-800">{pendingMove.classType}</span> from{' '}
              <span className="font-medium">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][pendingMove.fromDay]} {formatTimeDisplay(pendingMove.fromTime)}</span>{' '}
              to{' '}
              <span className="font-medium text-[#FF7A00]">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][pendingMove.toDay]} {formatTimeDisplay(pendingMove.toTime)}</span>
            </p>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Apply this change to:</p>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: !moveApplyCurrentMonth ? '#FF7A00' : '#e5e7eb', background: !moveApplyCurrentMonth ? '#fff7f0' : '' }}>
                  <input type="radio" checked={!moveApplyCurrentMonth} onChange={() => setMoveApplyCurrentMonth(false)} className="mt-0.5 text-[#FF7A00]" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">Future months only</div>
                    <div className="text-xs text-gray-500">This month&apos;s classes stay as-is</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: moveApplyCurrentMonth ? '#FF7A00' : '#e5e7eb', background: moveApplyCurrentMonth ? '#fff7f0' : '' }}>
                  <input type="radio" checked={moveApplyCurrentMonth} onChange={() => setMoveApplyCurrentMonth(true)} className="mt-0.5 text-[#FF7A00]" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">This month + future months</div>
                    <div className="text-xs text-amber-600">Classes without bookings will be regenerated</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setPendingMove(null); setMoveApplyCurrentMonth(false); }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => executeMoveSchedule(moveApplyCurrentMonth)}
                disabled={movingSchedule}
                className="px-4 py-2 text-sm bg-[#FF7A00] text-white rounded-lg hover:bg-[#F57A00] disabled:opacity-50 font-medium"
              >
                {movingSchedule ? 'Moving...' : 'Confirm Move'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Class Type Modal */}
      {showNewClassTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">New Class Type</h2>
            <p className="text-sm text-gray-500 mb-4">This will be available in all schedule dropdowns immediately.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newClassTypeForm.name}
                  onChange={(e) => setNewClassTypeForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Kids Boxing"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                <input
                  type="number"
                  value={newClassTypeForm.durationMinutes}
                  onChange={(e) => setNewClassTypeForm(f => ({ ...f, durationMinutes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={newClassTypeForm.description}
                  onChange={(e) => setNewClassTypeForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => { setShowNewClassTypeModal(false); setNewClassTypeTarget(null); }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClassType}
                disabled={creatingClassType || !newClassTypeForm.name.trim()}
                className="px-4 py-2 text-sm bg-[#FF7A00] text-white rounded-lg hover:bg-[#F57A00] disabled:opacity-50 font-medium"
              >
                {creatingClassType ? 'Creating...' : 'Create & Select'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

