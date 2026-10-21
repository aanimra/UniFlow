
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  Target,
} from 'lucide-react';

import { useStudy } from '../hooks/useStudy';
import { toLocalDate } from '../data/initialData';

import { Button } from '../components/ui/Button/Button';
import { Badge } from '../components/ui/Badge/Badge';
import { Card } from '../components/ui/Card/Card';

import type { Priority, StudyTask } from '../types';

import './TodayPage.css';

// ============================================
// CONSTANTS
// ============================================

const FOCUS_ORDER_STORAGE_KEY =
  'uniflow-focus-order-v1';

const FOCUS_TASKS_LIMIT = 3;

const priorityWeight: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const priorityLabel: Record<Priority, string> = {
  high: 'Високий',
  medium: 'Середній',
  low: 'Низький',
};

// ============================================
// HELPERS
// ============================================

/**
 * Sort tasks by deadline.
 * Higher priority breaks ties.
 */
function sortTasks(tasks: StudyTask[]): StudyTask[] {
  return [...tasks].sort((a, b) => {
    const deadlineComparison =
      a.deadline.localeCompare(b.deadline);

    if (deadlineComparison !== 0) {
      return deadlineComparison;
    }

    return (
      priorityWeight[b.priority] -
      priorityWeight[a.priority]
    );
  });
}

/**
 * Sort tasks for automatic Focus Today recommendations.
 *
 * Higher priority first, then earlier deadline.
 */
