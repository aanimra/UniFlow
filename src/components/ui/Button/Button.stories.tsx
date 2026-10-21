
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'UniFlow/UI Kit/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Додати завдання',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'danger'],
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Видалити',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Збереження...',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const Hover: Story = {
  args: {},
  decorators: [
    (StoryComponent) => (
      <div className="button-story--hover">
        <StoryComponent />
      </div>
    ),
  ],
};

export const Active: Story = {
  args: {},
  decorators: [
    (StoryComponent) => (
      <div className="button-story--active">
        <StoryComponent />
      </div>
    ),
  ],
};

export const Focus: Story = {
  args: {},
  decorators: [
    (StoryComponent) => (
      <div className="button-story--focus">
        <StoryComponent />
      </div>
    ),
  ],
};

export const AllStates: Story = {
  args: {},
  render: () => {
    const examples = [
      { label: 'Default', className: '' },
      { label: 'Hover', className: 'button-story--hover' },
      { label: 'Active', className: 'button-story--active' },
      { label: 'Focus', className: 'button-story--focus' },
    ];

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          padding: '24px',
        }}
      >
        {examples.map((example) => (
          <div
            key={example.label}
            className={example.className}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span>{example.label}</span>
            <Button>Додати завдання</Button>
          </div>
        ))}

        <div style={{ display: 'grid', gap: '12px' }}>
          <span>Disabled</span>
          <Button disabled>Додати завдання</Button>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <span>Loading</span>
          <Button loading>Збереження...</Button>
        </div>
      </div>
    );
  },
};
