'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import GoogleAuthButton from './GoogleAuthButton';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  // Check for OAuth errors in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    if (oauthError === 'google_auth_failed') {
      setError('Google authentication failed. Please try again.');
    } else if (oauthError === 'session_error') {
      setError('Session error. Please try logging in again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setError('');
      setIsLoading(true);

      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg border border-input">
      <h2 className="text-2xl font-bold text-center mb-6 text-headline">Login to JabClub</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="mb-6">
        <GoogleAuthButton type="login" disabled={isLoading} />
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-body">Or continue with email</span>
          </div>
        </div>
      </div>

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
            className="w-full px-3 py-2 bg-input border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 form-input-mobile"
            placeholder="your@email.com"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-headline mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 form-input-mobile"
            placeholder="••••••••"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed touch-target"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-body">
        Don't have an account?{' '}
        <a href="/signup" className="text-primary hover:underline">
          Sign up
        </a>
      </p>
    </div>
  );
}
