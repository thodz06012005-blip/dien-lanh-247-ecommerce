import { Activity, Clock3 } from 'lucide-react';
import Card from '../../../components/ui/Card';

interface Entry { action: string; label: string; actor: string; detail?: string; createdAt: string; }
export default function ServiceActivityLog({ entries = [] }: { entries?: Entry[] }) {
  return <Card title="Nhật ký thao tác">
    {entries.length ? <div className="space-y-0">{entries.map((entry, index) => <div key={`${entry.createdAt}-${index}`} className="relative flex gap-3 pb-5 last:pb-0"><div className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-200 last:hidden" /><span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Activity className="h-4 w-4" /></span><div className="min-w-0 pt-0.5"><p className="text-sm font-semibold text-slate-800">{entry.label}</p>{entry.detail && <p className="mt-1 text-xs leading-5 text-slate-500">{entry.detail}</p>}<p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400"><Clock3 className="h-3 w-3" />{entry.actor} · {new Date(entry.createdAt).toLocaleString('vi-VN')}</p></div></div>)}</div> : <p className="py-4 text-center text-sm text-slate-400">Chưa có thao tác được ghi nhận.</p>}
  </Card>;
}
