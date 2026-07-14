import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Unhandled customer application error', error, info.componentStack);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <section
          className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50"
          role="alert"
          aria-live="assertive"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle aria-hidden="true" size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Ứng dụng gặp sự cố</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Dữ liệu của bạn chưa bị gửi lại. Hãy tải lại trang; nếu lỗi tiếp tục xuất hiện, vui lòng
            liên hệ bộ phận hỗ trợ.
          </p>
          {import.meta.env.DEV && this.state.error?.message ? (
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-left text-xs text-slate-100">
              {this.state.error.message}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <RefreshCcw aria-hidden="true" size={18} />
            Tải lại trang
          </button>
        </section>
      </main>
    );
  }
}
