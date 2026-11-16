import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from './utils';

/* ----------------------------------------------------------------------------
   Tooltip
---------------------------------------------------------------------------- */
export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {React.cloneElement(
        children as React.ReactElement<{ 'aria-describedby'?: string }>,
        {
          'aria-describedby': visible ? tooltipId : undefined,
        }
      )}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 -translate-x-1/2 z-[var(--z-popover)] px-2.5 py-1 text-[11px] font-medium rounded-[var(--radius-sm)] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 whitespace-nowrap shadow-[var(--shadow-elevated)]',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
};

/* ----------------------------------------------------------------------------
   Popover
---------------------------------------------------------------------------- */
export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  placement?: 'bottom' | 'top';
  triggerAriaLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  panelClassName?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  align = 'right',
  placement = 'bottom',
  triggerAriaLabel,
  open: controlledOpen,
  onOpenChange,
  className,
  panelClassName,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isOpen, setOpen]);

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-label={triggerAriaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={isOpen ? panelId : undefined}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!isOpen);
          }
        }}
        className="inline-flex rounded-[var(--radius-md)]"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          id={panelId}
          className={cn(
            'absolute z-[var(--z-popover)] min-w-[220px] rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] border border-[var(--border)] shadow-[var(--shadow-overlay)] p-2',
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/* ----------------------------------------------------------------------------
   Dropdown Menu
---------------------------------------------------------------------------- */
export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  placement?: 'bottom' | 'top';
  triggerAriaLabel?: string;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  placement = 'bottom',
  triggerAriaLabel,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const firstEnabled = menuRef.current.querySelector<HTMLButtonElement>(
      '[role="menuitem"]:not([disabled])'
    );
    firstEnabled?.focus();
  }, [open]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!menuRef.current) return;
    const menuItems = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])'
      )
    );
    if (menuItems.length === 0) return;

    const currentIdx = menuItems.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = menuItems[(currentIdx + 1) % menuItems.length];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = menuItems[(currentIdx - 1 + menuItems.length) % menuItems.length];
      prev?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      menuItems[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      menuItems[menuItems.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <Popover
      trigger={trigger}
      align={align}
      placement={placement}
      triggerAriaLabel={triggerAriaLabel}
      open={open}
      onOpenChange={setOpen}
      className={className}
      panelClassName="p-1.5 min-w-[200px]"
    >
      <div
        ref={menuRef}
        role="menu"
        onKeyDown={handleMenuKeyDown}
        className="flex flex-col gap-0.5"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              setOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] text-left transition-colors duration-[var(--duration-fast)] cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
              item.danger
                ? 'text-[var(--danger)] hover:bg-[var(--danger-subtle)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            )}
          >
            {item.icon && <span className="shrink-0 inline-flex">{item.icon}</span>}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </Popover>
  );
};
