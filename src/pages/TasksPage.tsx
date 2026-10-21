
import { useState } from 'react';
import type { FormEvent } from 'react';

import {
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { useStudy } from '../hooks/useStudy';
import { toLocalDate } from '../data/initialData';

import { Button } from '../components/ui/Button/Button';
import { Input } from '../components/ui/Input/Input';
import { Select } from '../components/ui/Select/Select';
import { Badge } from '../components/ui/Badge/Badge';
import { Card } from '../components/ui/Card/Card';

import type { Priority, StudyTask } from '../types';

import './TasksPage.css';

// ============================================
// TYPES
// ============================================

type Difficulty = NonNullable<StudyTask['difficulty']>;

type TaskStatusFilter = 'all' | 'active' | 'completed';

type TaskSort = 'deadline' | 'priority' | 'newest';

interface TaskDraft {
  title: string;
  subjectId: string;
  description: string;
  deadline: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: Priority;
  difficulty: '' | Difficulty;
  estimatedMinutes: string;
}

// ============================================
// CONSTANTS
// ============================================

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

// ============================================
// HELPERS
// ============================================

function emptyTaskDraft(): TaskDraft {
  return {
    title: '',
    subjectId: '',
    description: '',
    deadline: '',
    scheduledDate: '',
    scheduledTime: '',
    priority: 'medium',
    difficulty: '',
    estimatedMinutes: '',
  };
}

function formatDeadline(value: string): string {
  const date = new Date(`${value}T12:00:00`);

  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Перевіряємо, що рядок містить справжню
 * календарну дату у форматі YYYY-MM-DD.
 *
 * Наприклад, 2026-02-30 не є коректною датою.
 */
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split('-')
    .map(Number);

  const date = new Date(0);

  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// ============================================
// COMPONENT
// ============================================

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

  // ==========================================
  // FORM STATE
  // ==========================================

  const [formOpen, setFormOpen] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<
    string | null
  >(null);

  const [draft, setDraft] = useState<TaskDraft>(
    emptyTaskDraft
  );

  const [formError, setFormError] = useState('');

  // ==========================================
  // FILTER STATE
  // ==========================================

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] =
    useState<TaskStatusFilter>('all');

  const [subjectFilter, setSubjectFilter] =
    useState('all');

  const [sortBy, setSortBy] =
    useState<TaskSort>('deadline');

  const today = toLocalDate(new Date());

  // ==========================================
  // STATISTICS
  // ==========================================

  const activeCount = tasks.filter(
    (task) => !task.completed
  ).length;

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  // ==========================================
  // SUBJECT OPTIONS
  // ==========================================

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
    return (
      subjects.find((subject) => subject.id === id)
        ?.name ?? 'Невідомий предмет'
    );
  }

  // ==========================================
  // SEARCH, FILTERING AND SORTING
  // ==========================================

  const normalizedSearch = search
    .trim()
    .toLocaleLowerCase('uk-UA');

  const visibleTasks = tasks
    .filter((task) => {
      // Filter by completion status
      if (
        statusFilter === 'active' &&
        task.completed
      ) {
        return false;
      }

      if (
        statusFilter === 'completed' &&
        !task.completed
      ) {
        return false;
      }

      // Filter by subject
      if (
        subjectFilter !== 'all' &&
        task.subjectId !== subjectFilter
      ) {
        return false;
      }

      // Search by title, description and subject
      const searchableText = [
        task.title,
        task.description ?? '',
        getSubjectName(task.subjectId),
      ]
        .join(' ')
        .toLocaleLowerCase('uk-UA');

      return searchableText.includes(normalizedSearch);
    })
    .sort((a, b) => {
      // Sort by priority
      if (sortBy === 'priority') {
        const difference =
          priorityScores[b.priority] -
          priorityScores[a.priority];

        return (
          difference ||
          a.deadline.localeCompare(b.deadline)
        );
      }

      // Sort by creation date
      if (sortBy === 'newest') {
        return b.createdAt.localeCompare(
          a.createdAt
        );
      }

      // Default: sort by deadline
      return (
        a.deadline.localeCompare(b.deadline) ||
        priorityScores[b.priority] -
          priorityScores[a.priority]
      );
    });

  // ==========================================
  // OPEN CREATE FORM
  // ==========================================

  function openCreateForm() {
    setEditingTaskId(null);

    setDraft({
      ...emptyTaskDraft(),
      subjectId: subjects[0]?.id ?? '',
    });

    setFormError('');
    setFormOpen(true);
  }

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  function openEditForm(task: StudyTask) {
    setEditingTaskId(task.id);

    setDraft({
      title: task.title,
      subjectId: task.subjectId,
      description: task.description ?? '',
      deadline: task.deadline,

      // Week Calendar fields
      scheduledDate: task.scheduledDate ?? '',
      scheduledTime: task.scheduledTime ?? '',

      priority: task.priority,
      difficulty: task.difficulty ?? '',

      estimatedMinutes:
        task.estimatedMinutes?.toString() ?? '',
    });

    setFormError('');
    setFormOpen(true);
  }

  // ==========================================
  // CLOSE FORM
  // ==========================================

  function closeForm() {
    setFormOpen(false);
    setEditingTaskId(null);
    setFormError('');
  }

  // ==========================================
  // SAVE TASK
  // ==========================================

  function saveTask(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError('');

    const title = draft.title.trim();

    // 1. Validate title
    if (!title) {
      setFormError('Введи назву завдання.');
      return;
    }

    if (title.length > 120) {
      setFormError(
        'Назва завдання не може перевищувати 120 символів.'
      );
      return;
    }

    // 2. Validate subject
    if (
      !draft.subjectId ||
      !subjects.some(
        (subject) =>
          subject.id === draft.subjectId
      )
    ) {
      setFormError('Обери навчальний предмет.');
      return;
    }

    // 3. Validate deadline
    if (
      !draft.deadline ||
      !isValidDate(draft.deadline)
    ) {
      setFormError(
        'Вкажи коректну дату дедлайну.'
      );
      return;
    }

    // 4. Validate priority
    if (
      !['low', 'medium', 'high'].includes(
        draft.priority
      )
    ) {
      setFormError(
        'Обери пріоритет завдання.'
      );
      return;
    }

    // 5. Validate estimated time
    const minutes = draft.estimatedMinutes.trim()
      ? Number(draft.estimatedMinutes)
      : undefined;

    if (
      minutes !== undefined &&
      (
        !Number.isInteger(minutes) ||
        minutes < 1 ||
        minutes > 1440
      )
    ) {
      setFormError(
        'Час виконання має бути від 1 до 1440 хвилин.'
      );
      return;
    }

    // 6. Validate scheduled date
    if (
      draft.scheduledDate &&
      !isValidDate(draft.scheduledDate)
    ) {
      setFormError(
        'Вкажи коректну дату запланованої роботи.'
      );
      return;
    }

    // 7. Validate scheduled time
    if (
      draft.scheduledTime &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        draft.scheduledTime
      )
    ) {
      setFormError(
        'Вкажи коректний час у форматі ГГ:ХХ.'
      );
      return;
    }

    // 8. Find existing task, if editing
    const existingTask = tasks.find(
      (task) => task.id === editingTaskId
    );

    // 9. Build task object
    const task: StudyTask = {
      id:
        existingTask?.id ??
        crypto.randomUUID(),

      subjectId: draft.subjectId,

      title,

      description:
        draft.description.trim() || undefined,

      deadline: draft.deadline,

      // Week Calendar planning
      scheduledDate:
        draft.scheduledDate || undefined,

      scheduledTime:
        draft.scheduledTime || undefined,

      priority: draft.priority,

      difficulty:
        draft.difficulty || undefined,

      estimatedMinutes: minutes,

      completed:
        existingTask?.completed ?? false,

      createdAt:
        existingTask?.createdAt ??
        new Date().toISOString(),

      completedAt:
        existingTask?.completedAt,
    };

    // 10. Create or update
    if (existingTask) {
      updateTask(task);
    } else {
      addTask(task);
    }

    // 11. Close form
    closeForm();
  }

  // ==========================================
  // DELETE TASK
  // ==========================================

  function removeTask(task: StudyTask) {
    const confirmed = window.confirm(
      `Видалити завдання «${task.title}»?\n\n` +
      'Цю дію неможливо скасувати.'
    );

    if (!confirmed) {
      return;
    }

    deleteTask(task.id);

    if (editingTaskId === task.id) {
      closeForm();
    }
  }

  // ==========================================
  // DEADLINE BADGE
  // ==========================================

  function renderDeadlineBadge(
    task: StudyTask
  ) {
    if (task.completed) {
      return (
        <Badge variant="success">
          Виконано
        </Badge>
      );
    }

    if (task.deadline < today) {
      return (
        <Badge variant="danger">
          Прострочено
        </Badge>
      );
    }

    if (task.deadline === today) {
      return (
        <Badge variant="warning">
          Сьогодні
        </Badge>
      );
    }

    return (
      <Badge variant="primary">
        Заплановано
      </Badge>
    );
  }

  // ==========================================
  // PRIORITY BADGE
  // ==========================================

  function renderPriorityBadge(
    priority: Priority
  ) {
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

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="uf-tasks">

      {/* PAGE HEADER */}

      <header className="uf-tasks__heading">
        <div>
          <p className="uf-tasks__eyebrow">
            ПЛАНУВАННЯ НАВЧАННЯ
          </p>

          <h1>Мої завдання</h1>

          <p>
            Створюй завдання, керуй дедлайнами
            та відстежуй виконання.
          </p>
        </div>

        <Button
          onClick={openCreateForm}
          disabled={subjects.length === 0}
        >
          <Plus
            size={18}
            aria-hidden="true"
          />
          Нове завдання
        </Button>
      </header>

      {/* STATISTICS */}

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

      {/* NO SUBJECTS NOTICE */}

      {subjects.length === 0 && (
        <div
          className="uf-tasks__notice"
          role="status"
        >
          Щоб створити завдання, спочатку
          додай семестр і предмет у розділі
          «Предмети».
        </div>
      )}

      {/* CREATE / EDIT FORM */}

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
            <form
              className="uf-task-form"
              onSubmit={saveTask}
              noValidate
            >

              {/* TITLE */}

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

              {/* SUBJECT */}

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

              {/* DEADLINE AND PRIORITY */}

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
                    {
                      value: 'low',
                      label: 'Низький',
                    },
                    {
                      value: 'medium',
                      label: 'Середній',
                    },
                    {
                      value: 'high',
                      label: 'Високий',
                    },
                  ]}
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      priority:
                        event.target.value as Priority,
                    }))
                  }
                />
              </div>

              {/* DIFFICULTY AND ESTIMATED TIME */}

              <div className="uf-task-form__grid">
                <Select
                  label="Складність"
                  placeholder="Не вказувати"
                  options={[
                    {
                      value: 'easy',
                      label: 'Легка',
                    },
                    {
                      value: 'medium',
                      label: 'Середня',
                    },
                    {
                      value: 'hard',
                      label: 'Складна',
                    },
                  ]}
                  value={draft.difficulty}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      difficulty:
                        event.target.value as
                          | ''
                          | Difficulty,
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
                      estimatedMinutes:
                        event.target.value,
                    }))
                  }
                  placeholder="Наприклад, 60"
                />
              </div>

              {/* SCHEDULED DATE */}

              <Input
                label="Дата запланованої роботи"
                type="date"
                value={draft.scheduledDate}
                hint={
                  "Необов'язково. Якщо не вказати дату, " +
                  'завдання відображатиметься у календарі ' +
                  'за датою дедлайну.'
                }
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    scheduledDate:
                      event.target.value,
                  }))
                }
              />

              {/* SCHEDULED TIME */}

              <Input
                label="Запланований час початку"
                type="time"
                value={draft.scheduledTime}
                hint="Необов'язково. Використовується у календарі Week."
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    scheduledTime:
                      event.target.value,
                  }))
                }
              />

              {/* DESCRIPTION */}

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
                      description:
                        event.target.value,
                    }))
                  }
                  placeholder="Що саме потрібно зробити?"
                />

                <small>
                  Необов'язкове поле
                </small>
              </div>

              {/* FORM ERROR */}

              {formError && (
                <p
                  className="uf-task-form__error"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              {/* FORM ACTIONS */}

              <div className="uf-task-form__actions">
                <Button type="submit">
                  {editingTaskId
                    ? 'Зберегти зміни'
                    : 'Створити завдання'}
                </Button>

                <Button
                  variant="outline"
                  onClick={closeForm}
                >
                  Скасувати
                </Button>
              </div>
            </form>
          </Card>
        </section>
      )}

      {/* TASK LIST */}

      <section aria-labelledby="task-list-heading">
        <div className="uf-tasks__list-heading">
          <h2 id="task-list-heading">
            Список завдань
          </h2>

          <span>
            Знайдено: {visibleTasks.length}
          </span>
        </div>

        {/* FILTERS */}

        <div className="uf-tasks__filters">
          <Input
            label="Пошук"
            placeholder="Назва, предмет або опис"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <Select
            label="Статус"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as TaskStatusFilter
              )
            }
            options={[
              {
                value: 'all',
                label: 'Усі',
              },
              {
                value: 'active',
                label: 'Активні',
              },
              {
                value: 'completed',
                label: 'Виконані',
              },
            ]}
          />

          <Select
            label="Предмет"
            value={subjectFilter}
            onChange={(event) =>
              setSubjectFilter(
                event.target.value
              )
            }
            options={[
              {
                value: 'all',
                label: 'Усі предмети',
              },
              ...subjectOptions,
            ]}
          />

          <Select
            label="Сортування"
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as TaskSort
              )
            }
            options={[
              {
                value: 'deadline',
                label: 'За дедлайном',
              },
              {
                value: 'priority',
                label: 'За пріоритетом',
              },
              {
                value: 'newest',
                label: 'Найновіші',
              },
            ]}
          />
        </div>

        {/* EMPTY STATE */}

        {visibleTasks.length === 0 ? (
          <div className="uf-tasks__empty">
            <Search
              size={30}
              aria-hidden="true"
            />

            <h3>Завдань не знайдено</h3>

            <p>
              Зміни параметри пошуку або
              створи нове завдання.
            </p>
          </div>
        ) : (
          /* TASK CARDS */

          <div className="uf-tasks__list">
            {visibleTasks.map((task) => (
              <Card
                key={task.id}
                variant="outlined"
                className={[
                  'uf-task-card',
                  task.completed &&
                    'uf-task-card--completed',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="uf-task-card__content">

                  {/* COMPLETE CHECKBOX */}

                  <input
                    type="checkbox"
                    className="uf-task-card__checkbox"
                    checked={task.completed}
                    onChange={() =>
                      toggleTask(task.id)
                    }
                    aria-label={
                      task.completed
                        ? `Повернути в активні: ${task.title}`
                        : `Позначити виконаним: ${task.title}`
                    }
                  />

                  {/* TASK INFORMATION */}

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

                    {/* BADGES */}

                    <div className="uf-task-card__badges">
                      {renderDeadlineBadge(task)}

                      {renderPriorityBadge(
                        task.priority
                      )}

                      {task.difficulty && (
                        <Badge variant="neutral">
                          {
                            difficultyLabels[
                              task.difficulty
                            ]
                          }
                        </Badge>
                      )}
                    </div>

                    {/* TASK METADATA */}

                    <div className="uf-task-card__metadata">

                      {/* DEADLINE */}

                      <span>
                        <CalendarDays
                          size={15}
                          aria-hidden="true"
                        />
                        Дедлайн:{' '}
                        {formatDeadline(
                          task.deadline
                        )}
                      </span>

                      {/* SCHEDULED DATE */}

                      {task.scheduledDate && (
                        <span>
                          <CalendarDays
                            size={15}
                            aria-hidden="true"
                          />
                          План:{' '}
                          {formatDeadline(
                            task.scheduledDate
                          )}
                        </span>
                      )}

                      {/* SCHEDULED TIME */}

                      {task.scheduledTime && (
                        <span>
                          <Clock3
                            size={15}
                            aria-hidden="true"
                          />
                          Початок:{' '}
                          {task.scheduledTime}
                        </span>
                      )}

                      {/* ESTIMATED TIME */}

                      {task.estimatedMinutes && (
                        <span>
                          <Clock3
                            size={15}
                            aria-hidden="true"
                          />
                          Тривалість:{' '}
                          {task.estimatedMinutes} хв
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* TASK ACTIONS */}

                <div className="uf-task-card__actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openEditForm(task)
                    }
                  >
                    <Pencil
                      size={15}
                      aria-hidden="true"
                    />
                    Редагувати
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      removeTask(task)
                    }
                  >
                    <Trash2
                      size={15}
                      aria-hidden="true"
                    />
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
