import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

export type CardVariant = 'default' | 'outlined' | 'soft';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  variant?: CardVariant;
  headingLevel?: 2 | 3 | 4;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Card({
  title,
  description,
  variant = 'default',
  headingLevel = 3,
  children,
  footer,
  className = '',
  ...rest
}: CardProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div
      {...rest}
      className={[
        'uf-card',
        `uf-card--${variant}`,
        className,
      ].filter(Boolean).join(' ')}
    >
      {(title || description) && (
        <div className="uf-card__header">
          {title && (
            <Heading className="uf-card__title">{title}</Heading>
          )}
          {description && (
            <p className="uf-card__description">
              {description}
            </p>
          )}
        </div>
      )}

      {children && (
        <div className="uf-card__body">
          {children}
        </div>
      )}

      {footer && (
        <div className="uf-card__footer">
          {footer}
        </div>
      )}
    </div>
  );
}
