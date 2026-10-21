
import type {
  Semester,
  Subject,
  StudyTask,
} from '../types';

export function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function dateAfterDays(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);

  return toLocalDate(date);
}

const currentYear = new Date().getFullYear();

export const initialSemesters: Semester[] = [
  {
    id: 'semester-1',
    name: 'Поточний семестр',
    startDate: `${currentYear}-09-01`,
    endDate: `${currentYear + 1}-01-31`,
  },
];

export const initialSubjects: Subject[] = [
  {
    id: 'subject-1',
    semesterId: 'semester-1',
    name: "Комп'ютерні мережі",
    teacher: 'Викладач',
    color: '#5946C8',
  },
  {
    id: 'subject-2',
    semesterId: 'semester-1',
    name: 'Основи UI/UX',
    color: '#16866C',
  },
  {
    id: 'subject-3',
    semesterId: 'semester-1',
    name: 'Програмування',
    color: '#B96C29',
  },
];

export const initialTasks: StudyTask[] = [
  {
    id: 'task-1',
    subjectId: 'subject-1',
    title: 'Підготувати лабораторну роботу',
    description: 'Перевірити результати та оформити звіт.',
    deadline: dateAfterDays(0),
    priority: 'high',
    difficulty: 'medium',
    estimatedMinutes: 90,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    subjectId: 'subject-2',
    title: 'Створити UI-kit у Storybook',
    deadline: dateAfterDays(1),
    priority: 'high',
    estimatedMinutes: 120,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    subjectId: 'subject-3',
    title: 'Повторити TypeScript',
    deadline: dateAfterDays(3),
    priority: 'medium',
    estimatedMinutes: 60,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    subjectId: 'subject-2',
    title: 'Проаналізувати UX-референси',
    deadline: dateAfterDays(-1),
    priority: 'low',
    completed: true,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
];
