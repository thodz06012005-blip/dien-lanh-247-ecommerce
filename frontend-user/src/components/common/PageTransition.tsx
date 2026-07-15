import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-[phase13-fade-up_220ms_ease-out_both] motion-reduce:animate-none">
      {children}
    </div>
  );
}
