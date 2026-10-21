
import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import './Input.css';

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  hint,
  error,
  fullWidth = true,
  id,
  className = '',
  required,
  disabled,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy = [
    ariaDescribedBy,
    hint ? hintId : undefined,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div
      className={[
        'uf-field',
        fullWidth && 'uf-field--full',
        className,
      ].filter(Boolean).join(' ')}
    >
      <label className="uf-field__label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="uf-field__required" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>

      <input
        {...rest}
        id={inputId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'uf-input',
          error && 'uf-input--error',
        ].filter(Boolean).join(' ')}
      />

      {hint && (
        <p className="uf-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {error && (
        <p className="uf-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
