'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import { useRouter } from 'next/navigation';
import CancellationModal from '@/components/classes/CancellationModal';
import QRCodeModal from '@/components/dashboard/QRCodeModal';
import apiClient from '@/lib/axios';

export default function MemberDashboard() {
  const { data, isLoading, error, refetch } = useDashboard();
  const router = useRouter();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrLoadingBookingId, setQrLoadingBookingId] = useState<number | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;

    try {
      await apiClient.delete(`/members/bookings/${selectedBooking.id}`);
      // Refetch dashboard data to update the UI
      await refetch();
      setIsCancelModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleGenerateQRCode = async (bookingId: number) => {
    setQrLoading(true);
    setQrLoadingBookingId(bookingId);
    setQrError(null);

    try {
      const response = await apiClient.post(`/qr/generate/${bookingId}`);
      setQrData(response.data);
      setIsQRModalOpen(true);
    } catch (error: any) {
      setQrError(error.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setQrLoading(false);
      setQrLoadingBookingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { credits, expiredPackages, nextExpiringPackage, upcomingBookings, pastBookings } = data;

  return (
    <div className="space-y-6">
      {/* Credits Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Session Credits</h2>
          <button
            onClick={() => router.push('/payments')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            View Payment History
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Available Credits</p>
            <p className="text-4xl font-bold text-[#FF7A00]">{credits.total}</p>
          </div>
          
          {/* Visual indicator */}
          <div className="flex items-center space-x-2">
            {credits.total === 0 ? (
              <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                No Credits
              </span>
            ) : credits.total < 5 ? (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Low Credits
              </span>
            ) : (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Next Expiring Package Alert */}
        {nextExpiringPackage && (
          <div className={`p-4 rounded-lg mb-4 ${
            nextExpiringPackage.daysUntilExpiry <= 7 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`font-medium ${
                  nextExpiringPackage.daysUntilExpiry <= 7 ? 'text-red-800' : 'text-orange-800'
                }`}>
                  {nextExpiringPackage.daysUntilExpiry <= 7 ? '⚠️ Expiring Soon' : 'ℹ️ Next Expiry'}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  {nextExpiringPackage.packageName} - {nextExpiringPackage.sessionsRemaining} credits remaining
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  nextExpiringPackage.daysUntilExpiry <= 7 ? 'text-red-600' : 'text-[#FF7A00]'
                }`}>
                  {nextExpiringPackage.daysUntilExpiry} days
                </p>
                <p className="text-xs text-gray-600">
                  {format(new Date(nextExpiringPackage.expiryDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Package Details */}
        {credits.packages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active Packages</h3>
            {credits.packages.map((pkg: any) => {
              const isExpiringSoon = pkg.daysUntilExpiry <= 7;
              const progressColor = isExpiringSoon ? 'bg-red-600' : 'bg-[#FF7A00]';
              
              return (
                <div 
                  key={pkg.id} 
                  className={`border rounded-lg p-4 ${
                    isExpiringSoon ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{pkg.packageName}</p>
                        {isExpiringSoon && (
                          <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full font-medium">
                            ⚠️ Expiring Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Purchased {format(new Date(pkg.purchaseDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {pkg.sessionsRemaining}/{pkg.sessionsTotal}
                      </p>
                      <p className="text-xs text-gray-600">sessions left</p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`${progressColor} h-2 rounded-full transition-all`}
                      style={{ width: `${(pkg.sessionsRemaining / pkg.sessionsTotal) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className={isExpiringSoon ? 'text-red-700 font-medium' : 'text-gray-600'}>
                      {pkg.daysUntilExpiry === 0 
                        ? 'Expires today!' 
                        : pkg.daysUntilExpiry === 1 
                        ? 'Expires tomorrow' 
                        : `Expires in ${pkg.daysUntilExpiry} days`}
                    </span>
                    <span className={isExpiringSoon ? 'text-red-700' : 'text-gray-600'}>
                      {format(new Date(pkg.expiryDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expired Packages */}
        {expiredPackages && expiredPackages.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Expired Packages</h3>
            {expiredPackages.map((pkg: any) => (
              <div key={pkg.id} className="border border-gray-300 rounded-lg p-4 bg-gray-100 opacity-75">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-700">{pkg.packageName}</p>
                      <span className="px-2 py-0.5 bg-gray-400 text-gray-800 text-xs rounded-full font-medium">
                        Expired
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Purchased {format(new Date(pkg.purchaseDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-600 line-through">
                      {pkg.sessionsRemaining}/{pkg.sessionsTotal}
                    </p>
                    <p className="text-xs text-gray-500">credits lost</p>
                  </div>
                </div>
                
                {/* Progress bar (grayed out) */}
                <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: `${(pkg.sessionsRemaining / pkg.sessionsTotal) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    Expired {pkg.daysExpired === 0 
                      ? 'today' 
                      : pkg.daysExpired === 1 
                      ? 'yesterday' 
                      : `${pkg.daysExpired} days ago`}
                  </span>
                  <span>{format(new Date(pkg.expiryDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {credits.packages.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">No active packages</p>
            <button 
              onClick={() => router.push('/purchase')}
              className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] transition-colors touch-target"
            >
              Purchase Package
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Classes</h2>
        
        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => {
              const classStartTime = new Date(booking.startTime);
              const cancellationDeadline = new Date(classStartTime.getTime() - 60 * 60 * 1000);
              const hoursUntilClass = differenceInHours(classStartTime, new Date());
              const canCancel = hoursUntilClass >= 1;

              return (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{booking.classType}</h3>
                        {booking.isChildBooking && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {booking.bookedFor}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <span className="font-medium">📅</span>
                          {format(new Date(booking.startTime), 'EEEE, MMMM dd, yyyy')}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">🕐</span>
                          {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                          {booking.duration && ` (${booking.duration} min)`}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">📍</span>
                          {booking.location}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">👤</span>
                          Coach: {booking.coach}
                        </p>
                        <p className={`flex items-center gap-2 text-xs ${canCancel ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="font-medium">⏰</span>
                          {canCancel 
                            ? `Cancel by ${format(cancellationDeadline, 'MMM dd, h:mm a')}`
                            : 'Cancellation deadline passed'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 sm:items-end">
                      <span className="text-xs text-gray-500">
                        Booked {formatDistanceToNow(new Date(booking.bookedAt || booking.startTime), { addSuffix: true })}
                      </span>
                      
                      {/* Get QR Code Button - Always show for upcoming classes */}
                      <button
                        onClick={() => handleGenerateQRCode(booking.id)}
                        disabled={qrLoading && qrLoadingBookingId === booking.id}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                        title="Get your check-in QR code for this class"
                      >
                        {qrLoading && qrLoadingBookingId === booking.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 0 4 4 0 00-4 4 0 004zm0 8a8 8 0 01-16 0 4 4 0 014 4 4 01 8 0 00-4-4 4-014z"></path>
                            </svg>
                            Loading...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m4 0h4m-4 0h4m-9-7V9a2 2 0 012-2h10a2 2 0 012 2v9m-6 0h6" />
                            </svg>
                            Get QR Code
                          </span>
                        )}
                      </button>
                      
                      {/* Cancel Booking Button */}
                      <button 
                        onClick={() => handleCancelClick(booking)}
                        disabled={!canCancel}
                        className={`px-4 py-2 rounded-md transition-colors text-sm touch-target ${
                          canCancel 
                            ? 'bg-red-600 text-white hover:bg-red-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={!canCancel ? 'Cannot cancel within 1 hour of class start' : 'Cancel this booking'}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">No upcoming bookings</p>
            <button 
              onClick={() => router.push('/classes')}
              className="px-4 py-2 bg-[#FF7A00] text-white rounded-md hover:bg-[#F57A00] transition-colors touch-target"
            >
              Browse Classes
            </button>
          </div>
        )}
      </div>

      {/* Past Bookings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Classes</h2>
        
        {pastBookings.length > 0 ? (
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{booking.classType}</h3>
                      {booking.isChildBooking && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {booking.bookedFor}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        {format(new Date(booking.startTime), 'MMM dd, yyyy')} at {format(new Date(booking.startTime), 'h:mm a')}
                      </p>
                      <p>{booking.location} • Coach: {booking.coach}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {booking.status === 'attended' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                        ✓ Attended
                      </span>
                    )}
                    {booking.status === 'no_show' && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                        ✗ No Show
                      </span>
                    )}
                    {booking.status === 'cancelled' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium">
                        Cancelled
                      </span>
                    )}
                    {booking.status === 'confirmed' && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No past bookings</p>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {selectedBooking && (
        <CancellationModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setSelectedBooking(null);
          }}
          onConfirm={handleCancelConfirm}
          booking={selectedBooking}
        />
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        qrData={qrData?.qrCode}
        classInfo={qrData?.classInfo}
        isLoading={qrLoading}
        error={qrError}
      />
    </div>
  );
}
