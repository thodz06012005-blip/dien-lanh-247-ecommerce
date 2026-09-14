import { API_BASE_URL, BACKEND_MODE, SERVICE_ONLY } from '../../config/runtime';

export default function DevModeBanner() {
  if (!import.meta.env.DEV) return null;
  return <aside className="fixed left-1/2 top-1 z-[120] -translate-x-1/2 rounded-full border border-slate-700/30 bg-slate-950/90 px-3 py-1 font-mono text-[9px] font-semibold text-white shadow-lg backdrop-blur" aria-label="Thông tin môi trường phát triển">
    {BACKEND_MODE} · {SERVICE_ONLY ? 'SERVICE ONLY' : 'FULL'} · {API_BASE_URL}
  </aside>;
}
