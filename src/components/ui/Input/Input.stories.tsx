
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'UniFlow/UI Kit/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'Назва завдання',
    placeholder: 'Наприклад, виконати лабораторну',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: 'Лабораторна робота №3',
  },
};

export const Required: Story = {
  args: {
    required: true,
    hint: 'Обов’язкове поле',
  },
};

export const WithHint: Story = {
  args: {
    hint: 'Вкажи коротку та зрозумілу назву',
  },
};

export const Error: Story = {
  args: {
    error: 'Введи назву завдання',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Недоступне поле',
  },
};

export const Focus: Story = {
  args: {
    autoFocus: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: 24,
        width: 'min(500px, 80vw)',
      }}
    >
      <Input label="Default" placeholder="Введи значення" />
      <Input
        label="With value"
        defaultValue="Підготовка до іспиту"
      />
      <Input
        label="Required"
        required
        placeholder="Обов’язкове поле"
      />
      <Input
        label="Error"
        error="Це поле необхідно заповнити"
      />
      <Input
        label="Disabled"
        defaultValue="Недоступно"
        disabled
      />
    </div>
  ),
};
