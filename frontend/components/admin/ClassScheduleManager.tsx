'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';
import Link from 'next/link';

interface ClassType {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
}

interface Coach {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
}

interface ClassInstance {
  id: number;
  classType: {
    id: number;
    name: string;
    description: string | null;
    duration: number;
  };
  location: {
    id: number;
    name: string;
    address: string;
    isActive: boolean;
  };
  coach: {
    id: number;
    name: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  capacity: number;
  bookingCount: number;
  availableSpots: number;
  isCancelled: boolean;
}

export default function ClassScheduleManager() {
  const [classes, setClasses] = useState<ClassInstance[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');
  const [classTypeFilter, setClassTypeFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  // Set default start date to today
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDateFilter, setStartDateFilter] = useState<string>(getTodayDateString());
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInstance | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    classTypeId: '',
    coachId: '',
    locationId: '',
    startTime: '',
    capacity: '20',
    isCancelled: false
  });
  
  // Recurring form state
  const [recurringForm, setRecurringForm] = useState({
    frequency: 'weekly',
    count: '4',
    endDate: ''
  });
  
  const [processing, setProcessing] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchInitialData().then(() => setIsInitialLoad(false));
  }, []);

  // Refetch classes when date filters change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad && !loading) {
      fetchClasses();
    }
  }, [startDateFilter, endDateFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchClasses(),
        fetchClassTypes(),
        fetchCoaches(),
        fetchLocations()
      ]);
    } catch (err: any) {
      setError('Failed to load data');
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const params = new URLSearchParams();
      if (startDateFilter) {
        params.append('startDate', startDateFilter);
      }
      if (endDateFilter) {
        params.append('endDate', endDateFilter);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/admin/classes?${queryString}` : '/admin/classes';
      const response = await apiClient.get(url);
      setClasses(response.data.data.classes);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      throw err;
    }
  };

  const fetchClassTypes = async () => {
    try {
      const response = await apiClient.get('/admin/class-types');
      setClassTypes(response.data.data.classTypes);
    } catch (err) {
      console.error('Error fetching class types:', err);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await apiClient.get('/admin/coaches');
      setCoaches(response.data.data.coaches);
    } catch (err) {
      console.error('Error fetching coaches:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get('/admin/locations');
      setLocations(response.data.data.locations.filter((loc: Location) => loc.isActive));
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleCreate = async (isRecurring: boolean = false) => {
    if (!form.classTypeId || !form.coachId || !form.locationId || !form.startTime || !form.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      const payload: any = {
        classTypeId: parseInt(form.classTypeId),
        coachId: parseInt(form.coachId),
        locationId: parseInt(form.locationId),
        startTime: new Date(form.startTime).toISOString(),
        capacity: parseInt(form.capacity)
      };

      if (isRecurring) {
        payload.recurring = {
          enabled: true,
          frequency: recurringForm.frequency,
          count: recurringForm.count ? parseInt(recurringForm.count) : undefined,
          endDate: recurringForm.endDate || undefined
        };
      }

      await apiClient.post('/admin/classes', payload);
      
      alert(isRecurring ? 'Recurring classes created successfully!' : 'Class created successfully!');
      setShowCreateModal(false);
      setShowRecurringModal(false);
      resetForm();
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create class');
      console.error('Error creating class:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedClass) return;
    
    if (!form.classTypeId || !form.coachId || !form.locationId || !form.startTime || !form.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.put(`/admin/classes/${selectedClass.id}`, {
        classTypeId: parseInt(form.classTypeId),
        coachId: parseInt(form.coachId),
        locationId: parseInt(form.locationId),
        startTime: new Date(form.startTime).toISOString(),
        capacity: parseInt(form.capacity),
        isCancelled: form.isCancelled
      });
      
      alert('Class updated successfully!');
      setShowEditModal(false);
      setSelectedClass(null);
      resetForm();
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update class');
      console.error('Error updating class:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;

    try {
      setProcessing(true);
      await apiClient.delete(`/admin/classes/${selectedClass.id}`);
      
      alert('Class deleted successfully! All bookings have been cancelled and credits refunded.');
      setShowDeleteModal(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete class');
      console.error('Error deleting class:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openRecurringModal = () => {
    if (!form.classTypeId || !form.coachId || !form.locationId || !form.startTime || !form.capacity) {
      alert('Please fill in all class details first');
      return;
    }
    setShowCreateModal(false);
    setShowRecurringModal(true);
  };

  const openEditModal = (classInstance: ClassInstance) => {
    setSelectedClass(classInstance);
    setForm({
      classTypeId: classInstance.classType.id.toString(),
      coachId: classInstance.coach.id.toString(),
      locationId: classInstance.location.id.toString(),
      startTime: new Date(classInstance.startTime).toISOString().slice(0, 16),
      capacity: classInstance.capacity.toString(),
      isCancelled: classInstance.isCancelled
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (classInstance: ClassInstance) => {
    setSelectedClass(classInstance);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setForm({
      classTypeId: '',
      coachId: '',
      locationId: '',
      startTime: '',
      capacity: '20',
      isCancelled: false
    });
    setRecurringForm({
      frequency: 'weekly',
      count: '4',
      endDate: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredClasses = classes.filter(classInstance => {
    // Location filter
    if (locationFilter !== 'all' && classInstance.location.id.toString() !== locationFilter) {
      return false;
    }
    
    // Coach filter
    if (coachFilter !== 'all' && classInstance.coach.id.toString() !== coachFilter) {
      return false;
    }
    
    // Class type filter
    if (classTypeFilter !== 'all' && classInstance.classType.id.toString() !== classTypeFilter) {
      return false;
    }
    
    // Day filter
    if (dayFilter !== 'all') {
      const classDate = new Date(classInstance.startTime);
      const classDay = classDate.getDay().toString(); // 0 = Sunday, 1 = Monday, etc.
      if (classDay !== dayFilter) {
        return false;
      }
    }
    
    // Month filter
    if (monthFilter !== 'all') {
      const classDate = new Date(classInstance.startTime);
      const classMonth = classDate.getMonth().toString(); // 0 = January, 1 = February, etc.
      if (classMonth !== monthFilter) {
        return false;
      }
    }
    
    // Date filter
    if (startDateFilter && endDateFilter) {
      const classDate = new Date(classInstance.startTime);
      const startFilterDate = new Date(startDateFilter);
      const endFilterDate = new Date(endDateFilter);
      
      // Set time to 00:00:00 for comparison
      classDate.setHours(0, 0, 0, 0);
      startFilterDate.setHours(0, 0, 0, 0);
      endFilterDate.setHours(0, 0, 0, 0);
      
      if (classDate < startFilterDate || classDate > endFilterDate) {
        return false;
      }
    } else if (startDateFilter) {
      // Only start date provided - show classes from this date forward
      const classDate = new Date(classInstance.startTime);
      const startFilterDate = new Date(startDateFilter);
      
      // Set time to 00:00:00 for comparison
      classDate.setHours(0, 0, 0, 0);
      startFilterDate.setHours(0, 0, 0, 0);
      
      if (classDate < startFilterDate) {
        return false;
      }
    } else if (endDateFilter) {
      // Only end date provided - show classes up to this date
      const classDate = new Date(classInstance.startTime);
      const endFilterDate = new Date(endDateFilter);
      
      // Set time to 00:00:00 for comparison
      classDate.setHours(0, 0, 0, 0);
      endFilterDate.setHours(0, 0, 0, 0);
      
      if (classDate > endFilterDate) {
        return false;
      }
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchInitialData}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Schedule Management</h2>
          <p className="text-gray-600 mt-1">{filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#FF7A00] hover:bg-[#F57A00] text-white rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Class
          </button>
          <button
            onClick={fetchClasses}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id.toString()}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coach</label>
            <select
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Coaches</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id.toString()}>
                  {coach.firstName} {coach.lastName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Type</label>
            <select
              value={classTypeFilter}
              onChange={(e) => setClassTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {classTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Days</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="0">Sunday</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Months</option>
              <option value="0">January</option>
              <option value="1">February</option>
              <option value="2">March</option>
              <option value="3">April</option>
              <option value="4">May</option>
              <option value="5">June</option>
              <option value="6">July</option>
              <option value="7">August</option>
              <option value="8">September</option>
              <option value="9">October</option>
              <option value="10">November</option>
              <option value="11">December</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setLocationFilter('all');
              setCoachFilter('all');
              setClassTypeFilter('all');
              setDayFilter('all');
              setMonthFilter('all');
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Classes List */}
      {filteredClasses.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-lg">No classes found</p>
          <p className="text-gray-500 text-sm mt-2">Create your first class to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map((classInstance) => (
                  <tr key={classInstance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{classInstance.classType.name}</div>
                      <div className="text-sm text-gray-500">{classInstance.classType.duration} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(classInstance.startTime)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{classInstance.coach.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{classInstance.location.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {classInstance.bookingCount} / {classInstance.capacity}
                      </div>
                      <div className="text-sm text-gray-500">
                        {classInstance.availableSpots} available
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {classInstance.isCancelled ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      ) : classInstance.availableSpots === 0 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Full
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link
                        href={`/admin/classes/${classInstance.id}/roster`}
                        className="text-[#FF7A00] hover:text-orange-900 font-medium"
                      >
                        View Class
                      </Link>
                      <button
                        onClick={() => openEditModal(classInstance)}
                        className="text-[#FF7A00] hover:text-orange-900 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(classInstance)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Class</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Type *</label>
                <select
                  value={form.classTypeId}
                  onChange={(e) => setForm({ ...form, classTypeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select class type</option>
                  {classTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coach *</label>
                <select
                  value={form.coachId}
                  onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select coach</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <select
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={openRecurringModal}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Recurring
              </button>
              <button
                onClick={() => handleCreate(false)}
                disabled={processing}
                className="flex-1 bg-[#FF7A00] hover:bg-[#F57A00] disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Class Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Recurring Classes</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
                <select
                  value={recurringForm.frequency}
                  onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Occurrences</label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={recurringForm.count}
                  onChange={(e) => setRecurringForm({ ...recurringForm, count: e.target.value, endDate: '' })}
                  placeholder="e.g., 4"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="text-center text-sm text-gray-500">OR</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={recurringForm.endDate}
                  onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value, count: '' })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  This will create multiple class instances based on your selected frequency.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRecurringModal(false);
                  setShowCreateModal(true);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleCreate(true)}
                disabled={processing || (!recurringForm.count && !recurringForm.endDate)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Creating...' : 'Create Recurring'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Class</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Type *</label>
                <select
                  value={form.classTypeId}
                  onChange={(e) => setForm({ ...form, classTypeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select class type</option>
                  {classTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coach *</label>
                <select
                  value={form.coachId}
                  onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select coach</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <select
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current bookings: {selectedClass.bookingCount}
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCancelled"
                  checked={form.isCancelled}
                  onChange={(e) => setForm({ ...form, isCancelled: e.target.checked })}
                  className="h-4 w-4 text-[#FF7A00] focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isCancelled" className="ml-2 block text-sm text-gray-700">
                  Mark as cancelled
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedClass(null);
                  resetForm();
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={processing}
                className="flex-1 bg-[#FF7A00] hover:bg-[#F57A00] disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Updating...' : 'Update Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Class</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this class? All bookings will be cancelled and credits will be refunded to members.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{selectedClass.classType.name}</p>
                <p className="text-gray-600">{formatDate(selectedClass.startTime)}</p>
                <p className="text-gray-600">Coach: {selectedClass.coach.name}</p>
                <p className="text-gray-600">Location: {selectedClass.location.name}</p>
                <p className="text-gray-600 font-medium mt-2">
                  {selectedClass.bookingCount} booking{selectedClass.bookingCount !== 1 ? 's' : ''} will be cancelled
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedClass(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Deleting...' : 'Delete Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
