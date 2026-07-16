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

const LOCAL_ASSET_MIRRORS: Readonly<Record<string, string>> = {
  'https://images.unsplash.com/photo-1621905252472-e4b5d9fbe0c5':
    '/images/home/hero-hvac-operations.svg',
};

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
  const effectiveSrc = LOCAL_ASSET_MIRRORS[src] || src;
  const supportsResponsiveSource = /images\.unsplash\.com|images\.pexels\.com/.test(effectiveSrc);
  const resolvedSrc = supportsResponsiveSource
    ? appendImageParams(effectiveSrc, Number(width) || 1200, 'webp')
    : effectiveSrc;

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
      srcSet={supportsResponsiveSource ? buildSrcSet(effectiveSrc, widths, 'webp') : undefined}
      sizes={supportsResponsiveSource ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      className={cn('block max-w-full bg-slate-100', className)}
      onError={() => setHasError(true)}
      {...props}
    />
  );

  if (!supportsResponsiveSource) return image;
  return (
    <picture>
      <source type="image/avif" srcSet={buildSrcSet(effectiveSrc, widths, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={buildSrcSet(effectiveSrc, widths, 'webp')} sizes={sizes} />
      {image}
    </picture>
  );
}
