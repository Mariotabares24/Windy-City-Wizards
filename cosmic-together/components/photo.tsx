import Image from 'next/image';
import type { ImgHTMLAttributes } from 'react';
// Catalog photos are pre-sized local assets; private snapshots and blob captures
// must not be sent through a shared image-optimization cache.
export function Photo({
  src,
  alt = '',
  width = 800,
  height = 1000,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <Image
      unoptimized
      src={typeof src === 'string' ? src : ''}
      alt={alt}
      width={Number(width)}
      height={Number(height)}
      {...props}
    />
  );
}
