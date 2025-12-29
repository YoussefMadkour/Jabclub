'use client';

import { useState } from 'react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  booking: {
    id: number;
    classType: string;
    startTime: string;
    location: string;
    coach: string;
    bookedFor?: string;
  };
}

export default function CancellationModal({
  isOpen,
  onClose,
  onConfirm,
  booking
}: CancellationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate time until class start
  const now = new Date();
  const classStartTime = new Date(booking.startTime);
  const minutesUntilClass = differenceInMinutes(classStartTime, now);
  const hoursUntilClass = differenceInHours(classStartTime, now);
  
  // Check if within 1-hour cancellation window
  const withinCancellationWindow = minutesUntilClass < 60;
  const cancellationDeadline = new Date(classStartTime.getTime() - 60 * 60 * 1000);

  const handleConfirm = async () => {
    if (withinCancellationWindow) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {withinCancellationWindow ? 'Cannot Cancel Booking' : 'Cancel Booking'}
            </h3>
          </div>

          {/* Class Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">{booking.classType}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <span>📅</span>
                {format(classStartTime, 'EEEE, MMMM dd, yyyy')}
              </p>
              <p className="flex items-center gap-2">
                <span>🕐</span>
                {format(classStartTime, 'h:mm a')}
              </p>
              <p className="flex items-center gap-2">
                <span>📍</span>
                {booking.location}
              </p>
              <p className="flex items-center gap-2">
                <span>👤</span>
                Coach: {booking.coach}
              </p>
              {booking.bookedFor && (
                <p className="flex items-center gap-2">
                  <span>👥</span>
                  Booked for: {booking.bookedFor}
                </p>
              )}
            </div>
          </div>

          {/* Cancellation Window Info */}
          {withinCancellationWindow ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-red-800 mb-1">
                    Cancellation Not Allowed
                  </p>
                  <p className="text-sm text-red-700">
                    Cancellations must be made at least 1 hour before the class start time.
                    This class starts in {minutesUntilClass} minutes.
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    Cancellation deadline was: {format(cancellationDeadline, 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <p className="font-semibold text-blue-800 mb-1">
                      Credit Refund
                    </p>
                    <p className="text-sm text-blue-700">
                      One session credit will be refunded to your account upon cancellation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-green-800 mb-1">
                      Time Remaining
                    </p>
                    <p className="text-sm text-green-700">
                      {hoursUntilClass > 24 
                        ? `${Math.floor(hoursUntilClass / 24)} days and ${hoursUntilClass % 24} hours until class`
                        : `${hoursUntilClass} hours and ${minutesUntilClass % 60} minutes until class`
                      }
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Cancellation deadline: {format(cancellationDeadline, 'MMM dd, h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              {withinCancellationWindow ? 'Close' : 'Keep Booking'}
            </button>
            {!withinCancellationWindow && (
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cancelling...
                  </span>
                ) : (
                  'Cancel Booking'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
