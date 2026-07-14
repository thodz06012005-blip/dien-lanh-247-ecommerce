import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

export default class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorId: null };

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
      errorId: `ADM-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AdminErrorBoundary]', {
      name: error.name,
      message: error.message,
      componentStack: info.componentStack,
      errorId: this.state.errorId,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-red-300">Lỗi hệ thống</p>
          <h1 className="mt-3 text-2xl font-black">Không thể hiển thị trang quản trị</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">
            Dữ liệu của bạn chưa bị thay đổi. Hãy tải lại trang; nếu lỗi tiếp diễn, cung cấp mã lỗi cho quản trị hệ thống.
          </p>
          <code className="mt-4 inline-flex rounded-lg bg-black/30 px-3 py-1.5 text-xs text-slate-300">{this.state.errorId}</code>
          <button type="button" onClick={() => window.location.reload()} className="mx-auto mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">
            <RefreshCw className="h-4 w-4" /> Tải lại trang
          </button>
        </section>
      </main>
    );
  }
}
