'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import apiClient from '@/lib/axios';

interface PublicClass {
  id: number;
  classType: string;
  duration: number;
  startTime: string;
  endTime: string;
  location: { id: number; name: string };
  capacity: number;
  availableSpots: number;
  isFull: boolean;
}

interface Location {
  id: number;
  name: string;
}

const isoToHHMM = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatTime12 = (t: string) => {
  if (!t || !t.includes(':')) return t;
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
};

export default function PublicSchedule() {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['public-locations'],
    queryFn: async () => {
      const res = await apiClient.get('/public/locations');
      return (res.data.data?.locations || res.data.data || []) as Location[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) setSelectedLocationId(locations[0].id);
  }, [locations, selectedLocationId]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['public-schedule', selectedLocationId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await apiClient.get('/public/schedule', {
        params: {
          ...(selectedLocationId ? { location: String(selectedLocationId) } : {}),
          startDate: format(weekStart, "yyyy-MM-dd'T'00:00:00"),
          endDate: format(weekEnd, "yyyy-MM-dd'T'23:59:59"),
        },
      });
      return (res.data.data?.classes || []) as PublicClass[];
    },
    enabled: !!selectedLocationId,
    staleTime: 60 * 1000,
  });

  // Unique, sorted time rows derived from the actual classes
  const timeSlots = (() => {
    const seen = new Map<string, { start: string; label: string }>();
    classes.forEach((c) => {
      const start = isoToHHMM(c.startTime);
      if (!seen.has(start)) seen.set(start, { start, label: formatTime12(start) });
    });
    return Array.from(seen.values()).sort((a, b) => a.start.localeCompare(b.start));
  })();

  const classAt = (day: Date, start: string) =>
    classes.find((c) => isSameDay(new Date(c.startTime), day) && isoToHHMM(c.startTime) === start);

  const loading = locationsLoading || (isLoading && !!selectedLocationId);
  const hasData = timeSlots.length > 0;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <select
          value={selectedLocationId ?? ''}
          onChange={(e) => setSelectedLocationId(Number(e.target.value))}
          className="bg-surface-2 text-white border border-line rounded-[2px] px-4 py-2.5 text-sm font-display uppercase tracking-wide"
          aria-label="Select location"
        >
          {locations.length === 0 && <option>Loading…</option>}
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} aria-label="Previous week"
            className="w-10 h-10 flex items-center justify-center border border-line text-white hover:bg-white hover:text-black transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setCurrentWeek(new Date())}
            className="px-4 h-10 border border-line text-white text-xs font-display uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
            This week
          </button>
          <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} aria-label="Next week"
            className="w-10 h-10 flex items-center justify-center border border-line text-white hover:bg-white hover:text-black transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-line overflow-x-auto">
        {loading ? (
          <div className="min-h-[280px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
          </div>
        ) : !hasData ? (
          <div className="min-h-[280px] flex flex-col items-center justify-center text-center px-6 py-12">
            <p className="text-headline font-display text-lg">No classes published for this week yet.</p>
            <p className="text-muted text-sm mt-2 max-w-sm">Try another week, or message us on WhatsApp and we’ll get you on the mats.</p>
          </div>
        ) : (
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                <th className="bg-surface-2 border-b border-r border-line p-3 text-left">
                  <span className="eyebrow">Time</span>
                </th>
                {days.map((day) => (
                  <th key={day.toISOString()} className="bg-surface-2 border-b border-r border-line last:border-r-0 p-3 text-center">
                    <div className="font-display uppercase text-xs tracking-wider text-headline">{format(day, 'EEE')}</div>
                    <div className="text-[11px] text-muted mt-0.5">{format(day, 'MMM d')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.start}>
                  <td className="bg-surface border-b border-r border-line p-3 align-middle">
                    <span className="text-xs font-display text-foreground whitespace-nowrap">{slot.label}</span>
                  </td>
                  {days.map((day) => {
                    const c = classAt(day, slot.start);
                    const isFriday = format(day, 'EEEE') === 'Friday';
                    return (
                      <td key={day.toISOString() + slot.start}
                        className={`border-b border-r border-line last:border-r-0 text-center transition-colors ${
                          c
                            ? c.isFull
                              ? 'bg-white/15 text-white/60'
                              : 'bg-white text-black'
                            : 'bg-surface text-muted'
                        }`}>
                        {c ? (
                          <div className="flex flex-col items-center justify-center gap-1 min-h-[64px] px-1 py-2">
                            <span className="text-[11px] sm:text-xs font-display font-semibold uppercase leading-tight">{c.classType}</span>
                            <span className="text-[10px] opacity-70">{c.isFull ? 'Full' : `${c.availableSpots} left`}</span>
                          </div>
                        ) : (
                          <div className="min-h-[64px] flex items-center justify-center">
                            <span className="text-[10px] text-line">{isFriday ? 'OFF' : '·'}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Booking CTA */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-line bg-surface p-5">
        <p className="text-sm text-foreground">
          <span className="text-headline font-display uppercase tracking-wide">Members book in the portal.</span>{' '}
          New here? Reserve your first class and we’ll set you up.
        </p>
        <div className="flex gap-3 shrink-0">
          <Link href="/login" className="btn-secondary text-xs px-5 py-2.5">Log in to book</Link>
          <Link href="/membership" className="btn-primary text-xs px-5 py-2.5">Become a member</Link>
        </div>
      </div>
    </div>
  );
}
