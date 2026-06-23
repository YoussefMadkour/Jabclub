'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient, { getErrorMessage } from '@/lib/axios';
import ApexLogo from '@/components/layout/ApexLogo';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      setError('');
      setIsLoading(true);
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
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
          <p className="eyebrow mt-6">Set New Password</p>
        </div>

        {!token ? (
          <div className="text-center space-y-4">
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              This reset link is invalid or incomplete. Please request a new one.
            </div>
            <a href="/forgot-password" className="text-primary hover:underline text-sm inline-block">
              Request a new link
            </a>
          </div>
        ) : done ? (
          <div className="text-center space-y-4">
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Your password has been reset. Redirecting to login...
            </div>
            <a href="/login" className="text-primary hover:underline text-sm inline-block">
              Go to login now
            </a>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-headline mb-1">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-100 form-input-mobile"
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
                <p className="mt-1 text-xs text-muted">
                  At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
                </p>
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-headline mb-1">
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-100 form-input-mobile"
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
