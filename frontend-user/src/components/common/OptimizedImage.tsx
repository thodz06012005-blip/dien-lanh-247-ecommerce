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

function appendImageParams(src: string, width: number, format?: 'avif' | 'webp') {
  const separator = src.includes('?') ? '&' : '?';
  const fm = format ? `&fm=${format}` : '';
  return `${src}${separator}fit=crop&w=${width}&q=72${fm}`;
}

function buildSrcSet(src: string, widths: number[], format?: 'avif' | 'webp') {
  return widths.map((itemWidth) => `${appendImageParams(src, itemWidth, format)} ${itemWidth}w`).join(', ');
}

export default function OptimizedImage({
  src,
  alt,
  priority = false,
  widths = [320, 480, 768, 1024, 1440],
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px',
  className,
  fallbackClassName,
  width = 1200,
  height = 800,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const supportsResponsiveSource = /images\.unsplash\.com|images\.pexels\.com/.test(src);
  const resolvedSrc = supportsResponsiveSource ? appendImageParams(src, Number(width) || 1200, 'webp') : src;

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

  const image = (
    <img
      src={resolvedSrc}
      srcSet={supportsResponsiveSource ? buildSrcSet(src, widths, 'webp') : undefined}
      sizes={supportsResponsiveSource ? sizes : undefined}
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

  if (!supportsResponsiveSource) return image;
  return (
    <picture>
      <source type="image/avif" srcSet={buildSrcSet(src, widths, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={buildSrcSet(src, widths, 'webp')} sizes={sizes} />
      {image}
    </picture>
  );
}
