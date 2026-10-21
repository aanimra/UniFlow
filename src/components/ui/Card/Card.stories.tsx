
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';

const meta = {
  title: 'UniFlow/UI Kit/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    title: 'Навчальне завдання',
    description: 'Інформація про заплановану роботу',
    variant: 'default',
    children: 'Підготувати матеріали до заняття.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'soft'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(360px, 85vw)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
};

export const Soft: Story = {
  args: {
    variant: 'soft',
  },
};

export const TaskCard: Story = {
  args: {
    title: 'Лабораторна робота №3',
    description: "Комп'ютерні мережі",
    children: (
      <div style={{ display: 'grid', gap: 12 }}>
        <Badge variant="danger">Високий пріоритет</Badge>
        <p style={{ margin: 0 }}>
          Підготувати звіт та перевірити результати.
        </p>
      </div>
    ),
    footer: (
      <Button size="sm" variant="primary">
        Переглянути завдання
      </Button>
    ),
  },
};

export const SubjectCard: Story = {
  args: {
    title: 'Основи UI/UX',
    description: 'Навчальний предмет',
    children: (
      <div style={{ display: 'grid', gap: 12 }}>
        <Badge variant="primary">4 активні завдання</Badge>
        <p style={{ margin: 0 }}>
          Найближчий дедлайн: цього тижня
        </p>
      </div>
    ),
  },
};

export const StatisticsCard: Story = {
  args: {
    title: 'Виконані завдання',
    description: 'Прогрес навчання',
    children: (
      <strong
        style={{
          display: 'block',
          fontSize: 36,
          color: 'var(--color-primary)',
        }}
      >
        12
      </strong>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Режим концентрації',
    description: 'Працюй над одним завданням',
    children: 'Запусти таймер для зосередженої роботи.',
    footer: (
      <Button variant="primary">
        Почати фокус
      </Button>
    ),
  },
};
