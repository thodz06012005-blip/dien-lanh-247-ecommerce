import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });
export const clearCustomerQueries = () => queryClient.removeQueries({ predicate: query => ['my-services', 'service-request', 'customer'].some(key => String(query.queryKey[0]).includes(key)) });
