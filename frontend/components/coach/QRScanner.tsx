'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, XCircleIcon, CameraIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface QRScannerProps {
  onScanSuccess: (bookingData: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function QRScanner({ onScanSuccess, onError, disabled = false }: QRScannerProps) {
  const [scanning, setScanning] = useState(true);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simple QR code detection using a library approach
  const detectQRCode = async (imageData: ImageData): Promise<string | null> => {
    // This is a placeholder - in production, use a proper QR code library
    // like jsQR or qr-scanner
    return null;
  };

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning interval
      scanIntervalRef.current = setInterval(() => {
        if (!processing && !disabled && scanning) {
          captureAndScan();
        }
      }, 1000); // Scan every second
    } catch (error) {
      console.error('Camera error:', error);
      onError('Could not access camera. Please ensure camera permissions are granted.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  // Capture frame and scan for QR code
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data for QR detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrData = await detectQRCode(imageData);

      if (qrData) {
        handleQRCodeScanned(qrData);
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  };

  // Handle QR code scan
  const handleQRCodeScanned = async (qrData: string) => {
    if (processing || disabled) return;

    // Prevent duplicate scans within 3 seconds
    if (lastScan) {
      const timeSinceLastScan = Date.now() - parseInt(lastScan);
      if (timeSinceLastScan < 3000) return;
    }

    setScanning(false);
    setProcessing(true);
    setLastScan(Date.now().toString());

    try {
      // Validate QR code with backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/qr/validate`,
        { qrData }
      );

      if (response.data.success) {
        onScanSuccess(response.data);
      } else {
        onError(response.data.error || 'Invalid QR code');
      }

      // Resume scanning after 3 seconds
      setTimeout(() => {
        resetScanner();
        setScanning(true);
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to validate QR code';
      onError(errorMessage);
      setTimeout(() => {
        resetScanner();
        setScanning(true);
      }, 3000);
    }
  };

  // Reset scan state
  const resetScanner = () => {
    setLastScan(null);
    setProcessing(false);
  };

  // Start/stop camera based on component mount
  useEffect(() => {
    if (!disabled) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [disabled]);

  // Reset scan state component
  const resetScannerComponent = () => {
    resetScanner();
    setScanning(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Scan Member QR Code
        </h3>
        <p className="text-sm text-gray-600">
          Point camera at member's QR code to check them in
        </p>
      </div>

      {/* Scanner Container */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3] max-w-md mx-auto">
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {scanning && !disabled && !processing ? (
          <>
            {/* Scanner Viewfinder */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-green-500 rounded-lg relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400"></div>
              </div>
            </div>

            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </>
        ) : disabled ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <XCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Scanner Disabled</p>
            </div>
          </div>
        ) : processing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Validating QR code...</p>
            </div>
          </div>
        ) : lastScan ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <CheckCircleIcon className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Scan Successful!</p>
              <p className="text-sm text-gray-400 mt-2">Resuming in 3 seconds...</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <CameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Camera Initializing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-3 text-sm text-gray-700">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
            1
          </div>
          <p>Position QR code within green frame</p>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-700">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
            2
          </div>
          <p>Hold steady until QR code is recognized</p>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-700">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
            3
          </div>
          <p>Wait for confirmation before scanning next</p>
        </div>
      </div>

      {/* Manual Entry Button */}
      <div className="mt-4 text-center">
        <button
          onClick={resetScannerComponent}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          Reset Scanner
        </button>
      </div>
    </div>
  );
}
