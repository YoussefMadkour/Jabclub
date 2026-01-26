'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, CameraIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScanSuccess: (bookingData: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function QRScannerWithFallback({ onScanSuccess, onError, disabled = false }: QRScannerProps) {
  const [scanning, setScanning] = useState(true);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [useCamera, setUseCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setScanning(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQRCodeScanned(JSON.stringify(code.data));
        } else {
          setProcessing(false);
          setScanning(true);
          onError('No QR code detected in the uploaded image');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Capture frame and scan for QR code
  const captureAndScan = () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRCodeScanned(JSON.stringify(code.data));
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

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      streamRef.current = stream;

      // Start scanning interval
      scanIntervalRef.current = setInterval(() => {
        captureAndScan();
      }, 1000);
    } catch (error) {
      console.error('Camera error:', error);
      onError('Could not access camera. Using manual upload instead.');
      setUseCamera(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  // Start/stop camera based on component mount
  useEffect(() => {
    if (useCamera && !disabled) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [useCamera, disabled]);

  const toggleScannerMode = () => {
    if (useCamera) {
      stopCamera();
      setUseCamera(false);
    } else {
      setUseCamera(true);
      startCamera();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Scan Member QR Code
        </h3>
        <p className="text-sm text-gray-600">
          Use camera or upload a QR code image
        </p>
      </div>

      {/* Scanner Container */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3] max-w-md mx-auto">
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {useCamera && !disabled && !processing ? (
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
        ) : !useCamera ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <ArrowUpTrayIcon className="h-16 w-16 mx-auto mb-4 text-blue-400" />
              <p className="text-lg font-medium">Upload QR Code</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-6 py-2 bg-[#FF7A00] text-white rounded-lg hover:bg-[#F57A00] transition-colors font-medium"
              >
                Choose Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
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

      {/* Toggle Button */}
      <div className="mt-4 text-center">
        <button
          onClick={toggleScannerMode}
          className="text-[#FF7A00] hover:text-orange-700 text-sm font-medium transition-colors"
          disabled={disabled || processing}
        >
          {useCamera ? 'Use File Upload Instead' : 'Use Camera Instead'}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-3 text-sm text-gray-700">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[#FF7A00] font-semibold text-xs">
            1
          </div>
          <p>{useCamera ? 'Position QR code within green frame' : 'Upload a clear image of the QR code'}</p>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-700">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[#FF7A00] font-semibold text-xs">
            2
          </div>
          <p>{useCamera ? 'Hold steady until QR code is recognized' : 'Ensure the QR code is clearly visible'}</p>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-700">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[#FF7A00] font-semibold text-xs">
            3
          </div>
          <p>Wait for confirmation before scanning next</p>
        </div>
      </div>
    </div>
  );
}
