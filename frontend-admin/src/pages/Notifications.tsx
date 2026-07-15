import { useCallback, useEffect, useMemo, useState } from 'react';

type NotificationItem = {
  id: string;
  type: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const severityClasses: Record<NotificationItem['severity'], string> = {
  INFO: 'border-sky-200 bg-sky-50 text-sky-700',
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  WARNING: 'border-amber-200 bg-amber-50 text-amber-700',
  CRITICAL: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/notifications?limit=60&unreadOnly=${unreadOnly}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Không thể tải trung tâm thông báo.');
      const payload = await response.json();
      const records = payload?.data ?? payload;
      setItems(Array.isArray(records) ? records : []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const markRead = async (id: string) => {
    await fetch(`${API_BASE}/admin/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    setItems((current) => current.map((item) => (String(item.id) === String(id) ? { ...item, isRead: true } : item)));
  };

  return (
    <section className="space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Operations intelligence</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Trung tâm thông báo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Theo dõi yêu cầu mới, cảnh báo SLA, trạng thái gửi email và các sự kiện quan trọng của đội vận hành.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-slate-300">Chưa đọc</div>
            <div className="mt-1 text-3xl font-bold">{unreadCount}</div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Chỉ hiển thị chưa đọc
        </label>
        <button type="button" onClick={() => void load()} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Làm mới</button>
      </div>

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Đang tải thông báo…</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{error}</div> : null}
      {!loading && !error && items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">Không có thông báo phù hợp.</div> : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <article key={String(item.id)} className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.isRead ? 'border-slate-200 opacity-80' : 'border-blue-200 ring-1 ring-blue-100'}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${severityClasses[item.severity]}`}>{item.severity}</span>
                  {!item.isRead ? <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">MỚI</span> : null}
                  <time className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
                </div>
                <h2 className="mt-3 text-base font-bold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {item.actionUrl ? <a href={item.actionUrl} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Xem chi tiết</a> : null}
                {!item.isRead ? <button type="button" onClick={() => void markRead(String(item.id))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Đánh dấu đã đọc</button> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
