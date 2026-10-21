
import { useState } from 'react';
import { Button } from './components/ui/Button/Button';

function App() {
  const [message, setMessage] = useState('');

  return (
    <main
      style={{
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        padding: 'var(--space-8)',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--color-primary-soft)',
          color: 'var(--color-primary-active)',
          borderRadius: 'var(--radius-full)',
          fontWeight: 600,
          marginBottom: 'var(--space-6)',
        }}
      >
        UniFlow · Student Planner
      </span>

      <h1>Навчання без хаосу.</h1>

      <p style={{ color: 'var(--color-text-secondary)' }}>
        Організовуй предмети, завдання, дедлайни
        та час для зосередженої роботи.
      </p>

      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)',
          marginTop: 'var(--space-8)',
        }}
      >
        <h2>Твій навчальний простір</h2>

        <p>
          Це перший інтерактивний компонент UniFlow.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={() => setMessage('Кнопка працює!')}
          >
            Додати завдання
          </Button>

          <Button
            variant="outline"
            onClick={() => setMessage('Дію скасовано')}
          >
            Скасувати
          </Button>
        </div>

        {message && (
          <p
            role="status"
            style={{
              marginTop: 'var(--space-4)',
              color: 'var(--color-success)',
            }}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;
