'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';

interface LocationPrice {
  locationId: number;
  locationName: string;
  price: number;
  isActive: boolean;
}

interface Package {
  id: number;
  name: string;
  sessionCount: number;
  price: number;
  expiryDays: number;
  isActive: boolean;
  purchaseCount: number;
  locationPrices?: LocationPrice[];
  createdAt: string;
  updatedAt: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
}

export default function PackageManager() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showLocationPriceModal, setShowLocationPriceModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    sessionCount: '10',
    price: '100.00',
    expiryDays: '30',
    includeVat: false,
    isActive: true
  });

  // Location price form state
  const [locationPriceForm, setLocationPriceForm] = useState({
    price: '',
    includeVat: false,
    isActive: true
  });
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchLocations();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/admin/packages');
      setPackages(response.data.data.packages);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load packages');
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get('/admin/locations');
      setLocations(response.data.data.locations.filter((loc: Location) => loc.isActive));
    } catch (err: any) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.sessionCount || !form.price || !form.expiryDays) {
      alert('Please fill in all required fields');
      return;
    }

    const sessionCount = parseInt(form.sessionCount);
    const price = parseFloat(form.price);
    const expiryDays = parseInt(form.expiryDays);

    if (sessionCount < 1 || price <= 0 || expiryDays < 1) {
      alert('Please enter valid positive numbers for all fields');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.post('/admin/packages', {
        name: form.name.trim(),
        sessionCount,
        price,
        expiryDays,
        includeVat: form.includeVat
      });
      
      alert('Package created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchPackages();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create package');
      console.error('Error creating package:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPackage) return;
    
    if (!form.name.trim() || !form.sessionCount || !form.price || !form.expiryDays) {
      alert('Please fill in all required fields');
      return;
    }

    const sessionCount = parseInt(form.sessionCount);
    const price = parseFloat(form.price);
    const expiryDays = parseInt(form.expiryDays);

    if (sessionCount < 1 || price <= 0 || expiryDays < 1) {
      alert('Please enter valid positive numbers for all fields');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.put(`/admin/packages/${selectedPackage.id}`, {
        name: form.name.trim(),
        sessionCount,
        price,
        expiryDays,
        includeVat: form.includeVat,
        isActive: form.isActive
      });
      
      alert('Package updated successfully! Changes will only affect new purchases.');
      setShowEditModal(false);
      setSelectedPackage(null);
      resetForm();
      fetchPackages();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update package');
      console.error('Error updating package:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedPackage) return;

    try {
      setProcessing(true);
      await apiClient.delete(`/admin/packages/${selectedPackage.id}`);
      
      alert('Package deactivated successfully!');
      setShowDeactivateModal(false);
      setSelectedPackage(null);
      fetchPackages();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to deactivate package');
      console.error('Error deactivating package:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setForm({
      name: pkg.name,
      sessionCount: pkg.sessionCount.toString(),
      price: pkg.price.toString(),
      expiryDays: pkg.expiryDays.toString(),
      includeVat: (pkg as any).includeVat || false,
      isActive: pkg.isActive
    });
    setShowEditModal(true);
  };

  const openDeactivateModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowDeactivateModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      sessionCount: '10',
      price: '100.00',
      expiryDays: '30',
      includeVat: false,
      isActive: true
    });
  };

  const openLocationPriceModal = (pkg: Package, location: Location) => {
    setSelectedPackage(pkg);
    setSelectedLocation(location);
    const existingPrice = pkg.locationPrices?.find(lp => lp.locationId === location.id);
    setLocationPriceForm({
      price: existingPrice ? existingPrice.price.toString() : pkg.price.toString(),
      includeVat: existingPrice ? (existingPrice as any).includeVat || false : false,
      isActive: existingPrice ? existingPrice.isActive : true
    });
    setShowLocationPriceModal(true);
  };

  const handleSetLocationPrice = async () => {
    if (!selectedPackage || !selectedLocation) return;

    const price = parseFloat(locationPriceForm.price);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid positive price');
      return;
    }

    try {
      setProcessing(true);
      await apiClient.put(
        `/admin/packages/${selectedPackage.id}/location-prices/${selectedLocation.id}`,
        {
          price,
          includeVat: locationPriceForm.includeVat,
          isActive: locationPriceForm.isActive
        }
      );
      
      alert('Location price updated successfully!');
      setShowLocationPriceModal(false);
      setSelectedPackage(null);
      setSelectedLocation(null);
      fetchPackages();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update location price');
      console.error('Error updating location price:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveLocationPrice = async (pkg: Package, locationId: number) => {
    if (!confirm('Remove location-specific price? Package will use default price for this location.')) {
      return;
    }

    try {
      setProcessing(true);
      await apiClient.delete(`/admin/packages/${pkg.id}/location-prices/${locationId}`);
      alert('Location price removed successfully!');
      fetchPackages();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to remove location price');
      console.error('Error removing location price:', err);
    } finally {
      setProcessing(false);
    }
  };

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
          onClick={fetchPackages}
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
          <h2 className="text-2xl font-bold text-gray-900">Package Management</h2>
          <p className="text-gray-600 mt-1">{packages.length} package{packages.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Package
          </button>
          <button
            onClick={fetchPackages}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-600 text-lg">No packages found</p>
          <p className="text-gray-500 text-sm mt-2">Create your first package to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    pkg.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sessions:</span>
                  <span className="text-sm font-semibold text-gray-900">{pkg.sessionCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-sm font-semibold text-gray-900">EGP {typeof pkg.price === 'string' ? parseFloat(pkg.price).toFixed(2) : pkg.price.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expiry:</span>
                  <span className="text-sm font-semibold text-gray-900">{pkg.expiryDays} days</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Total Purchases:</span>
                  <span className="text-sm font-semibold text-blue-600">{pkg.purchaseCount}</span>
                </div>

                {/* Location Prices */}
                {pkg.locationPrices && pkg.locationPrices.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Location Prices:</div>
                    <div className="space-y-1">
                      {pkg.locationPrices.map((lp) => (
                        <div key={lp.locationId} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{lp.locationName}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">EGP {typeof lp.price === 'string' ? parseFloat(lp.price).toFixed(2) : lp.price.toFixed(2)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const location = locations.find(l => l.id === lp.locationId);
                                if (location) {
                                  openLocationPriceModal(pkg, location);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLocationPrice(pkg, lp.locationId);
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(pkg)}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeactivateModal(pkg)}
                    disabled={!pkg.isActive}
                    className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deactivate
                  </button>
                </div>
                <button
                  onClick={() => {
                    // Show location selection modal or directly open first location
                    if (locations.length > 0) {
                      openLocationPriceModal(pkg, locations[0]);
                    }
                  }}
                  className="w-full px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Manage Location Prices
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Package</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., 10 Session Package"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Sessions *</label>
                <input
                  type="number"
                  min="1"
                  value={form.sessionCount}
                  onChange={(e) => setForm({ ...form, sessionCount: e.target.value })}
                  placeholder="10"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (EGP) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="100.00"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry (days) *</label>
                <input
                  type="number"
                  min="1"
                  value={form.expiryDays}
                  onChange={(e) => setForm({ ...form, expiryDays: e.target.value })}
                  placeholder="30"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Number of days until credits expire after purchase</p>
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Creating...' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Package</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                Changes will only affect new purchases. Existing member packages will not be modified.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., 10 Session Package"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Sessions *</label>
                <input
                  type="number"
                  min="1"
                  value={form.sessionCount}
                  onChange={(e) => setForm({ ...form, sessionCount: e.target.value })}
                  placeholder="10"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (EGP) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="100.00"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry (days) *</label>
                <input
                  type="number"
                  min="1"
                  value={form.expiryDays}
                  onChange={(e) => setForm({ ...form, expiryDays: e.target.value })}
                  placeholder="30"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Number of days until credits expire after purchase</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeVat"
                  checked={form.includeVat}
                  onChange={(e) => setForm({ ...form, includeVat: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includeVat" className="ml-2 block text-sm text-gray-700">
                  Include VAT (14%) - Default for all locations
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active (visible to members)
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPackage(null);
                  resetForm();
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={processing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Updating...' : 'Update Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deactivate Package</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to deactivate this package? It will no longer be available for purchase by members. Existing member packages will not be affected.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm space-y-2">
                <p className="font-medium text-gray-900">{selectedPackage.name}</p>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sessions:</span>
                  <span className="font-medium">{selectedPackage.sessionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">EGP {typeof selectedPackage.price === 'string' ? parseFloat(selectedPackage.price).toFixed(2) : selectedPackage.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Purchases:</span>
                  <span className="font-medium text-blue-600">{selectedPackage.purchaseCount}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setSelectedPackage(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Price Modal */}
      {showLocationPriceModal && selectedPackage && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Set Price for Location
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Package: <span className="font-semibold">{selectedPackage.name}</span>
            </p>
            
            <div className="space-y-4">
              {/* Location Selector */}
              {locations.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Location *
                  </label>
                  <select
                    value={selectedLocation.id}
                    onChange={(e) => {
                      const newLocation = locations.find(l => l.id === parseInt(e.target.value));
                      if (newLocation) {
                        openLocationPriceModal(selectedPackage, newLocation);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (EGP) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={locationPriceForm.price}
                  onChange={(e) => setLocationPriceForm({ ...locationPriceForm, price: e.target.value })}
                  placeholder={selectedPackage.price.toString()}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default price: EGP {typeof selectedPackage.price === 'string' ? parseFloat(selectedPackage.price).toFixed(2) : selectedPackage.price.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="locationPriceIncludeVat"
                  checked={locationPriceForm.includeVat}
                  onChange={(e) => setLocationPriceForm({ ...locationPriceForm, includeVat: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="locationPriceIncludeVat" className="ml-2 block text-sm text-gray-700">
                  Include VAT (14%)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="locationPriceActive"
                  checked={locationPriceForm.isActive}
                  onChange={(e) => setLocationPriceForm({ ...locationPriceForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="locationPriceActive" className="ml-2 block text-sm text-gray-700">
                  Active (visible to members)
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowLocationPriceModal(false);
                  setSelectedPackage(null);
                  setSelectedLocation(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetLocationPrice}
                disabled={processing}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processing ? 'Saving...' : 'Save Price'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
