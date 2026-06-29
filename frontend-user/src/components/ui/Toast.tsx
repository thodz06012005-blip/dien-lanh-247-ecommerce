import { useToastStore } from '../../store/toastStore';
import type { ToastMessage } from '../../store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-20 right-4 z-55 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  toast: ToastMessage;
  onClose: () => void;
}

function ToastCard({ toast, onClose }: ToastCardProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />,
  };

  const bgColors = {
    success: 'bg-white border-emerald-100 shadow-emerald-100/30',
    error: 'bg-white border-red-100 shadow-red-100/30',
    warning: 'bg-white border-amber-100 shadow-amber-100/30',
    info: 'bg-white border-sky-100 shadow-sky-100/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
      layout
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border bg-white shadow-xl ${bgColors[toast.type]}`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-grow">
        <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
