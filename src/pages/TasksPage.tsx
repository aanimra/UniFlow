
import { useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, Clock3, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { useStudy } from '../hooks/useStudy';
import { toLocalDate } from '../data/initialData';

import { Button } from '../components/ui/Button/Button';
import { Input } from '../components/ui/Input/Input';
import { Select } from '../components/ui/Select/Select';
import { Badge } from '../components/ui/Badge/Badge';
import { Card } from '../components/ui/Card/Card';

import type { Priority, StudyTask } from '../types';
import './TasksPage.css';

type Difficulty = NonNullable<StudyTask['difficulty']>;
type TaskStatusFilter = 'all' | 'active' | 'completed';
type TaskSort = 'deadline' | 'priority' | 'newest';

interface TaskDraft {
  title: string;
  subjectId: string;
  description: string;
  deadline: string;
  scheduledTime: string;
  priority: Priority;
  difficulty: '' | Difficulty;
  estimatedMinutes: string;
}

const priorityLabels: Record<Priority, string> = {
  high: 'Високий',
  medium: 'Середній',
  low: 'Низький',
};

const priorityScores: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Легка',
  medium: 'Середня',
  hard: 'Складна',
};

function emptyTaskDraft(): TaskDraft {
  return {
    title: '',
    subjectId: '',
    description: '',
    deadline: '',
    scheduledTime: '',
    priority: 'medium',
    difficulty: '',
    estimatedMinutes: '',
  };
}

