import React from 'react';
import { cn } from './utils';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: CardPadding;
}

const PADDING_MAP: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-7',
};

/**
 * Superfície estruturada de elevação única com borda sutil 1px e suporte Light/Dark.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, padding = 'md', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-subtle)]',
        interactive &&
          'transition-[box-shadow,border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:shadow-[var(--shadow-elevated)] hover:border-[var(--border-strong)] cursor-pointer',
        PADDING_MAP[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('space-y-1', className)} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn(
      'font-display text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug',
      className
    )}
    {...props}
  />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn('text-xs sm:text-sm text-[var(--text-muted)]', className)}
    {...props}
  />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('mt-4', className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3',
      className
    )}
    {...props}
  />
);
