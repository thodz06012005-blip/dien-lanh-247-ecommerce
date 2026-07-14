import { AlertCircle, Save } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

interface AdminFormShellProps {
  title: string;
  description: string;
  children: ReactNode;
  isDirty: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  error?: string | null;
  toolbar?: ReactNode;
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
}

export default function AdminFormShell({
  title,
  description,
  children,
  isDirty,
  isSubmitting = false,
  submitLabel = 'Lưu thay đổi',
  error,
  toolbar,
  onSubmit,
  onCancel,
}: AdminFormShellProps) {
  useUnsavedChanges(isDirty && !isSubmitting);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
            {isDirty && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">Chưa lưu</span>}
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {toolbar}
      </header>

      {error && (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 sm:mx-7">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-5 sm:p-7">{children}</div>

      <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">
            Hủy thay đổi
          </button>
        )}
        <button type="submit" disabled={!isDirty || isSubmitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black text-white shadow-lg shadow-blue-500/15 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" /> : <Save className="h-4 w-4" />}
          {isSubmitting ? 'Đang lưu...' : submitLabel}
        </button>
      </footer>
    </form>
  );
}
