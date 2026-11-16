import React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from './utils';

/* ----------------------------------------------------------------------------
   Skeleton
---------------------------------------------------------------------------- */
export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    aria-hidden="true"
    className={cn('devana-skeleton rounded-[var(--radius-md)]', className)}
  />
);

/* ----------------------------------------------------------------------------
   EmptyState
---------------------------------------------------------------------------- */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Estado vazio informativo que orienta o próximo passo do usuário.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => (
  <div
    className={cn(
      'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-10 text-center flex flex-col items-center gap-3',
      className
    )}
  >
    <div className="w-11 h-11 rounded-[var(--radius-lg)] bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center">
      {icon || <Inbox className="w-5 h-5" />}
    </div>
    <div className="space-y-1 max-w-md">
      <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
        {description}
      </p>
    </div>
    {actionLabel && onAction && (
      <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
        {actionLabel}
      </Button>
    )}
  </div>
);

/* ----------------------------------------------------------------------------
   ErrorState
---------------------------------------------------------------------------- */
export interface ErrorStateProps {
  title?: string;
  message: string;
  nextStep?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Estado de erro claro com explicação do que fazer em seguida.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Não foi possível carregar estes dados',
  message,
  nextStep,
  retryLabel = 'Tentar novamente',
  onRetry,
  className,
}) => (
  <div
    role="alert"
    className={cn(
      'bg-[var(--danger-subtle)] border border-[var(--danger-border)] rounded-[var(--radius-lg)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
      className
    )}
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{message}</p>
        {nextStep && (
          <p className="text-xs text-[var(--text-muted)]">Próximo passo: {nextStep}</p>
        )}
      </div>
    </div>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </div>
);

/* ----------------------------------------------------------------------------
   LoadingState
---------------------------------------------------------------------------- */
export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Carregando informações...',
  className,
}) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      'flex items-center justify-center gap-2.5 py-10 text-xs sm:text-sm text-[var(--text-muted)]',
      className
    )}
  >
    <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" aria-hidden="true" />
    <span>{label}</span>
  </div>
);
