'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ChildrenManager from '@/components/dashboard/ChildrenManager';
import Link from 'next/link';

export default function ChildrenPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <div>
                <h1 className="text-xl font-bold text-gray-900">JabClub</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.firstName}!</p>
              </div>
              <div className="hidden md:flex gap-4">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/classes"
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Classes
                </Link>
                <Link
                  href="/children"
                  className="px-3 py-2 text-blue-600 font-medium border-b-2 border-blue-600"
                >
                  Children
                </Link>
                <Link
                  href="/purchase"
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Purchase
                </Link>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <ChildrenManager />
        </div>
      </main>
    </div>
  );
}
