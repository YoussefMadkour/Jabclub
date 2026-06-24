'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: string | null;
  classInfo: {
    className: string;
    date: string;
    location: string;
    coach: string;
    forChild: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  qrData,
  classInfo,
  isLoading,
  error,
}: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#26262B] flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            Check-in QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white"></div>
              <p className="mt-4 text-sm sm:text-base text-gray-400">Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-sm sm:text-base text-red-800">
              <p>{error}</p>
            </div>
          ) : qrData && classInfo ? (
            <div className="flex flex-col items-center">
              {/* QR Code - Smaller on mobile */}
              <div className="bg-[#16161a] p-2 sm:p-4 rounded-lg border-2 border-[#26262B] shadow-sm">
                <img 
                  src={qrData} 
                  alt="Check-in QR Code" 
                  className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]"
                />
              </div>

              {/* Class Information - Compact on mobile */}
              <div className="mt-4 sm:mt-6 w-full space-y-2 sm:space-y-3">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-400">Class</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{classInfo.className}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Location</p>
                    <p className="text-sm sm:text-base font-medium text-white break-words">{classInfo.location}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Coach</p>
                    <p className="text-sm sm:text-base font-medium text-white break-words">{classInfo.coach}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-400">Date & Time</p>
                  <p className="text-sm sm:text-base font-medium text-white">
                    {new Date(classInfo.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="text-center bg-orange-50 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-gray-400">For</p>
                  <p className="text-sm sm:text-base font-semibold text-orange-900">{classInfo.forChild}</p>
                </div>
              </div>

              {/* Instructions - Compact on mobile */}
              <div className="mt-4 sm:mt-6 bg-[#121214] rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-300 text-center">
                  📱 Show this QR code to your coach when checking in to your class
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-1 sm:mt-2">
                  QR code is valid until class ends
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer - Always visible */}
        <div className="p-3 sm:p-4 border-t border-[#26262B] bg-[#121214] rounded-b-lg flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 sm:py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium touch-target text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
