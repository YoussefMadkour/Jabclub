'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getNavItems = () => {
    if (!isAuthenticated || !user) {
      return [
        { label: 'Login', href: '/login' },
        { label: 'Sign Up', href: '/signup' },
      ];
    }

    const baseItems = [
      { label: 'Dashboard', href: '/dashboard' },
    ];

    if (user.role === 'member') {
      return [
        ...baseItems,
        { label: 'Classes', href: '/classes' },
        { label: 'Children', href: '/children' },
        { label: 'Purchase', href: '/purchase' },
        { label: 'Payment History', href: '/payments' },
      ];
    }

    if (user.role === 'coach') {
      return [
        ...baseItems,
        { label: 'My Classes', href: '/coach' },
      ];
    }

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { label: 'Payments', href: '/admin/payments' },
        { label: 'Bookings', href: '/admin/bookings' },
        { label: 'Classes', href: '/admin/classes' },
        { label: 'Locations', href: '/admin/locations' },
        { label: 'Packages', href: '/admin/packages' },
        { label: 'Members', href: '/admin/members' },
        { label: 'Coaches', href: '/admin/coaches' },
        { label: 'Reports', href: '/admin/reports/attendance' },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-card text-headline shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
              JabClub
            </Link>
          </div>

          {/* Desktop Navigation - Auth buttons for non-authenticated users */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="btn-secondary touch-target inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary touch-target inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* User Profile Dropdown */}
          {isAuthenticated && user && (
            <div className="relative ml-3">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-input transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <span className="hidden lg:block">{user.firstName}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50 border border-input">
                  <div className="px-4 py-2 text-sm text-body border-b border-input">
                    <div className="font-medium text-headline">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-muted">{user.email}</div>
                    <div className="text-xs text-muted capitalize mt-1">Role: {user.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-body hover:bg-input transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-input focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-input">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-input transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-input transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              navItems.map((item) => {
                // Skip items without href
                if (!item.href) {
                  return null;
                }
                return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-input transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {item.label}
                </Link>
                );
              })
            )}

            {isAuthenticated && user && (
              <>
                <div className="border-t border-input mt-2 pt-2">
                  <div className="px-3 py-2 text-sm text-muted">
                    <div className="font-medium text-headline">{user.firstName} {user.lastName}</div>
                    <div className="text-xs">{user.email}</div>
                    <div className="text-xs capitalize mt-1">Role: {user.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-input transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
