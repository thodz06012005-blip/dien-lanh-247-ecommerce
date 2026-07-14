import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';
import AppRouter from '@/router/AppRouter';

export default function App() {
  return (
    <AdminErrorBoundary>
      <AppRouter />
    </AdminErrorBoundary>
  );
}
