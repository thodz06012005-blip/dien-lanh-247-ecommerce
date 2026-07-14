import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/design-system';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'srcSet' | 'loading'> {
  src: string;
  alt: string;
  priority?: boolean;
  widths?: number[];
  sizes?: string;
  fallbackClassName?: string;
}

function appendImageParams(src: string, width: number) {
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}auto=format&fit=crop&w=${width}&q=78`;
}

export default function OptimizedImage({
  src,
  alt,
  priority = false,
  widths = [480, 768, 1024, 1440],
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px',
  className,
  fallbackClassName,
  width = 1200,
  height = 800,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const supportsResponsiveSource = src.includes('images.unsplash.com');
  const srcSet = supportsResponsiveSource
    ? widths.map((itemWidth) => `${appendImageParams(src, itemWidth)} ${itemWidth}w`).join(', ')
    : undefined;
  const resolvedSrc = supportsResponsiveSource ? appendImageParams(src, Number(width) || 1200) : src;

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex min-h-40 items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-6 text-center text-sm font-semibold text-slate-500',
          fallbackClassName,
          className,
        )}
      >
        Hình ảnh đang được cập nhật
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('block max-w-full bg-slate-100', className)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
