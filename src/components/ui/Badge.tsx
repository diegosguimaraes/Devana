import React from 'react';
import { X } from 'lucide-react';
import { cn } from './utils';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: React.ReactNode;
}

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral:
    'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)]',
  primary:
    'bg-[var(--primary-subtle)] text-[var(--primary)] border-[var(--primary-border)]',
  success:
    'bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success-border)]',
  warning:
    'bg-[var(--warning-subtle)] text-[var(--warning)] border-[var(--warning-border)]',
  danger: 'bg-[var(--danger-subtle)] text-[var(--danger)] border-[var(--danger-border)]',
  info: 'bg-[var(--info-subtle)] text-[var(--info)] border-[var(--info-border)]',
};

/**
 * Badge semântico para estados funcionais (sempre com rótulo textual e ícone opcional).
 */
export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  icon,
  className,
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-[var(--radius-sm)] border whitespace-nowrap shrink-0',
      BADGE_TONES[tone],
      className
    )}
    {...props}
  >
    {icon && <span className="shrink-0 inline-flex">{icon}</span>}
    <span>{children}</span>
  </span>
);

export interface TagProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  onRemove?: () => void;
}

/**
 * Tag interativa para filtros e seleção de categorias.
 */
export const Tag: React.FC<TagProps> = ({
  active = false,
  onRemove,
  className,
  children,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    aria-pressed={active}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border whitespace-nowrap shrink-0 transition-colors duration-[var(--duration-fast)] cursor-pointer',
      active
        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
        : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
      className
    )}
    {...props}
  >
    <span>{children}</span>
    {onRemove && (
      <span
        role="button"
        tabIndex={0}
        aria-label="Remover filtro"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }
        }}
        className="inline-flex p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="w-3 h-3" />
      </span>
    )}
  </button>
);
