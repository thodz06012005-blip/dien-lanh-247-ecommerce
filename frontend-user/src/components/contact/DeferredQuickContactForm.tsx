import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const QuickContactForm = lazy(() => import('./QuickContactForm'));

interface DeferredQuickContactFormProps {
  title: string;
  description: string;
  compact?: boolean;
}

export default function DeferredQuickContactForm(props: DeferredQuickContactFormProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px' },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={markerRef} className="min-h-[360px]">
      {visible ? (
        <Suspense
          fallback={
            <div className="h-[360px] animate-pulse rounded-[1.75rem] border border-white/10 bg-white/10" aria-label="Đang tải biểu mẫu liên hệ" />
          }
        >
          <QuickContactForm {...props} />
        </Suspense>
      ) : (
        <div className="h-[360px] rounded-[1.75rem] border border-white/10 bg-white/10" aria-hidden="true" />
      )}
    </div>
  );
}
