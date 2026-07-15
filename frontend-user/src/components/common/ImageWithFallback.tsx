import { useEffect, useMemo, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react';

interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'srcSet'> {
  fallbackSrc?: string;
  widths?: number[];
  sizes?: string;
}

function transformImage(src: string, width: number, format: 'avif' | 'webp') {
  if (src.includes('images.unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '72');
    url.searchParams.set('fm', format);
    return url.toString();
  }
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    return src.replace('/upload/', `/upload/f_${format},q_auto,w_${width},c_limit/`);
  }
  return undefined;
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/placeholder-product.png',
  className,
  onError,
  widths = [240, 360, 480, 720],
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  loading = 'lazy',
  decoding = 'async',
  width = 440,
  height = 440,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const responsive = useMemo(() => {
    const avif = widths
      .map((itemWidth) => transformImage(imgSrc, itemWidth, 'avif'))
      .filter(Boolean)
      .map((url, index) => `${url} ${widths[index]}w`)
      .join(', ');
    const webp = widths
      .map((itemWidth) => transformImage(imgSrc, itemWidth, 'webp'))
      .filter(Boolean)
      .map((url, index) => `${url} ${widths[index]}w`)
      .join(', ');
    return { avif, webp };
  }, [imgSrc, widths]);

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
    onError?.(event);
  };

  return (
    <picture>
      {responsive.avif && <source type="image/avif" srcSet={responsive.avif} sizes={sizes} />}
      {responsive.webp && <source type="image/webp" srcSet={responsive.webp} sizes={sizes} />}
      <img
        src={imgSrc}
        alt={alt || 'Sản phẩm'}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onError={handleError}
        className={className}
        {...props}
      />
    </picture>
  );
}
