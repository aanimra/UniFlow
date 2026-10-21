
import { Card } from '../components/ui/Card/Card';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div>
      <h1>{title}</h1>

      <p style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>

      <div style={{ marginTop: 24 }}>
        <Card
          title="Розділ у розробці"
          description="Навігація вже працює. Функціональність цієї сторінки додамо наступним етапом."
          variant="outlined"
        />
      </div>
    </div>
  );
}
