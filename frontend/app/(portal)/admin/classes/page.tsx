'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClassScheduleManager from '@/components/admin/ClassScheduleManager';
import AdminScheduleGridView from '@/components/admin/AdminScheduleGridView';

export default function AdminClassesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen">
      {viewMode === 'grid' ? (
        <AdminScheduleGridView />
      ) : (
        <div className="bg-[#121214]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ClassScheduleManager />
          </div>
        </div>
      )}
      
      {/* View Toggle Button - Floating */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-target ${
              viewMode === 'grid'
                ? 'bg-white text-black'
                : 'bg-[#26262B] text-gray-300 hover:bg-white/10'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-target ${
              viewMode === 'list'
                ? 'bg-white text-black'
                : 'bg-[#26262B] text-gray-300 hover:bg-white/10'
            }`}
          >
            List
          </button>
        </div>
      </div>
    </div>
  );
}
