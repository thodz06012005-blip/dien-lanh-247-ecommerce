import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface ToastPayload {
  id?: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastPayload, 'id' | 'title' | 'tone' | 'duration'>> {
  description?: string;
}

interface LightweightToastProviderProps {
  children: ReactNode;
}

const iconByTone = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function LightweightToastProvider({ children }: LightweightToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.title) return;
      const item: ToastItem = {
        id: detail.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: detail.title,
        description: detail.description,
        tone: detail.tone || 'info',
        duration: Math.max(1_500, detail.duration || 4_000),
      };
      setItems((current) => [...current.slice(-3), item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      }, item.duration);
    };

    window.addEventListener('dl247:toast', handleToast);
    return () => window.removeEventListener('dl247:toast', handleToast);
  }, []);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite" aria-atomic="false">
        {items.map((item) => {
          const Icon = iconByTone[item.tone];
          return (
            <section key={item.id} className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/15" role={item.tone === 'error' ? 'alert' : 'status'}>
              <div className="flex items-start gap-3">
                <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${item.tone === 'success' ? 'text-emerald-600' : item.tone === 'error' ? 'text-red-600' : item.tone === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm font-black text-slate-950">{item.title}</strong>
                  {item.description && <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>}
                </div>
                <button type="button" onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))} aria-label="Đóng thông báo" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
