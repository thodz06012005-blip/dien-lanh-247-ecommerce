import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import AppErrorBoundary from '@/components/errors/AppErrorBoundary';
import { AdminToastProvider } from '@/design-system';

interface AppProvidersProps {
  children: ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
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
        <ConfigProvider
          locale={viVN}
          theme={{
            token: {
              colorPrimary: '#2563eb',
              colorInfo: '#2563eb',
              colorSuccess: '#059669',
              colorWarning: '#d97706',
              colorError: '#dc2626',
              colorText: '#0f172a',
              colorTextSecondary: '#64748b',
              colorBgLayout: '#f5f7fb',
              borderRadius: 12,
              borderRadiusLG: 16,
              controlHeight: 40,
              fontFamily: "Inter, 'Be Vietnam Pro', system-ui, sans-serif",
            },
          }}
        >
          <AdminToastProvider>{children}</AdminToastProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
