import React, { useState } from 'react';
import { resolveResponsiveImageProps } from '../../types/domain';

export interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackInitials?: string;
  priority?: boolean;
  sizes?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className,
  fallbackInitials,
  priority = false,
  sizes,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold select-none ${className || ''}`}
        role="img"
        aria-label={alt}
      >
        <span>{fallbackInitials || alt.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }

  const variant = resolveResponsiveImageProps(src);

  return (
    <picture className="block w-full h-full">
      {variant && (
        <source
          type="image/webp"
          srcSet={variant.webpSrcSet}
          sizes={sizes || variant.sizes}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={variant?.width}
        height={variant?.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    </picture>
  );
};