function formatDeadline(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    'uk-UA',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

export function TasksPage() {
  const {
    semesters,
    subjects,
    tasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = useStudy();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [formError, setFormError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<TaskStatusFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState<TaskSort>('deadline');

  const today = toLocalDate(new Date());

  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.filter((task) => task.completed).length;

  const subjectOptions = subjects.map((subject) => {
    const semester = semesters.find(
      (item) => item.id === subject.semesterId
    );

    return {
      value: subject.id,
      label: semester
        ? `${subject.name} — ${semester.name}`
        : subject.name,
    };
  });

  function getSubjectName(id: string): string {
    return subjects.find((subject) => subject.id === id)?.name
      ?? 'Невідомий предмет';
  }

  const normalizedSearch = search.trim().toLocaleLowerCase('uk-UA');

  const visibleTasks = tasks
    .filter((task) => {
      if (statusFilter === 'active' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;

      if (subjectFilter !== 'all' && task.subjectId !== subjectFilter) {
        return false;
      }

      const searchableText = [
        task.title,
        task.description ?? '',
        getSubjectName(task.subjectId),
      ].join(' ').toLocaleLowerCase('uk-UA');

      return searchableText.includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const difference =
          priorityScores[b.priority] - priorityScores[a.priority];

        return difference || a.deadline.localeCompare(b.deadline);
      }

      if (sortBy === 'newest') {
        return b.createdAt.localeCompare(a.createdAt);
      }

      return (
        a.deadline.localeCompare(b.deadline) ||
        priorityScores[b.priority] - priorityScores[a.priority]
      );
    });

  function openCreateForm() {
    setEditingTaskId(null);
    setDraft({
      ...emptyTaskDraft(),
      subjectId: subjects[0]?.id ?? '',
    });
    setFormError('');
    setFormOpen(true);
  }

  function openEditForm(task: StudyTask) {
    setEditingTaskId(task.id);
    setDraft({
      title: task.title,
      subjectId: task.subjectId,
      description: task.description ?? '',
      deadline: task.deadline,
      scheduledTime: task.scheduledTime ?? '',
      priority: task.priority,
      difficulty: task.difficulty ?? '',
      estimatedMinutes: task.estimatedMinutes?.toString() ?? '',
    });
    setFormError('');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingTaskId(null);
    setFormError('');
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    const title = draft.title.trim();

    if (!title) {
      setFormError('Введи назву завдання.');
      return;
    }

    if (title.length > 120) {
      setFormError('Назва завдання не може перевищувати 120 символів.');
      return;
    }

    if (!draft.subjectId ||
        !subjects.some((subject) => subject.id === draft.subjectId)) {
      setFormError('Обери навчальний предмет.');
      return;
    }

    if (!draft.deadline ||
        !/^\d{4}-\d{2}-\d{2}$/.test(draft.deadline) ||
        Number.isNaN(new Date(`${draft.deadline}T12:00:00`).getTime())) {
      setFormError('Вкажи коректну дату дедлайну.');
      return;
    }

    if (!['low', 'medium', 'high'].includes(draft.priority)) {
      setFormError('Обери пріоритет завдання.');
      return;
    }

    const minutes = draft.estimatedMinutes.trim()
      ? Number(draft.estimatedMinutes)
      : undefined;

    if (
      minutes !== undefined &&
      (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)
    ) {
      setFormError('Час виконання має бути від 1 до 1440 хвилин.');
      return;
    }

    if (
      draft.scheduledTime &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.scheduledTime)
    ) {
      setFormError('Вкажи коректний час у форматі ГГ:ХХ.');
      return;
    }

    const existingTask = tasks.find(
      (task) => task.id === editingTaskId
    );

    const task: StudyTask = {
      id: existingTask?.id ?? crypto.randomUUID(),
      subjectId: draft.subjectId,
      title,
      description: draft.description.trim() || undefined,
      deadline: draft.deadline,
      scheduledTime: draft.scheduledTime || undefined,
      priority: draft.priority,
      difficulty: draft.difficulty || undefined,
      estimatedMinutes: minutes,
      completed: existingTask?.completed ?? false,
      createdAt: existingTask?.createdAt ?? new Date().toISOString(),
      completedAt: existingTask?.completedAt,
    };

    if (existingTask) {
      updateTask(task);
    } else {
      addTask(task);
    }

    closeForm();
  }

  function removeTask(task: StudyTask) {
    const confirmed = window.confirm(
      `Видалити завдання «${task.title}»?\n\n` +
      'Цю дію неможливо скасувати.'
    );

    if (!confirmed) return;

    deleteTask(task.id);

    if (editingTaskId === task.id) {
      closeForm();
    }
  }

  function renderDeadlineBadge(task: StudyTask) {
    if (task.completed) {
      return <Badge variant="success">Виконано</Badge>;
    }

    if (task.deadline < today) {
      return <Badge variant="danger">Прострочено</Badge>;
    }

    if (task.deadline === today) {
      return <Badge variant="warning">Сьогодні</Badge>;
    }

    return <Badge variant="primary">Заплановано</Badge>;
  }

  function renderPriorityBadge(priority: Priority) {
    const variant =
      priority === 'high'
        ? 'danger'
        : priority === 'medium'
          ? 'warning'
          : 'neutral';

    return (
      <Badge variant={variant}>
        {priorityLabels[priority]} пріоритет
      </Badge>
    );
  }

  return (
    <div className="uf-tasks">
      <header className="uf-tasks__heading">
        <div>
          <p className="uf-tasks__eyebrow">ПЛАНУВАННЯ НАВЧАННЯ</p>
          <h1>Мої завдання</h1>
          <p>
            Створюй завдання, керуй дедлайнами та відстежуй виконання.
          </p>
        </div>

        <Button
          onClick={openCreateForm}
          disabled={subjects.length === 0}
        >
          <Plus size={18} aria-hidden="true" />
          Нове завдання
        </Button>
      </header>

      <div className="uf-tasks__stats">
        <Card variant="outlined">
          <div className="uf-tasks__stat">
            <span>Усього завдань</span>
            <strong>{tasks.length}</strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-tasks__stat">
            <span>Активні</span>
            <strong>{activeCount}</strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-tasks__stat">
            <span>Виконані</span>
            <strong>{completedCount}</strong>
          </div>
        </Card>
      </div>

      {subjects.length === 0 && (
        <div className="uf-tasks__notice" role="status">
          Щоб створити завдання, спочатку додай семестр і предмет
          у розділі «Предмети».
        </div>
      )}

      {formOpen && (
        <section aria-label="Форма завдання">
          <Card
            title={
              editingTaskId
                ? 'Редагування завдання'
                : 'Нове завдання'
            }
            description="Поля зі зірочкою є обов'язковими."
            variant="outlined"
          >
            <form className="uf-task-form" onSubmit={saveTask} noValidate>
              <Input
                label="Назва завдання"
                required
                maxLength={120}
                value={draft.title}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
                placeholder="Наприклад, виконати лабораторну роботу"
              />

              <Select
                label="Навчальний предмет"
                required
                options={subjectOptions}
                placeholder="Обери предмет"
                value={draft.subjectId}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    subjectId: event.target.value,
                  }))
                }
              />

              <div className="uf-task-form__grid">
                <Input
                  label="Дедлайн"
                  type="date"
                  required
                  value={draft.deadline}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      deadline: event.target.value,
                    }))
                  }
                />

                <Select
                  label="Пріоритет"
                  required
                  options={[
                    { value: 'low', label: 'Низький' },
                    { value: 'medium', label: 'Середній' },
                    { value: 'high', label: 'Високий' },
                  ]}
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      priority: event.target.value as Priority,
                    }))
                  }
                />
              </div>

              <div className="uf-task-form__grid">
                <Select
                  label="Складність"
                  placeholder="Не вказувати"
                  options={[
                    { value: 'easy', label: 'Легка' },
                    { value: 'medium', label: 'Середня' },
                    { value: 'hard', label: 'Складна' },
                  ]}
                  value={draft.difficulty}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      difficulty: event.target.value as '' | Difficulty,
                    }))
                  }
                />

                <Input
                  label="Орієнтовний час (хв)"
                  type="number"
                  min={1}
                  max={1440}
                  step={1}
                  value={draft.estimatedMinutes}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      estimatedMinutes: event.target.value,
                    }))
                  }
                  placeholder="Наприклад, 60"
                />
              </div>

              <Input
                label="Запланований час початку"
                type="time"
                value={draft.scheduledTime}
                hint="Необов'язково. Використаємо в календарі Week."
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    scheduledTime: event.target.value,
                  }))
                }
              />

              <div className="uf-task-form__description">
                <label htmlFor="task-description">
                  Опис завдання
                </label>

                <textarea
                  id="task-description"
                  rows={4}
                  maxLength={2000}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Що саме потрібно зробити?"
                />
                <small>Необов'язкове поле</small>
              </div>

              {formError && (
                <p className="uf-task-form__error" role="alert">
                  {formError}
                </p>
              )}

              <div className="uf-task-form__actions">
                <Button type="submit">
                  {editingTaskId
                    ? 'Зберегти зміни'
                    : 'Створити завдання'}
                </Button>

                <Button variant="outline" onClick={closeForm}>
                  Скасувати
                </Button>
              </div>
            </form>
          </Card>
        </section>
      )}

      <section aria-labelledby="task-list-heading">
        <div className="uf-tasks__list-heading">
          <h2 id="task-list-heading">Список завдань</h2>
          <span>
            Знайдено: {visibleTasks.length}
          </span>
        </div>

        <div className="uf-tasks__filters">
          <Input
            label="Пошук"
            placeholder="Назва, предмет або опис"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select
            label="Статус"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TaskStatusFilter)
            }
            options={[
              { value: 'all', label: 'Усі' },
              { value: 'active', label: 'Активні' },
              { value: 'completed', label: 'Виконані' },
            ]}
          />

          <Select
            label="Предмет"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            options={[
              { value: 'all', label: 'Усі предмети' },
              ...subjectOptions,
            ]}
          />

          <Select
            label="Сортування"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as TaskSort)
            }
            options={[
              { value: 'deadline', label: 'За дедлайном' },
              { value: 'priority', label: 'За пріоритетом' },
              { value: 'newest', label: 'Найновіші' },
            ]}
          />
        </div>

        {visibleTasks.length === 0 ? (
          <div className="uf-tasks__empty">
            <Search size={30} aria-hidden="true" />
            <h3>Завдань не знайдено</h3>
            <p>
              Зміни параметри пошуку або створи нове завдання.
            </p>
          </div>
        ) : (
          <div className="uf-tasks__list">
            {visibleTasks.map((task) => (
              <Card
                key={task.id}
                variant="outlined"
                className={[
                  'uf-task-card',
                  task.completed && 'uf-task-card--completed',
                ].filter(Boolean).join(' ')}
              >
                <div className="uf-task-card__content">
                  <input
                    type="checkbox"
                    className="uf-task-card__checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? `Повернути в активні: ${task.title}`
                        : `Позначити виконаним: ${task.title}`
                    }
                  />

                  <div className="uf-task-card__details">
                    <h3>{task.title}</h3>

                    <p className="uf-task-card__subject">
                      {getSubjectName(task.subjectId)}
                    </p>

                    {task.description && (
                      <p className="uf-task-card__description">
                        {task.description}
                      </p>
                    )}

                    <div className="uf-task-card__badges">
                      {renderDeadlineBadge(task)}
                      {renderPriorityBadge(task.priority)}
                      {task.difficulty && (
                        <Badge variant="neutral">
                          {difficultyLabels[task.difficulty]}
                        </Badge>
                      )}
                    </div>

                    <div className="uf-task-card__metadata">
                      <span>
                        <CalendarDays size={15} aria-hidden="true" />
                        {formatDeadline(task.deadline)}
                      </span>

                      {task.scheduledTime && (
                        <span>
                          <Clock3 size={15} aria-hidden="true" />
                          {task.scheduledTime}
                        </span>
                      )}

                      {task.estimatedMinutes && (
                        <span>
                          <Clock3 size={15} aria-hidden="true" />
                          {task.estimatedMinutes} хв
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="uf-task-card__actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm(task)}
                  >
                    <Pencil size={15} aria-hidden="true" />
                    Редагувати
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeTask(task)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Видалити
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
