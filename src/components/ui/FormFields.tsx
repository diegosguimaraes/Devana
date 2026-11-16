import React, { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from './utils';

interface FieldWrapperProps {
  id: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  id,
  label,
  helperText,
  error,
  required,
  className,
  children,
}) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[var(--text-secondary)]"
      >
        {label}
        {required && (
          <span className="text-[var(--danger)] ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}
    {children}
    {error ? (
      <p
        id={`${id}-error`}
        role="alert"
        className="text-xs font-medium text-[var(--danger)]"
      >
        {error}
      </p>
    ) : helperText ? (
      <p id={`${id}-helper`} className="text-xs text-[var(--text-muted)]">
        {helperText}
      </p>
    ) : null}
  </div>
);

const CONTROL_BASE =
  'w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-[border-color,background-color,box-shadow] duration-[var(--duration-fast)] focus:bg-[var(--surface)] focus:border-[var(--primary)] disabled:opacity-55 disabled:cursor-not-allowed';

const CONTROL_ERROR = 'border-[var(--danger-solid)] focus:border-[var(--danger-solid)]';

/* ----------------------------------------------------------------------------
   Input
---------------------------------------------------------------------------- */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAdornment?: React.ReactNode;
}

/**
 * Input acessível com label associada, estados de erro e suporte a ícone/adornment.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { id, label, helperText, error, required, leftAdornment, className, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const describedBy = error
      ? `${inputId}-error`
      : helperText
        ? `${inputId}-helper`
        : undefined;

    return (
      <FieldWrapper
        id={inputId}
        label={label}
        helperText={helperText}
        error={error}
        required={required}
      >
        <div className="relative flex items-center">
          {leftAdornment && (
            <span className="absolute left-3 text-[var(--text-muted)] pointer-events-none inline-flex">
              {leftAdornment}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(
              CONTROL_BASE,
              'h-10 px-3.5',
              Boolean(leftAdornment) && 'pl-9',
              Boolean(error) && CONTROL_ERROR,
              className
            )}
            {...props}
          />
        </div>
      </FieldWrapper>
    );
  }
);
Input.displayName = 'Input';

/* ----------------------------------------------------------------------------
   Textarea
---------------------------------------------------------------------------- */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, helperText, error, required, className, ...props }, ref) => {
    const generatedId = useId();
    const areaId = id || generatedId;
    const describedBy = error
      ? `${areaId}-error`
      : helperText
        ? `${areaId}-helper`
        : undefined;

    return (
      <FieldWrapper
        id={areaId}
        label={label}
        helperText={helperText}
        error={error}
        required={required}
      >
        <textarea
          ref={ref}
          id={areaId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_BASE,
            'p-3.5 min-h-[96px]',
            Boolean(error) && CONTROL_ERROR,
            className
          )}
          {...props}
        />
      </FieldWrapper>
    );
  }
);
Textarea.displayName = 'Textarea';

/* ----------------------------------------------------------------------------
   Select
---------------------------------------------------------------------------- */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { id, label, helperText, error, required, options, children, className, ...props },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const describedBy = error
      ? `${selectId}-error`
      : helperText
        ? `${selectId}-helper`
        : undefined;

    return (
      <FieldWrapper
        id={selectId}
        label={label}
        helperText={helperText}
        error={error}
        required={required}
      >
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_BASE,
            'h-10 px-3.5 cursor-pointer',
            Boolean(error) && CONTROL_ERROR,
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      </FieldWrapper>
    );
  }
);
Select.displayName = 'Select';

/* ----------------------------------------------------------------------------
   Checkbox
---------------------------------------------------------------------------- */
export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, error, className, checked, ...props }, ref) => {
    const generatedId = useId();
    const checkId = id || generatedId;

    return (
      <div className={cn('space-y-1', className)}>
        <label
          htmlFor={checkId}
          className="inline-flex items-start gap-2.5 cursor-pointer select-none"
        >
          <span className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              id={checkId}
              type="checkbox"
              checked={checked}
              aria-invalid={Boolean(error) || undefined}
              className="peer sr-only"
              {...props}
            />
            <span
              aria-hidden="true"
              className={cn(
                'w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors duration-[var(--duration-fast)]',
                'border-[var(--border-strong)] bg-[var(--surface)]',
                'peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] text-white',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]',
                Boolean(error) && 'border-[var(--danger-solid)]'
              )}
            >
              {checked && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
          </span>
          <span className="text-xs sm:text-sm leading-snug">
            <span className="font-medium text-[var(--text-primary)] block">{label}</span>
            {description && (
              <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                {description}
              </span>
            )}
          </span>
        </label>
        {error && (
          <p role="alert" className="text-xs font-medium text-[var(--danger)] pl-6">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

/* ----------------------------------------------------------------------------
   Radio
---------------------------------------------------------------------------- */
export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;
  description?: string;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ id, label, description, error, className, checked, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;

    return (
      <div className={cn('space-y-1', className)}>
        <label
          htmlFor={radioId}
          className="inline-flex items-start gap-2.5 cursor-pointer select-none"
        >
          <span className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              id={radioId}
              type="radio"
              checked={checked}
              aria-invalid={Boolean(error) || undefined}
              className="peer sr-only"
              {...props}
            />
            <span
              aria-hidden="true"
              className={cn(
                'w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-[var(--duration-fast)]',
                'border-[var(--border-strong)] bg-[var(--surface)]',
                'peer-checked:border-[var(--primary)]',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]',
                Boolean(error) && 'border-[var(--danger-solid)]'
              )}
            >
              {checked && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
            </span>
          </span>
          <span className="text-xs sm:text-sm leading-snug">
            <span className="font-medium text-[var(--text-primary)] block">{label}</span>
            {description && (
              <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                {description}
              </span>
            )}
          </span>
        </label>
        {error && (
          <p role="alert" className="text-xs font-medium text-[var(--danger)] pl-6">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Radio.displayName = 'Radio';

/* ----------------------------------------------------------------------------
   Switch
---------------------------------------------------------------------------- */
export interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  error,
  className,
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-4">
        {(label || description) && (
          <label htmlFor={switchId} className="cursor-pointer select-none">
            {label && (
              <span className="block text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                {label}
              </span>
            )}
            {description && (
              <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                {description}
              </span>
            )}
          </label>
        )}
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] disabled:opacity-50 disabled:cursor-not-allowed',
            checked ? 'bg-[var(--primary)]' : 'bg-[var(--border-strong)]'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
};
