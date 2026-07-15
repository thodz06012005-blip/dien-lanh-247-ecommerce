import { MessageCircle, Phone } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export default function FloatingContactActions() {
  const { settings } = useSettings();
  const hotline = settings?.hotline || '1900 1234';
  const zalo = settings?.zalo || hotline;
  const normalizedHotline = hotline.replace(/\s+/g, '');
  const normalizedZalo = zalo.replace(/\s+/g, '');

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
      aria-label="Liên hệ nhanh"
    >
      <a
        href={`https://zalo.me/${normalizedZalo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex min-h-12 items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-700 px-4 text-sm font-black text-white shadow-xl shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50"
        aria-label={`Chat Zalo ${zalo}`}
      >
        <MessageCircle aria-hidden="true" className="h-5 w-5" />
        <span className="hidden sm:inline">Chat Zalo</span>
      </a>
      <a
        href={`tel:${normalizedHotline}`}
        className="group flex min-h-12 items-center gap-2 rounded-full bg-orange-700 px-4 text-sm font-black text-white shadow-xl shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/50"
        aria-label={`Gọi hotline ${hotline}`}
      >
        <span aria-hidden="true" className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/20 motion-reduce:hidden" />
          <Phone className="relative h-4 w-4" />
        </span>
        <span className="hidden sm:inline">{hotline}</span>
      </a>
    </div>
  );
}
