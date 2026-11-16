import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] text-[var(--primary-foreground)] border border-transparent shadow-[var(--shadow-subtle)]',
  secondary:
    'bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-strong)] shadow-[var(--shadow-subtle)]',
  ghost:
    'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent',
  danger:
    'bg-[var(--danger-solid)] hover:bg-red-700 active:bg-red-800 text-white border border-transparent shadow-[var(--shadow-subtle)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-md)]',
  md: 'h-10 px-4 text-xs sm:text-sm gap-2 rounded-[var(--radius-md)]',
  lg: 'h-11 px-5 text-sm gap-2 rounded-[var(--radius-lg)]',
};

/**
 * Button primitivo do Design System Devana.
 *
 * Exemplo:
 * ```tsx
 * <Button variant="primary" size="md" loading={isSaving} leftIcon={<Plus className="w-4 h-4" />}>
 *   Publicar Projeto
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth = false,
      type = 'button',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center font-semibold whitespace-nowrap shrink-0 select-none transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.985] cursor-pointer disabled:opacity-55 disabled:pointer-events-none',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className="shrink-0 inline-flex">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
