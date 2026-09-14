export default function RouteSkeleton() {
  return <main className="min-h-screen bg-slate-50" aria-busy="true" aria-live="polite">
    <span className="sr-only">Đang tải trang</span>
    <div className="h-1 overflow-hidden bg-blue-50"><div className="route-progress h-full w-1/3 bg-gradient-to-r from-blue-600 to-cyan-400" /></div>
    <div className="mx-auto max-w-7xl animate-skeleton px-4 py-24 sm:px-6 lg:px-8">
      <div className="h-4 w-28 rounded-full bg-slate-200" />
      <div className="mt-5 h-10 max-w-xl rounded-xl bg-slate-200" />
      <div className="mt-3 h-5 max-w-2xl rounded-lg bg-slate-200" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map(item => <div key={item} className="h-48 rounded-3xl border border-slate-100 bg-white shadow-sm"><div className="h-24 rounded-t-3xl bg-slate-200" /><div className="m-5 h-4 w-2/3 rounded bg-slate-200" /><div className="mx-5 h-3 w-1/2 rounded bg-slate-100" /></div>)}
      </div>
    </div>
  </main>;
}
