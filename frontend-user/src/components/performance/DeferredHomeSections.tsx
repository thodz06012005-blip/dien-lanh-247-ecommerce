import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DeferredHomeSectionsProps {
  render: () => ReactNode;
  minHeight?: number;
}

export default function DeferredHomeSections({
  render,
  minHeight = 2200,
}: DeferredHomeSectionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={sentinelRef}
      className={isVisible ? 'contents' : 'block bg-white'}
      style={isVisible ? undefined : { minHeight }}
      aria-busy={!isVisible}
    >
      {isVisible ? (
        render()
      ) : (
        <section
          aria-label="Nội dung trang chủ đang được chuẩn bị"
          className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8"
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="h-44 animate-pulse rounded-3xl border border-slate-100 bg-slate-50"
            />
          ))}
        </section>
      )}
    </div>
  );
}
