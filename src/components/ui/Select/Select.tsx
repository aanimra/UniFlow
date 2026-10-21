
import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Select({
  label,
  options,
  placeholder = 'Обери значення',
  hint,
  error,
  fullWidth = true,
  id,
  className = '',
  required,
  disabled,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;

  const describedBy = [
    ariaDescribedBy,
    hint ? hintId : undefined,
    error ? errorId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={[
        'uf-select-field',
        fullWidth && 'uf-select-field--full',
        className,
      ].filter(Boolean).join(' ')}
    >
      <label className="uf-select-field__label" htmlFor={selectId}>
        {label}
        {required && (
          <span
            className="uf-select-field__required"
            aria-hidden="true"
          >
            {' '}*
          </span>
        )}
      </label>

      <select
        {...rest}
        id={selectId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'uf-select',
          error && 'uf-select--error',
        ].filter(Boolean).join(' ')}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {hint && (
        <p className="uf-select-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {error && (
        <p className="uf-select-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
