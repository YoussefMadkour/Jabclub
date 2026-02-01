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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Check-in QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00]"></div>
              <p className="mt-4 text-gray-600">Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p>{error}</p>
            </div>
          ) : qrData && classInfo ? (
            <div className="flex flex-col items-center">
              {/* QR Code - Display the image from backend */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                <img 
                  src={qrData} 
                  alt="Check-in QR Code" 
                  className="w-[200px] h-[200px]"
                />
              </div>

              {/* Class Information */}
              <div className="mt-6 w-full space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="text-lg font-semibold text-gray-900">{classInfo.className}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{classInfo.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Coach</p>
                    <p className="font-medium text-gray-900">{classInfo.coach}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
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

                <div className="text-center bg-orange-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">For</p>
                  <p className="font-semibold text-orange-900">{classInfo.forChild}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 text-center">
                  📱 Show this QR code to your coach when checking in to your class
                </p>
                <p className="text-xs text-gray-500 text-center mt-2">
                  QR code is valid until class ends
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#FF7A00] text-white rounded-lg hover:bg-[#F57A00] transition-colors font-medium touch-target"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
