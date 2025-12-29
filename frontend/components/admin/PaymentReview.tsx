'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';
import { getStaticFileUrl } from '@/utils/imageUrl';

interface PendingPayment {
  id: number;
  member: {
    id: number;
    email: string;
    name: string;
    phone: string | null;
  };
  package: {
    id: number;
    name: string;
    sessionCount: number;
    price: number;
    expiryDays: number;
  };
  amount: number;
  screenshotUrl: string;
  screenshotPath: string;
  submittedAt: string;
  status: string;
}

export default function PaymentReview() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/admin/payments/pending');
      setPayments(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load pending payments');
      console.error('Error fetching pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: number) => {
    if (!confirm('Are you sure you want to approve this payment? Credits will be granted to the member.')) {
      return;
    }

    try {
      setProcessingId(paymentId);
      await apiClient.put(`/admin/payments/${paymentId}/approve`);
      
      // Remove from list after successful approval
      setPayments(payments.filter(p => p.id !== paymentId));
      
      alert('Payment approved successfully! Credits have been granted to the member.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to approve payment');
      console.error('Error approving payment:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(selectedPayment.id);
      await apiClient.put(`/admin/payments/${selectedPayment.id}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      
      // Remove from list after successful rejection
      setPayments(payments.filter(p => p.id !== selectedPayment.id));
      
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      
      alert('Payment rejected successfully. The member will be notified.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reject payment');
      console.error('Error rejecting payment:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const openImageModal = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setShowImageModal(true);
  };

  const openRejectModal = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          onClick={fetchPendingPayments}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-600 text-lg">No pending payments to review</p>
        <p className="text-gray-500 text-sm mt-2">All payments have been processed</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Review</h2>
          <p className="text-gray-600 mt-1">{payments.length} pending payment{payments.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetchPendingPayments}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            {/* Member Info */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{payment.member.name}</h3>
              <p className="text-sm text-gray-600">{payment.member.email}</p>
              {payment.member.phone && (
                <p className="text-sm text-gray-600">{payment.member.phone}</p>
              )}
            </div>

            {/* Package Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{payment.package.name}</p>
                  <p className="text-sm text-gray-600">{payment.package.sessionCount} sessions</p>
                  <p className="text-sm text-gray-600">Valid for {payment.package.expiryDays} days</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">EGP {typeof payment.amount === 'string' ? parseFloat(payment.amount).toFixed(2) : payment.amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Submission Date */}
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Submitted: {formatDate(payment.submittedAt)}
              </p>
            </div>

            {/* Screenshot Preview */}
            <div className="mb-4">
              <button
                onClick={() => openImageModal(payment)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">Click to view payment screenshot</span>
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleApprove(payment.id)}
                disabled={processingId === payment.id}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {processingId === payment.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={() => openRejectModal(payment)}
                disabled={processingId === payment.id}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Screenshot</h3>
                <p className="text-sm text-gray-600">{selectedPayment.member.name} - {selectedPayment.package.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedPayment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img
                src={getStaticFileUrl(selectedPayment.screenshotUrl)}
                alt="Payment Screenshot"
                className="w-full h-auto rounded-lg"
                onLoad={() => console.log('Image loaded successfully')}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const imageUrl = getStaticFileUrl(selectedPayment.screenshotUrl);
                  console.error('Image failed to load:', {
                    url: imageUrl,
                    originalPath: selectedPayment.screenshotUrl,
                    error: 'Failed to fetch image resource'
                  });
                  
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.image-error-message')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'image-error-message p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                    errorDiv.innerHTML = `
                      <svg className="w-12 h-12 mx-auto text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p class="text-red-600 font-semibold">Failed to load image</p>
                      <p class="text-sm text-red-500 mt-2 break-all">URL: ${imageUrl}</p>
                      <p class="text-xs text-gray-500 mt-2">Please check if the file exists on the server</p>
                    `;
                    parent.appendChild(errorDiv);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this payment from {selectedPayment.member.name}.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPayment(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedPayment.id}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processingId === selectedPayment.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
