'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from '@/lib/axios';

interface Coach {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
  address?: string;
}

interface ClassInstance {
  id: number;
  classType: string;
  description?: string | null;
  duration: number;
  startTime: string;
  endTime: string;
  coach: Coach;
  location: Location;
  capacity: number;
  bookedCount: number;
  availableSpots: number;
  isFull?: boolean;
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classInstance: ClassInstance;
  onBookingSuccess?: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  classInstance,
  onBookingSuccess,
}: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedBookingFor, setSelectedBookingFor] = useState<'self' | number>('self');
  const [loadingData, setLoadingData] = useState(true);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Fetch user's credits and children when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserData();
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    setLoadingData(true);
    try {
      // Fetch credits and children in parallel
      // /members/credits is a lightweight endpoint; falls back to /members/dashboard
      const [creditsResponse, childrenResponse] = await Promise.all([
        axios.get('/members/credits').catch(() => axios.get('/members/dashboard')),
        axios.get('/members/children'),
      ]);
      // Handle both /members/credits and /members/dashboard response shapes
      if (creditsResponse.data.success) {
        const total = creditsResponse.data.data?.total ?? creditsResponse.data.data?.credits?.total;
        if (total !== undefined) setCredits(total);
      }
      if (childrenResponse.data.success) {
        setChildren(childrenResponse.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError('Failed to load booking information');
    } finally {
      setLoadingData(false);
    }
  };

  const handleBooking = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        classInstanceId: classInstance.id,
      };

      // Add childId if booking for a child
      if (selectedBookingFor !== 'self') {
        payload.childId = selectedBookingFor;
      }

      const response = await axios.post('/members/bookings', payload);

      if (response.data.success) {
        const newBookingId = response.data.data.bookingId;
        setBookingId(newBookingId);
        setSuccess(true);
        // Update credits display
        if (credits !== null) {
          setCredits(credits - 1);
        }
        
        // Generate QR code immediately after booking
        if (newBookingId) {
          generateQRCode(newBookingId);
        }
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to book class. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async (bookingId: number) => {
    setQrLoading(true);
    try {
      const response = await axios.post(`/qr/generate/${bookingId}`);
      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
      }
    } catch (err: any) {
      console.error('Error generating QR code:', err);
      // Don't show error to user, QR code can be generated later from dashboard
    } finally {
      setQrLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !qrLoading) {
      setQrCode(null);
      setBookingId(null);
      onBookingSuccess?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  const startTime = new Date(classInstance.startTime);
  const endTime = new Date(classInstance.endTime);

  const getBookingForName = () => {
    if (selectedBookingFor === 'self') return 'Yourself';
    const child = children.find(c => c.id === selectedBookingFor);
    return child ? `${child.firstName} ${child.lastName}` : 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF7A00] to-[#F57A00] px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Book Class</h2>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]"></div>
              </div>
            ) : success ? (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-600 mb-4">Your class has been booked successfully.</p>
                
                {/* QR Code Display */}
                {qrLoading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00] mb-2"></div>
                    <p className="text-sm text-gray-600">Generating QR code...</p>
                  </div>
                ) : qrCode ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Your Check-in QR Code:</p>
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48 border-2 border-gray-300 rounded-lg p-2 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-2">Show this QR code at check-in</p>
                  </div>
                ) : null}
                
                <button
                  onClick={handleClose}
                  className="mt-6 px-6 py-2 bg-[#FF7A00] text-white rounded-lg hover:bg-[#F57A00] transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Class Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{classInstance.classType}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">{format(startTime, 'EEEE, MMMM d, yyyy')}</p>
                        <p className="text-gray-600">{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">{classInstance.location.name}</p>
                        {classInstance.location.address && (
                          <p className="text-gray-600 text-xs">{classInstance.location.address}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-gray-900">Coach: {classInstance.coach.name}</p>
                    </div>
                  </div>
                </div>

                {/* Credit Balance */}
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Available Credits</p>
                      <p className="text-2xl font-bold text-[#FF7A00]">{credits ?? '...'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cost</p>
                      <p className="text-2xl font-bold text-gray-900">1</p>
                    </div>
                  </div>
                  {credits !== null && credits < 1 && (
                    <p className="text-sm text-red-600 mt-2">⚠️ Insufficient credits</p>
                  )}
                </div>

                {/* Booking For Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book this class for:
                  </label>
                  <select
                    value={selectedBookingFor}
                    onChange={(e) => setSelectedBookingFor(e.target.value === 'self' ? 'self' : parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent"
                    disabled={isLoading}
                  >
                    <option value="self">Yourself</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.firstName} {child.lastName} (Age {child.age})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Confirmation Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">You are booking:</p>
                  <p className="font-semibold text-gray-900">{classInstance.classType}</p>
                  <p className="text-sm text-gray-600 mt-2">For: <span className="font-medium text-gray-900">{getBookingForName()}</span></p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={isLoading || credits === null || credits < 1}
                    className="flex-1 px-4 py-3 bg-[#FF7A00] text-white rounded-lg hover:bg-[#F57A00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold touch-target"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Booking...
                      </span>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
