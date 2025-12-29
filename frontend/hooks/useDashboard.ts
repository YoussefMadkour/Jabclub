import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

interface Package {
  id: number;
  packageName: string;
  sessionsRemaining: number;
  sessionsTotal: number;
  purchaseDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
}

interface ExpiredPackage {
  id: number;
  packageName: string;
  sessionsRemaining: number;
  sessionsTotal: number;
  purchaseDate: string;
  expiryDate: string;
  daysExpired: number;
  isExpired: boolean;
}

interface NextExpiringPackage {
  id: number;
  packageName: string;
  sessionsRemaining: number;
  expiryDate: string;
  daysUntilExpiry: number;
}

interface Booking {
  id: number;
  classType: string;
  startTime: string;
  endTime: string;
  duration?: number;
  location: string;
  locationAddress?: string;
  coach: string;
  bookedFor: string;
  isChildBooking: boolean;
  bookedAt?: string;
  status?: string;
  attendanceMarkedAt?: string | null;
}

interface DashboardData {
  credits: {
    total: number;
    packages: Package[];
  };
  expiredPackages?: ExpiredPackage[];
  nextExpiringPackage: NextExpiringPackage | null;
  upcomingBookings: Booking[];
  pastBookings: Booking[];
}

export const useDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/members/dashboard');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
