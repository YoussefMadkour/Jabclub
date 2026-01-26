'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  createdAt: string;
  upcomingBookingsCount: number;
}

interface ChildFormData {
  firstName: string;
  lastName: string;
  age: string;
}

export default function ChildrenManager() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState<ChildFormData>({
    firstName: '',
    lastName: '',
    age: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/members/children');
      if (response.data.success) {
        setChildren(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching children:', err);
      setError('Failed to load children profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({ firstName: '', lastName: '', age: '' });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleEditClick = (child: Child) => {
    setSelectedChild(child);
    setFormData({
      firstName: child.firstName,
      lastName: child.lastName,
      age: child.age.toString()
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (child: Child) => {
    setSelectedChild(child);
    setIsDeleteModalOpen(true);
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setFormError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setFormError('Last name is required');
      return false;
    }
    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 1 || age > 100) {
      setFormError('Please enter a valid age between 1 and 100');
      return false;
    }
    return true;
  };

  const handleAddSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await apiClient.post('/members/children', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        age: parseInt(formData.age)
      });

      if (response.data.success) {
        await fetchChildren();
        setIsAddModalOpen(false);
        setFormData({ firstName: '', lastName: '', age: '' });
      }
    } catch (err: any) {
      console.error('Error creating child:', err);
      setFormError(err.response?.data?.error?.message || 'Failed to create child profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedChild || !validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await apiClient.put(`/members/children/${selectedChild.id}`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        age: parseInt(formData.age)
      });

      if (response.data.success) {
        await fetchChildren();
        setIsEditModalOpen(false);
        setSelectedChild(null);
        setFormData({ firstName: '', lastName: '', age: '' });
      }
    } catch (err: any) {
      console.error('Error updating child:', err);
      setFormError(err.response?.data?.error?.message || 'Failed to update child profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedChild) return;

    setIsSubmitting(true);

    try {
      const response = await apiClient.delete(`/members/children/${selectedChild.id}`);

      if (response.data.success) {
        await fetchChildren();
        setIsDeleteModalOpen(false);
        setSelectedChild(null);
      }
    } catch (err: any) {
      console.error('Error deleting child:', err);
      setFormError(err.response?.data?.error?.message || 'Failed to delete child profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading children profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchChildren}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Children Profiles</h2>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Child
          </button>
        </div>

        {children.length > 0 ? (
          <div className="space-y-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">Age {child.age}</p>
                      </div>
                    </div>
                    
                    {child.upcomingBookingsCount > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                          {child.upcomingBookingsCount} upcoming {child.upcomingBookingsCount === 1 ? 'class' : 'classes'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(child)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(child)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <span className="text-6xl">👨‍👩‍👧‍👦</span>
            </div>
            <p className="text-gray-600 mb-4">No children profiles yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Add children profiles to book classes for your family members
            </p>
            <button
              onClick={handleAddClick}
              className="px-6 py-3 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] transition-colors"
            >
              Add Your First Child
            </button>
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => !isSubmitting && setIsAddModalOpen(false)}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-[#FF7A00] to-[#F57A00] px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Add Child Profile</h2>
                  <button
                    onClick={() => !isSubmitting && setIsAddModalOpen(false)}
                    disabled={isSubmitting}
                    className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter age"
                      min="1"
                      max="100"
                      disabled={isSubmitting}
                    />
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{formError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddSubmit}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-[#FF7A00] text-white rounded-lg hover:bg-[#F57A00] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Child'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Child Modal */}
      {isEditModalOpen && selectedChild && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => !isSubmitting && setIsEditModalOpen(false)}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-[#FF7A00] to-[#F57A00] px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Edit Child Profile</h2>
                  <button
                    onClick={() => !isSubmitting && setIsEditModalOpen(false)}
                    disabled={isSubmitting}
                    className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter age"
                      min="1"
                      max="100"
                      disabled={isSubmitting}
                    />
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{formError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-[#FF7A00] text-white rounded-lg hover:bg-[#F57A00] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedChild && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Delete Child Profile</h2>
                  <button
                    onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}
                    disabled={isSubmitting}
                    className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                    Are you sure?
                  </h3>
                  <p className="text-sm text-gray-600 text-center mb-4">
                    You are about to delete the profile for <strong>{selectedChild.firstName} {selectedChild.lastName}</strong>.
                  </p>
                  
                  {selectedChild.upcomingBookingsCount > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ This child has <strong>{selectedChild.upcomingBookingsCount}</strong> upcoming {selectedChild.upcomingBookingsCount === 1 ? 'booking' : 'bookings'}. 
                        All future bookings will be cancelled and credits will be refunded.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 text-center">
                    This action cannot be undone.
                  </p>
                </div>

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{formError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
