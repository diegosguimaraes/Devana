import React, { useState } from 'react';
import { resolveResponsiveImageProps } from '../../types/domain';
import { cn } from './utils';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
};

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

function extractInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Avatar resiliente com fallback automático para iniciais (zero broken images)
 * e suporte responsivo WebP via srcset.
 */
export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-semibold select-none shrink-0 bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)]',
          SIZE_CLASSES[size],
          className
        )}
      >
        {extractInitials(name)}
      </div>
    );
  }

  const variant = resolveResponsiveImageProps(src);
  const px = SIZE_PX[size];

  return (
    <picture className="inline-flex shrink-0">
      {variant && (
        <source type="image/webp" srcSet={variant.webpSrcSet} sizes={`${px}px`} />
      )}
      <img
        src={src}
        alt={name}
        width={px}
        height={px}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn(
          'rounded-full object-cover shrink-0 border border-[var(--border)] bg-[var(--surface-subtle)]',
          SIZE_CLASSES[size],
          className
        )}
      />
    </picture>
  );
};
