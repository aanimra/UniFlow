
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const priorityOptions = [
  { value: 'high', label: 'Високий' },
  { value: 'medium', label: 'Середній' },
  { value: 'low', label: 'Низький' },
];

const subjectOptions = [
  { value: 'networks', label: "Комп'ютерні мережі" },
  { value: 'design', label: 'Основи UI/UX' },
  { value: 'programming', label: 'Програмування' },
];

const meta = {
  title: 'UniFlow/UI Kit/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'Пріоритет',
    options: priorityOptions,
    placeholder: 'Обери пріоритет',
    defaultValue: '',
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    defaultValue: 'high',
  },
};

export const Required: Story = {
  args: {
    required: true,
    hint: 'Вкажи пріоритет завдання',
  },
};

export const Error: Story = {
  args: {
    required: true,
    error: 'Обери пріоритет',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'medium',
  },
};

export const SubjectSelection: Story = {
  args: {
    label: 'Навчальний предмет',
    options: subjectOptions,
    placeholder: 'Обери предмет',
    required: true,
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
      <Select
        label="Default"
        options={priorityOptions}
        defaultValue=""
      />
      <Select
        label="Selected"
        options={priorityOptions}
        defaultValue="high"
      />
      <Select
        label="Required"
        options={priorityOptions}
        defaultValue=""
        required
      />
      <Select
        label="Error"
        options={priorityOptions}
        defaultValue=""
        error="Потрібно обрати значення"
      />
      <Select
        label="Disabled"
        options={priorityOptions}
        defaultValue="medium"
        disabled
      />
    </div>
  ),
};
