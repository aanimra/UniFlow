
import type { HTMLAttributes, ReactNode } from 'react';
import './Badge.css';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = 'neutral',
  children,
  className = '',
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={[
        'uf-badge',
        `uf-badge--${variant}`,
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  );
}
