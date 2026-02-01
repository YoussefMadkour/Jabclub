'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';

interface Location {
  id: number;
  name: string;
  address: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    address: '',
    capacity: '20',
    isActive: true
  });
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/admin/locations');
      setLocations(response.data.data.locations);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load locations');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.post('/admin/locations', {
        name: form.name.trim(),
        address: form.address.trim(),
        capacity: parseInt(form.capacity)
      });
      
      alert('Location created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchLocations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create location');
      console.error('Error creating location:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLocation) return;
    
    if (!form.name.trim() || !form.address.trim() || !form.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.put(`/admin/locations/${selectedLocation.id}`, {
        name: form.name.trim(),
        address: form.address.trim(),
        capacity: parseInt(form.capacity),
        isActive: form.isActive
      });
      
      alert('Location updated successfully!');
      setShowEditModal(false);
      setSelectedLocation(null);
      resetForm();
      fetchLocations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update location');
      console.error('Error updating location:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;

    try {
      setProcessing(true);
      const response = await apiClient.delete(`/admin/locations/${selectedLocation.id}`);
      
      const message = response.data?.data?.message || 'Location deactivated successfully!';
      const details = response.data?.data?.details;
      
      let successMessage = message;
      if (details) {
        if (details.cancelledClasses > 0) {
          successMessage += `\n\n• ${details.cancelledClasses} future class(es) cancelled`;
        }
        if (details.refundedCredits > 0) {
          successMessage += `\n• ${details.refundedCredits} credit(s) refunded to members`;
        }
      }
      
      alert(successMessage);
      setShowDeleteModal(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to deactivate location');
      console.error('Error deleting location:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (location: Location) => {
    setSelectedLocation(location);
    setForm({
      name: location.name,
      address: location.address,
      capacity: location.capacity.toString(),
      isActive: location.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (location: Location) => {
    setSelectedLocation(location);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      address: '',
      capacity: '20',
      isActive: true
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchLocations}
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
          <h2 className="text-2xl font-bold text-gray-900">Location Management</h2>
          <p className="text-gray-600 mt-1">{locations.length} location{locations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#FF7A00] hover:bg-[#F57A00] text-white rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Location
          </button>
          <button
            onClick={fetchLocations}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600 text-lg">No locations found</p>
          <p className="text-gray-500 text-sm mt-2">Create your first location to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    location.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {location.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-600">{location.address}</p>
                </div>

                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-gray-600">Capacity: {location.capacity}</p>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(location)}
                  className="flex-1 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(location)}
                  disabled={!location.isActive}
                  className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Location Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Location</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Downtown Gym"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address"
                  rows={3}
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
                  placeholder="Maximum capacity"
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
                onClick={handleCreate}
                disabled={processing}
                className="flex-1 bg-[#FF7A00] hover:bg-[#F57A00] disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Creating...' : 'Create Location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {showEditModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Location</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Downtown Gym"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address"
                  rows={3}
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
                  placeholder="Maximum capacity"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 text-[#FF7A00] focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedLocation(null);
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
                {processing ? 'Updating...' : 'Update Location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deactivate Location</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to deactivate this location? This will:
            </p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
              <li>Cancel all future classes scheduled at this location</li>
              <li>Automatically refund credits to members who had bookings</li>
              <li>Deactivate all class schedules for this location</li>
              <li>Make the location unavailable for new class scheduling</li>
            </ul>
            <p className="text-sm font-medium text-orange-600 mb-4">
              ⚠️ This action cannot be undone.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{selectedLocation.name}</p>
                <p className="text-gray-600">{selectedLocation.address}</p>
                <p className="text-gray-600">Capacity: {selectedLocation.capacity}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedLocation(null);
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
                {processing ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
