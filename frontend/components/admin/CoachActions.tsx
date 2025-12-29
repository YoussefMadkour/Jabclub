'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';

interface CoachActionsProps {
  coachId: number;
  coachData: {
    isPaused: boolean;
    isFrozen: boolean;
    deletedAt: string | null;
  };
}

export default function CoachActions({ coachId, coachData }: CoachActionsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handlePause = async () => {
    if (!confirm('Are you sure you want to pause this coach account? They will not be able to log in.')) {
      return;
    }
    try {
      setProcessing(true);
      await apiClient.put(`/admin/coaches/${coachId}/pause`);
      alert('Coach account paused successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-coach', coachId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to pause coach');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnpause = async () => {
    try {
      setProcessing(true);
      await apiClient.put(`/admin/coaches/${coachId}/unpause`);
      alert('Coach account unpaused successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-coach', coachId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to unpause coach');
    } finally {
      setProcessing(false);
    }
  };

  const handleFreeze = async () => {
    if (!confirm('Are you sure you want to freeze this coach account? They will not be able to teach classes.')) {
      return;
    }
    try {
      setProcessing(true);
      await apiClient.put(`/admin/coaches/${coachId}/freeze`);
      alert('Coach account frozen successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-coach', coachId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to freeze coach');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfreeze = async () => {
    try {
      setProcessing(true);
      await apiClient.put(`/admin/coaches/${coachId}/unfreeze`);
      alert('Coach account unfrozen successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-coach', coachId] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to unfreeze coach');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this coach account? This action cannot be undone. The coach will be soft-deleted.')) {
      return;
    }
    try {
      setProcessing(true);
      await apiClient.delete(`/admin/coaches/${coachId}`);
      alert('Coach account deleted successfully');
      router.push('/admin/coaches');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete coach');
    } finally {
      setProcessing(false);
    }
  };

  if (coachData.deletedAt) {
    return (
      <div className="px-4 py-2 bg-red-100 text-red-800 rounded-md">
        Account Deleted
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {coachData.isPaused ? (
          <button
            onClick={handleUnpause}
            disabled={processing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Unpause
          </button>
        ) : (
          <button
            onClick={handlePause}
            disabled={processing}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            Pause
          </button>
        )}
        {coachData.isFrozen ? (
          <button
            onClick={handleUnfreeze}
            disabled={processing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Unfreeze
          </button>
        ) : (
          <button
            onClick={handleFreeze}
            disabled={processing}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            Freeze
          </button>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={processing}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Coach Account</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this coach account? This action cannot be undone. The coach will be soft-deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}





