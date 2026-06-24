'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ClassSchedule from '@/components/classes/ClassSchedule';
import ScheduleGridView from '@/components/classes/ScheduleGridView';

export default function ClassesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {viewMode === 'grid' ? (
        <ScheduleGridView />
      ) : (
        <div className="bg-[#121214]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setViewMode('grid')}
                className="px-4 py-2 bg-[#26262B] hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium"
              >
                Grid View
              </button>
            </div>
            <ClassSchedule />
          </div>
        </div>
      )}
      
      {/* View Toggle Button - Floating */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-black'
                : 'bg-[#26262B] text-gray-300 hover:bg-white/10'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
