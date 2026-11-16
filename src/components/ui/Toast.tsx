import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from './utils';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastPayload {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastPayload, 'id'>) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { container: string; icon: React.ReactNode }> = {
  success: {
    container:
      'bg-[var(--surface-elevated)] border-[var(--success-border)] text-[var(--text-primary)]',
    icon: <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />,
  },
  error: {
    container:
      'bg-[var(--surface-elevated)] border-[var(--danger-border)] text-[var(--text-primary)]',
    icon: <AlertCircle className="w-4 h-4 text-[var(--danger)] shrink-0 mt-0.5" />,
  },
  warning: {
    container:
      'bg-[var(--surface-elevated)] border-[var(--warning-border)] text-[var(--text-primary)]',
    icon: <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />,
  },
  info: {
    container:
      'bg-[var(--surface-elevated)] border-[var(--info-border)] text-[var(--text-primary)]',
    icon: <Info className="w-4 h-4 text-[var(--info)] shrink-0 mt-0.5" />,
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    ({
      title,
      description,
      tone = 'info',
      durationMs = 4500,
    }: Omit<ToastPayload, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, tone }]);
      if (durationMs > 0) {
        window.setTimeout(() => dismissToast(id), durationMs);
      }
      return id;
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notificações do sistema"
        className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)] pointer-events-none"
      >
        {toasts.map((t) => {
          const style = TONE_STYLES[t.tone || 'info'];
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border shadow-[var(--shadow-overlay)]',
                style.container
              )}
            >
              {style.icon}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-semibold text-[var(--text-primary)]">{t.title}</p>
                {t.description && (
                  <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Dispensar notificação"
                onClick={() => dismissToast(t.id)}
                className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de um <ToastProvider>.');
  }
  return ctx;
}
