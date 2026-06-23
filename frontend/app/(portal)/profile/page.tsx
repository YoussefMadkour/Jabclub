'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { getErrorMessage } from '@/lib/axios';
import { useToast } from '@/components/shared/Toast';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone((user as any).phone || '');
    }
  }, [user]);

  if (isLoading || !user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await apiClient.put('/members/profile', { firstName, lastName, phone });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      setSavingPassword(true);
      await apiClient.put('/members/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-input border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 form-input-mobile';
  const labelClass = 'block text-sm font-medium text-headline mb-1';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-headline">My Profile</h1>

      {/* Profile details */}
      <section className="p-6 bg-card border border-line rounded-lg">
        <h2 className="text-lg font-semibold text-headline mb-4">Personal details</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="email">Email</label>
            <input id="email" type="email" value={user.email} disabled className={`${inputClass} opacity-60`} />
            <p className="mt-1 text-xs text-muted">Email cannot be changed. Contact the gym if you need to update it.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="firstName">First name</label>
              <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass} htmlFor="lastName">Last name</label>
              <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} required />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">Phone</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="Optional" />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary touch-target disabled:opacity-50">
            {savingProfile ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="p-6 bg-card border border-line rounded-lg">
        <h2 className="text-lg font-semibold text-headline mb-4">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="currentPassword">Current password</label>
            <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="newPassword">New password</label>
            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} required />
            <p className="mt-1 text-xs text-muted">At least 8 characters, with an uppercase letter, a lowercase letter, and a number.</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="confirmPassword">Confirm new password</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} required />
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary touch-target disabled:opacity-50">
            {savingPassword ? 'Saving...' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
  );
}
