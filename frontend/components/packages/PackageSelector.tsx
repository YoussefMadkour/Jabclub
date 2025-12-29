'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';

interface Location {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
}

interface SessionPackage {
  id: number;
  name: string;
  sessionCount: number;
  price: number;
  defaultPrice: number;
  priceType?: 'default' | 'location' | 'member';
  isRenewal?: boolean;
  hasSpecialRenewalPrices?: boolean;
  expiryDays: number;
  locationPrices?: Array<{
    locationId: number;
    locationName: string;
    price: number;
  }>;
  memberPrice?: number | null;
}

interface PackageSelectorProps {
  onSelectPackage: (packageId: number, packageName: string, packagePrice: number, locationId: number) => void;
}

export default function PackageSelector({ onSelectPackage }: PackageSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      fetchPackages(selectedLocationId);
    }
  }, [selectedLocationId]);

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get('/members/locations');
      setLocations(response.data.data);
      
      // Auto-select first location if available
      if (response.data.data.length > 0) {
        setSelectedLocationId(response.data.data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching locations:', err);
    }
  };

  const fetchPackages = async (locationId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/members/packages?locationId=${locationId}`);
      setPackages(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load packages');
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
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

  if (locations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No locations available at the moment.</p>
      </div>
    );
  }

  if (!selectedLocationId) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">Please select a location to view packages.</p>
      </div>
    );
  }

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  if (packages.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        {/* Location Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Location
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No packages available for {selectedLocation?.name} at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
      <h2 className="text-2xl font-bold text-gray-900">Choose a Session Package</h2>
        <p className="text-gray-600">Select a location and package to purchase session credits</p>
      </div>

      {/* Location Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Location
        </label>
        <select
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        {selectedLocation && (
          <p className="text-xs text-gray-500 mt-1">{selectedLocation.address}</p>
        )}
      </div>
      
      {/* Renewal Notice - Only show if member actually has special renewal prices set */}
      {packages.length > 0 && packages[0]?.hasSpecialRenewalPrices && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-purple-900">Special Renewal Pricing Available</p>
              <p className="text-xs text-purple-700 mt-1">
                You have special renewal prices set for you. These discounted prices will apply when you renew your packages.
              </p>
            </div>
          </div>
        </div>
      )}

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {packages.map((pkg) => {
          const displayPrice = typeof pkg.price === 'string' ? parseFloat(pkg.price) : pkg.price;
          const defaultPriceNum = typeof pkg.defaultPrice === 'string' ? parseFloat(pkg.defaultPrice) : pkg.defaultPrice;
          // Only show discount if prices are actually different (with small tolerance for floating point)
          const hasCustomPrice = Math.abs(defaultPriceNum - displayPrice) > 0.01;
          const isMemberPrice = pkg.priceType === 'member';
          
          // Check if VAT is included for this package/location
          const includeVat = pkg.includeVat || (pkg.locationPrices?.find(lp => lp.locationId === selectedLocationId)?.includeVat || false);
          const subtotal = displayPrice;
          const vatAmount = includeVat ? subtotal * 0.14 : 0;
          const totalAmount = subtotal + vatAmount;
          
          return (
          <div
            key={pkg.id}
              className={`bg-white border-2 rounded-lg p-6 hover:shadow-lg transition-all duration-200 ${
                isMemberPrice 
                  ? 'border-purple-300 hover:border-purple-500' 
                  : 'border-gray-200 hover:border-blue-500'
              }`}
          >
            <div className="text-center">
                {isMemberPrice && (
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      Renewal Price
                    </span>
                  </div>
                )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              
              <div className="my-4">
                  <div className={`text-4xl font-bold ${isMemberPrice ? 'text-purple-600' : 'text-blue-600'}`}>
                    EGP {totalAmount.toFixed(2)}
                  </div>
                  {includeVat && (
                    <div className="text-sm text-gray-500 mt-1">
                      (Subtotal: EGP {subtotal.toFixed(2)} + VAT: EGP {vatAmount.toFixed(2)})
                    </div>
                  )}
                  {hasCustomPrice && (
                    <div className="text-sm text-gray-500 mt-1 line-through">
                      EGP {typeof pkg.defaultPrice === 'string' ? parseFloat(pkg.defaultPrice).toFixed(2) : pkg.defaultPrice.toFixed(2)}
                </div>
                  )}
                  {isMemberPrice && (
                    <div className="text-xs text-purple-600 mt-1 font-medium">
                      Special renewal price
                    </div>
                  )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{pkg.sessionCount} Sessions</span>
                </div>
                
                <div className="flex items-center justify-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Valid for {pkg.expiryDays} days</span>
                </div>

                <div className="text-sm text-gray-500 mt-2">
                    EGP {(displayPrice / pkg.sessionCount).toFixed(2)} per session
                  </div>
                </div>

              <button
                  onClick={() => onSelectPackage(pkg.id, pkg.name, displayPrice, selectedLocationId!)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Select Package
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
