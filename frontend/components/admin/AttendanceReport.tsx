'use client';

import { useState } from 'react';
import apiClient from '@/lib/axios';

interface AttendanceReportData {
  summary: {
    totalBookings: number;
    attended: number;
    noShows: number;
    noShowRate: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  classBreakdown: Array<{
    classId: number;
    className: string;
    location: string;
    coach: string;
    startTime: string;
    capacity: number;
    totalAttendees: number;
    attended: number;
    noShows: number;
  }>;
  mostAttendedClasses: Array<{
    classId: number;
    className: string;
    location: string;
    coach: string;
    startTime: string;
    attended: number;
  }>;
}

export default function AttendanceReport() {
  const [reportData, setReportData] = useState<AttendanceReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/admin/reports/attendance?${params.toString()}`);
      setReportData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch attendance report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('format', 'csv');

      const response = await apiClient.get(`/admin/reports/attendance?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#16161a] border border-[#26262B] rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-300">Attendance Report</h2>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex-1 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
            {reportData && (
              <button
                onClick={exportCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Export CSV
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Total Bookings</div>
                <div className="text-2xl font-bold text-white">
                  {reportData.summary.totalBookings}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Attended</div>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.summary.attended}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-400">No Shows</div>
                <div className="text-2xl font-bold text-red-600">
                  {reportData.summary.noShows}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-400">No Show Rate</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.summary.noShowRate}
                </div>
              </div>
            </div>

            {/* Most Attended Classes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Most Attended Classes</h3>
              <div className="bg-[#121214] rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-[#26262B]">
                  <thead className="bg-[#1f1f23]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Class
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Coach
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Attended
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#16161a] border border-[#26262B] divide-y divide-[#26262B]">
                    {reportData.mostAttendedClasses.map((cls) => (
                      <tr key={cls.classId}>
                        <td className="px-4 py-3 text-sm">{cls.className}</td>
                        <td className="px-4 py-3 text-sm">{cls.location}</td>
                        <td className="px-4 py-3 text-sm">{cls.coach}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(cls.startTime).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          {cls.attended}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Class-by-Class Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Class-by-Class Breakdown</h3>
              <div className="bg-[#121214] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#26262B]">
                    <thead className="bg-[#1f1f23]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Coach
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Capacity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Attended
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          No Shows
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          No Show %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#16161a] border border-[#26262B] divide-y divide-[#26262B]">
                      {reportData.classBreakdown.map((cls) => {
                        const noShowPercent = cls.totalAttendees > 0 
                          ? ((cls.noShows / cls.totalAttendees) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <tr key={cls.classId}>
                            <td className="px-4 py-3 text-sm">{cls.className}</td>
                            <td className="px-4 py-3 text-sm">{cls.location}</td>
                            <td className="px-4 py-3 text-sm">{cls.coach}</td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(cls.startTime).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm">{cls.capacity}</td>
                            <td className="px-4 py-3 text-sm font-medium">{cls.totalAttendees}</td>
                            <td className="px-4 py-3 text-sm text-green-600">{cls.attended}</td>
                            <td className="px-4 py-3 text-sm text-red-600">{cls.noShows}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`${
                                parseFloat(noShowPercent) > 20 ? 'text-red-600 font-semibold' : 'text-gray-400'
                              }`}>
                                {noShowPercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
