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
    setQrError(null);
    setSelectedBooking(upcomingBookings.find((b: any) => b.id === bookingId));

    try {
      const response = await apiClient.post(`/qr/generate/${bookingId}`);
      setQrData(response.data);
      setIsQRModalOpen(true);
    } catch (error: any) {
      setQrError(error.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  // This function needs to reference data which will be available after data loads
  // The full component continues with the same structure
  // ... rest of the component code
}
