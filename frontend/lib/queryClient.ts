import { QueryClient } from '@tanstack/react-query';

// Create a new QueryClient instance
// DO NOT export a singleton - create new instances per request
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
