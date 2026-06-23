'use client';

import { useState } from 'react';
import apiClient, { getErrorMessage } from '@/lib/axios';
import ApexLogo from '@/components/layout/ApexLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    try {
      setError('');
      setIsLoading(true);
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto p-8 bg-card border border-line">
        <div className="flex flex-col items-center mb-8">
          <ApexLogo className="h-9 text-headline" showSubtitle subtitleClassName="text-muted" />
          <p className="eyebrow mt-6">Reset Password</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              If an account exists for that email, we&apos;ve sent a reset link. Please check your inbox.
            </div>
            <a href="/login" className="text-primary hover:underline text-sm inline-block">
              Back to login
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm text-body mb-4">
              Enter your account email and we&apos;ll send you a link to reset your password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-headline mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-100 form-input-mobile"
                  placeholder="your@email.com"
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-body">
              Remembered it?{' '}
              <a href="/login" className="text-primary hover:underline">
                Back to login
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
