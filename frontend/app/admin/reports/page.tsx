'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AttendanceReport from '@/components/admin/AttendanceReport';
import RevenueReport from '@/components/admin/RevenueReport';

export default function ReportsPage() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'attendance' | 'revenue'>(
    pathname.includes('/revenue') ? 'revenue' : 'attendance'
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Tabs */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'attendance'
                  ? 'border-[#FF7A00] text-[#FF7A00]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Attendance Report
              </span>
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'revenue'
                  ? 'border-[#FF7A00] text-[#FF7A00]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Revenue Report
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Report Content */}
      <div className="mt-6">
        {activeTab === 'attendance' ? (
          <AttendanceReport />
        ) : (
          <RevenueReport />
        )}
      </div>
    </div>
  );
}
