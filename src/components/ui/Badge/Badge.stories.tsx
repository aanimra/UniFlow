
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'UniFlow/UI Kit/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'У процесі',
    variant: 'neutral',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'success',
        'warning',
        'danger',
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Заплановано',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Виконано',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Наближається дедлайн',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Прострочено',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <Badge variant="neutral">У процесі</Badge>
      <Badge variant="primary">Заплановано</Badge>
      <Badge variant="success">Виконано</Badge>
      <Badge variant="warning">Незабаром</Badge>
      <Badge variant="danger">Прострочено</Badge>
    </div>
  ),
};

export const Priorities: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Badge variant="danger">Високий</Badge>
      <Badge variant="warning">Середній</Badge>
      <Badge variant="neutral">Низький</Badge>
    </div>
  ),
};
