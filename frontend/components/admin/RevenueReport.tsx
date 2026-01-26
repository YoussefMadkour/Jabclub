'use client';

import { useState } from 'react';
import apiClient from '@/lib/axios';

interface RevenueReportData {
  summary: {
    totalRevenue: string;
    pendingRevenue: string;
    approvedPayments: number;
    pendingPayments: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  packageBreakdown: Array<{
    packageName: string;
    sessionCount: number;
    totalSales: number;
    revenue: number;
    count: number;
  }>;
  recentPayments: Array<{
    id: number;
    member: string;
    email: string;
    package: string;
    amount: string;
    approvedAt: string;
    submittedAt: string;
  }>;
  pendingPaymentsSummary: {
    count: number;
    totalValue: string;
    packages: Record<string, { count: number; value: number }>;
  };
}

export default function RevenueReport() {
  const [reportData, setReportData] = useState<RevenueReportData | null>(null);
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

      const response = await apiClient.get(`/admin/reports/revenue?${params.toString()}`);
      setReportData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch revenue report');
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

      const response = await apiClient.get(`/admin/reports/revenue?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'revenue-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-700">Revenue Report</h2>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="flex-1 bg-[#FF7A00] text-white px-4 py-2 rounded-md hover:bg-[#F57A00] disabled:bg-gray-400"
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
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600">
                  EGP {reportData.summary.totalRevenue}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Pending Revenue</div>
                <div className="text-2xl font-bold text-yellow-600">
                  EGP {reportData.summary.pendingRevenue}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Approved Payments</div>
                <div className="text-2xl font-bold text-[#FF7A00]">
                  {reportData.summary.approvedPayments}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Pending Payments</div>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData.summary.pendingPayments}
                </div>
              </div>
            </div>

            {/* Package Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Revenue by Package</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Package Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sessions
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sales Count
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Revenue
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Avg per Sale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.packageBreakdown.map((pkg, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium">{pkg.packageName}</td>
                        <td className="px-4 py-3 text-sm">{pkg.sessionCount}</td>
                        <td className="px-4 py-3 text-sm">{pkg.count}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          EGP {typeof pkg.revenue === 'string' ? parseFloat(pkg.revenue).toFixed(2) : pkg.revenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          EGP {(typeof pkg.revenue === 'string' ? parseFloat(pkg.revenue) : pkg.revenue / pkg.count).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending vs Confirmed Revenue Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue Status</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Confirmed Revenue</span>
                      <span className="text-lg font-bold text-green-600">
                        EGP {reportData.summary.totalRevenue}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Revenue</span>
                      <span className="text-lg font-bold text-yellow-600">
                        EGP {reportData.summary.pendingRevenue}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Potential</span>
                      <span className="text-xl font-bold text-[#FF7A00]">
                        EGP {(
                          parseFloat(reportData.summary.totalRevenue) +
                          parseFloat(reportData.summary.pendingRevenue)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Pending Payments by Package</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    {Object.entries(reportData.pendingPaymentsSummary.packages).map(([packageName, data]) => (
                      <div key={packageName} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{packageName}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{data.count} pending</div>
                          <div className="text-xs text-gray-500">EGP {typeof data.value === 'string' ? parseFloat(data.value).toFixed(2) : data.value.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Approved Payments</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Member
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Package
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Approved Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.recentPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 text-sm">{payment.member}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{payment.email}</td>
                          <td className="px-4 py-3 text-sm">{payment.package}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">
                            EGP {payment.amount}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(payment.approvedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
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