function rankFocusTasks(
  tasks: StudyTask[]
): StudyTask[] {
  return [...tasks].sort((a, b) => {
    const priorityDifference =
      priorityWeight[b.priority] -
      priorityWeight[a.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return a.deadline.localeCompare(b.deadline);
  });
}

/**
 * Read the previously saved manual ordering.
 *
 * If storage is empty or invalid, use
 * the default automatic ordering.
 */
function readFocusOrder(): string[] {
  try {
    const saved = localStorage.getItem(
      FOCUS_ORDER_STORAGE_KEY
    );

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return [
      ...new Set(
        parsed.filter(
          (item): item is string =>
            typeof item === 'string'
        )
      ),
    ];
  } catch (error) {
    console.error(
      'Не вдалося прочитати порядок Focus Today:',
      error
    );

    return [];
  }
}

// ============================================
// TODAY PAGE
// ============================================

export function TodayPage() {
  const {
    tasks,
    subjects,
    toggleTask,
  } = useStudy();

  const [focusOrder, setFocusOrder] = useState<
    string[]
  >(readFocusOrder);

  const [reorderMessage, setReorderMessage] =
    useState('');

  const now = new Date();
  const today = toLocalDate(now);

  // ==========================================
  // TASK STATISTICS
  // ==========================================

  const activeTasks = useMemo(
    () =>
      tasks.filter(
        (task) => !task.completed
      ),
    [tasks]
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.completed
      ),
    [tasks]
  );

  const dueToday = activeTasks.filter(
    (task) => task.deadline === today
  );

  const overdue = activeTasks.filter(
    (task) => task.deadline < today
  );

  // ==========================================
  // UPCOMING TASKS
  // ==========================================

  const upcomingTasks = useMemo(
    () => sortTasks(activeTasks).slice(0, 5),
    [activeTasks]
  );

  // ==========================================
  // FOCUS TODAY
  // ==========================================

  /**
   * Step 1.
   *
   * Automatically select the three most
   * important active tasks.
   */
  const rankedFocusTasks = useMemo(
    () =>
      rankFocusTasks(activeTasks).slice(
        0,
        FOCUS_TASKS_LIMIT
      ),
    [activeTasks]
  );

  /**
   * Step 2.
   *
   * Apply the previously saved manual order.
   * Tasks not included in the saved order
   * preserve their automatic ranking.
   */
  const focusTasks = useMemo(() => {
    const orderIndexes = new Map(
      focusOrder.map((id, index) => [
        id,
        index,
      ])
    );

    return [...rankedFocusTasks].sort(
      (a, b) => {
        const indexA = orderIndexes.get(a.id);
        const indexB = orderIndexes.get(b.id);

        // Neither task was manually ordered.
        if (
          indexA === undefined &&
          indexB === undefined
        ) {
          return 0;
        }

        // Only task A was manually ordered.
        if (indexA !== undefined &&
            indexB === undefined) {
          return -1;
        }

        // Only task B was manually ordered.
        if (indexA === undefined &&
            indexB !== undefined) {
          return 1;
        }

        if (indexA === undefined || indexB === undefined) {
         return 0;
        }

        return indexA - indexB;
      }
    );
  }, [rankedFocusTasks, focusOrder]);

  // ==========================================
  // PERSIST MANUAL ORDER
  // ==========================================

  useEffect(() => {
    const existingTaskIds = new Set(
      tasks.map((task) => task.id)
    );

    // Remove deleted tasks from the saved list.
    const validOrder = focusOrder.filter(
      (id) => existingTaskIds.has(id)
    );

    try {
      localStorage.setItem(
        FOCUS_ORDER_STORAGE_KEY,
        JSON.stringify(validOrder)
      );
    } catch (error) {
      console.error(
        'Не вдалося зберегти порядок Focus Today:',
        error
      );
    }
  }, [focusOrder, tasks]);

  // ==========================================
  // MANUAL REORDER ACTION
  // ==========================================

  function moveFocusTask(
    taskId: string,
    direction: -1 | 1
  ) {
    const currentOrder = focusTasks.map(
      (task) => task.id
    );

    const currentIndex =
      currentOrder.indexOf(taskId);

    const targetIndex =
      currentIndex + direction;

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= currentOrder.length
    ) {
      return;
    }

    // Swap the two neighboring tasks.
    [
      currentOrder[currentIndex],
      currentOrder[targetIndex],
    ] = [
      currentOrder[targetIndex],
      currentOrder[currentIndex],
    ];

    const existingTaskIds = new Set(
      tasks.map((task) => task.id)
    );

    // Preserve positions of tasks not currently
    // displayed in Focus Today.
    setFocusOrder((previous) => [
      ...currentOrder,
      ...previous.filter(
        (id) =>
          existingTaskIds.has(id) &&
          !currentOrder.includes(id)
      ),
    ]);

    const movedTask = focusTasks.find(
      (task) => task.id === taskId
    );

    setReorderMessage(
      `Завдання «${movedTask?.title ?? ''}» ` +
      `переміщено на позицію ${targetIndex + 1} ` +
      `з ${currentOrder.length}.`
    );
  }

  // ==========================================
  // SUBJECT NAME
  // ==========================================

  function subjectName(
    subjectId: string
  ): string {
    return (
      subjects.find(
        (subject) =>
          subject.id === subjectId
      )?.name ??
      'Невідомий предмет'
    );
  }

  // ==========================================
  // DATE FORMATTING
  // ==========================================

  function formatDeadline(
    deadline: string
  ): string {
    if (deadline === today) {
      return 'Сьогодні';
    }

    return new Date(
      `${deadline}T12:00:00`
    ).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
    });
  }

  // ==========================================
  // TASK STATUS BADGE
  // ==========================================

  function taskBadge(task: StudyTask) {
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

    const variant =
      task.priority === 'high'
        ? 'danger'
        : task.priority === 'medium'
          ? 'warning'
          : 'neutral';

    return (
      <Badge variant={variant}>
        {priorityLabel[task.priority]}
      </Badge>
    );
  }

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="uf-dashboard">

      {/* PAGE HEADER */}

      <header className="uf-dashboard__heading">
        <div>
          <p className="uf-dashboard__eyebrow">
            Твій навчальний планувальник
          </p>

          <h1>Мій день</h1>

          <p className="uf-dashboard__subtitle">
            Керуй навчальними завданнями
            та зосереджуйся на важливому.
          </p>
        </div>

        <div className="uf-dashboard__date">
          <CalendarDays
            size={18}
            aria-hidden="true"
          />

          {now.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </header>

      {/* DASHBOARD STATISTICS */}

      <div className="uf-dashboard__stats">
        <Card variant="outlined">
          <div className="uf-stat">
            <ListTodo aria-hidden="true" />

            <span>
              Активні завдання
            </span>

            <strong>
              {activeTasks.length}
            </strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-stat">
            <CalendarDays aria-hidden="true" />

            <span>
              На сьогодні
            </span>

            <strong>
              {dueToday.length}
            </strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-stat">
            <CheckCircle2 aria-hidden="true" />

            <span>
              Виконані
            </span>

            <strong>
              {completedTasks.length}
            </strong>
          </div>
        </Card>
      </div>

      {/* OVERDUE TASK NOTICE */}

      {overdue.length > 0 && (
        <div
          className="uf-dashboard__notice"
          role="status"
        >
          <Badge variant="danger">
            {overdue.length} прострочено
          </Badge>

          <span>
            Переглянь завдання
            з минулими дедлайнами.
          </span>
        </div>
      )}

      {/* MAIN DASHBOARD COLUMNS */}

      <div className="uf-dashboard__columns">

        {/* FOCUS TODAY */}

        <section>
          <Card
            title="Зосередься сьогодні"
            description={
              'Три пріоритетні завдання. ' +
              'Ти можеш змінити порядок виконання.'
            }
            variant="default"
          >
            <div className="uf-dashboard__section-icon">
              <Target
                size={20}
                aria-hidden="true"
              />

              <span>
                Фокус сьогодні
              </span>
            </div>

            {focusTasks.length === 0 ? (
              <p className="uf-dashboard__empty">
                Усі завдання виконані.
                Чудова робота!
              </p>
            ) : (
              <>
                <p className="uf-dashboard__reorder-hint">
                  Використовуй стрілки,
                  щоб змінити порядок завдань.
                </p>

                <p
                  className="uf-dashboard__sr-only"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {reorderMessage}
                </p>

                <div className="uf-task-list">
                  {focusTasks.map(
                    (task, index) => (
                      <div
                        className="uf-task-row"
                        key={task.id}
                      >
                        {/* TASK INFORMATION */}

                        <div className="uf-task-row__info">
                          <div className="uf-task-row__heading">
                            <span
                              className="uf-task-row__number"
                              aria-label={
                                `Позиція ${index + 1}`
                              }
                            >
                              {index + 1}
                            </span>

                            <h3>
                              {task.title}
                            </h3>
                          </div>

                          <p>
                            {subjectName(
                              task.subjectId
                            )}
                          </p>

                          <div className="uf-task-row__metadata">
                            {taskBadge(task)}

                            <span>
                              Дедлайн:{' '}
                              {formatDeadline(
                                task.deadline
                              )}
                            </span>
                          </div>
                        </div>

                        {/* TASK ACTIONS */}

                        <div className="uf-task-row__actions">

                          {/* REORDER CONTROLS */}

                          <div
                            className="uf-dashboard__reorder"
                            role="group"
                            aria-label={
                              `Змінити порядок: ${task.title}`
                            }
                          >
                            <button
                              type="button"
                              className="uf-dashboard__reorder-button"
                              onClick={() =>
                                moveFocusTask(
                                  task.id,
                                  -1
                                )
                              }
                              disabled={index === 0}
                              aria-label={
                                `Перемістити вгору: ${task.title}`
                              }
                              title="Перемістити вгору"
                            >
                              <ArrowUp
                                size={17}
                                aria-hidden="true"
                              />
                            </button>

                            <button
                              type="button"
                              className="uf-dashboard__reorder-button"
                              onClick={() =>
                                moveFocusTask(
                                  task.id,
                                  1
                                )
                              }
                              disabled={
                                index ===
                                focusTasks.length - 1
                              }
                              aria-label={
                                `Перемістити вниз: ${task.title}`
                              }
                              title="Перемістити вниз"
                            >
                              <ArrowDown
                                size={17}
                                aria-hidden="true"
                              />
                            </button>
                          </div>

                          {/* START FOCUS */}

                          <Link
                            to={
                              `/focus?task=` +
                              encodeURIComponent(
                                task.id
                              )
                            }
                            className="uf-dashboard__focus-link"
                          >
                            Почати фокус
                          </Link>

                          {/* COMPLETE TASK */}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              toggleTask(task.id)
                            }
                            aria-label={
                              `Позначити виконаним: ${task.title}`
                            }
                          >
                            Виконано
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </Card>
        </section>

        {/* UPCOMING DEADLINES */}

        <section>
          <Card
            title="Найближчі дедлайни"
            description={
              'Наступні завдання за датою виконання.'
            }
            variant="outlined"
          >
            {upcomingTasks.length === 0 ? (
              <p className="uf-dashboard__empty">
                Немає активних завдань.
              </p>
            ) : (
              <div className="uf-upcoming-list">
                {upcomingTasks.map(
                  (task) => (
                    <div
                      className="uf-upcoming-item"
                      key={task.id}
                    >
                      <div>
                        <strong>
                          {task.title}
                        </strong>

                        <span>
                          {subjectName(
                            task.subjectId
                          )}
                        </span>
                      </div>

                      <Badge
                        variant={
                          task.deadline < today
                            ? 'danger'
                            : task.deadline === today
                              ? 'warning'
                              : 'primary'
                        }
                      >
                        {formatDeadline(
                          task.deadline
                        )}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* RANKING EXPLANATION */}

      <p className="uf-dashboard__method">
        Принцип ранжування: UniFlow
        автоматично вибирає три активні
        завдання за пріоритетом і дедлайном.
        Порядок цих трьох завдань можна
        змінювати вручну. Власний порядок
        зберігається після оновлення сторінки.
        Список найближчих дедлайнів
        сортується за датою.
      </p>
    </div>
  );
}
