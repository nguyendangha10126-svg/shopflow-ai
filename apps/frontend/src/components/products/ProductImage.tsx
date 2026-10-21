import React, { useState } from 'react';
import { ShoppingBag, ImageOff } from 'lucide-react';

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'square',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : 'aspect-[3/4]';

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl select-none ${aspectClass} ${className}`}
        aria-label={alt}
      >
        {hasError ? (
          <ImageOff className="w-8 h-8 opacity-40 mb-1" />
        ) : (
          <ShoppingBag className="w-8 h-8 opacity-40 mb-1" />
        )}
        <span className="text-[10px] font-medium tracking-wider uppercase px-2 text-center line-clamp-1">
          {alt || 'May Boutique'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 ${aspectClass} ${className}`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default ProductImage;
