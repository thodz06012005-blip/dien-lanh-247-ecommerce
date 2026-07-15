import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppErrorBoundary from '@/components/errors/AppErrorBoundary';
import LightweightToastProvider from '@/components/feedback/LightweightToastProvider';

interface AppProvidersProps {
  children: ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        retry: (failureCount, error) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
          return failureCount < 1;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export default function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LightweightToastProvider>{children}</LightweightToastProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
