'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-main">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-headline mb-6">
              Welcome to <span className="text-primary">JabClub</span>
            </h1>
            <p className="text-xl md:text-2xl text-body mb-4 max-w-3xl mx-auto">
              The official membership platform for <span className="font-semibold text-primary">JabClub Gym</span> members.
            </p>
            <p className="text-lg text-body/80 mb-8 max-w-2xl mx-auto">
              Book boxing classes, manage your session credits, track your progress, and stay connected with the JabClub community. This platform is exclusively for JabClub Gym members.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="btn-primary touch-target inline-flex items-center justify-center px-8 py-3 text-lg font-medium rounded-lg transition-all hover:scale-105"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="btn-primary touch-target inline-flex items-center justify-center px-8 py-3 text-lg font-medium rounded-lg transition-all hover:scale-105"
                  >
                    Member Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="btn-secondary touch-target inline-flex items-center justify-center px-8 py-3 text-lg font-medium rounded-lg transition-all hover:scale-105"
                  >
                    Member Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-headline mb-4">
              What is <span className="text-primary">JabClub</span>?
            </h2>
            <p className="text-lg text-body max-w-3xl mx-auto mb-6">
              JabClub is the exclusive online platform designed specifically for JabClub Gym members. Whether you're training at Edge Fit Zayed Dunes, GOFIT Arena, or CORE, this platform helps you manage your membership seamlessly.
            </p>
            <p className="text-base text-body/80 max-w-2xl mx-auto">
              <span className="font-semibold text-primary">For Members Only:</span> This platform is exclusively available to active JabClub Gym members. If you're not yet a member, visit one of our locations to join the JabClub family.
            </p>
          </div>
          
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-headline mb-4">
              What Can You Do?
            </h2>
            <p className="text-lg text-body max-w-2xl mx-auto">
              Manage your membership, book classes, and track your progress all in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-headline mb-2">Flexible Scheduling</h3>
              <p className="text-body">
                Book classes that fit your schedule with our easy-to-use booking system.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-headline mb-2">Expert Coaches</h3>
              <p className="text-body">
                Learn from professional boxing coaches with years of experience.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-headline mb-2">Community</h3>
              <p className="text-body">
                Join a supportive community of boxing enthusiasts at all skill levels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {isAuthenticated ? 'Ready to Book Your Next Class?' : 'Already a JabClub Gym Member?'}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {isAuthenticated 
              ? 'Browse our schedule and book your next boxing class today.'
              : 'Sign up with your membership details to access the platform and start booking classes.'}
          </p>
          {!isAuthenticated && (
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium bg-white text-primary rounded-lg transition-all hover:scale-105 touch-target"
            >
              Member Sign Up
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
