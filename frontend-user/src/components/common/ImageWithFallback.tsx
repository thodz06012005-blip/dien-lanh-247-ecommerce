import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/placeholder-product.png',
  className,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || 'Sản phẩm'}
      onError={handleError}
      className={className}
      {...props}
    />
  );
}
