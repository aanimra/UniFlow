
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListTodo,
} from 'lucide-react';

import { useStudy } from '../hooks/useStudy';
import { toLocalDate } from '../data/initialData';

import { Button } from '../components/ui/Button/Button';
import { Badge } from '../components/ui/Badge/Badge';
import { Card } from '../components/ui/Card/Card';

import type { Priority, StudyTask } from '../types';

import './WeekPage.css';

// ============================================
// CONSTANTS
// ============================================

const WEEKDAYS = [
  'Понеділок',
  'Вівторок',
  'Середа',
  'Четвер',
  "П'ятниця",
  'Субота',
  'Неділя',
];

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Високий',
  medium: 'Середній',
  low: 'Низький',
};

const PRIORITY_SCORES: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const OVERLOAD_TASK_LIMIT = 4;
const OVERLOAD_MINUTES_LIMIT = 240;

// ============================================
// DATE HELPERS
// ============================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);

  // JavaScript: Sunday = 0, Monday = 1.
  const weekday = result.getDay();
  const distance = weekday === 0 ? -6 : 1 - weekday;

  result.setDate(result.getDate() + distance);

  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
  });
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return 'Не вказано';

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) return `${remaining} хв`;
  if (remaining === 0) return `${hours} год`;

  return `${hours} год ${remaining} хв`;
}

// ============================================
// TASK HELPERS
// ============================================

function getTaskDate(task: StudyTask): string {
  return task.scheduledDate || task.deadline;
}

function sortTasks(tasks: StudyTask[]): StudyTask[] {
  return [...tasks].sort((a, b) => {
    // Active tasks come first.
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }

    // Scheduled tasks come before unscheduled tasks.
    if (a.scheduledTime && !b.scheduledTime) return -1;
    if (!a.scheduledTime && b.scheduledTime) return 1;

    if (a.scheduledTime && b.scheduledTime) {
      const timeResult = a.scheduledTime.localeCompare(
        b.scheduledTime
      );

      if (timeResult !== 0) return timeResult;
    }

    // Higher priority comes first.
    const priorityResult =
      PRIORITY_SCORES[b.priority] -
      PRIORITY_SCORES[a.priority];

    if (priorityResult !== 0) return priorityResult;

    return a.title.localeCompare(b.title, 'uk-UA');
  });
}

function getDayLoad(tasks: StudyTask[]) {
  const activeTasks = tasks.filter(
    (task) => !task.completed
  );

  const minutes = activeTasks.reduce(
    (total, task) =>
      total + (task.estimatedMinutes ?? 0),
    0
  );

  return {
    activeCount: activeTasks.length,
    minutes,
    overloaded:
      activeTasks.length >= OVERLOAD_TASK_LIMIT ||
      minutes >= OVERLOAD_MINUTES_LIMIT,
  };
}

// ============================================
// WEEK PAGE
// ============================================

export function WeekPage() {
  const { tasks, subjects, toggleTask } = useStudy();

  const [weekStart, setWeekStart] = useState<Date>(
    () => startOfWeek(new Date())
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    () => toLocalDate(new Date())
  );

  const today = toLocalDate(new Date());

  // Seven days, Monday to Sunday.
  const weekDays = Array.from(
    { length: 7 },
    (_, index) => {
      const date = addDays(weekStart, index);

      return {
        date,
        key: toLocalDate(date),
        name: WEEKDAYS[index],
        shortName: WEEKDAYS[index].slice(0, 2),
        number: date.getDate(),
      };
    }
  );

  // Group tasks by scheduled date.
  const tasksByDate = new Map<string, StudyTask[]>();

  for (const task of tasks) {
    const key = getTaskDate(task);
    const previous = tasksByDate.get(key) ?? [];

    previous.push(task);
    tasksByDate.set(key, previous);
  }

  // Sort tasks without changing React Context data.
  for (const [key, dayTasks] of tasksByDate) {
    tasksByDate.set(key, sortTasks(dayTasks));
  }

  const selectedDay =
    weekDays.find((day) => day.key === selectedDate) ??
    weekDays[0];

  const selectedTasks =
    tasksByDate.get(selectedDay.key) ?? [];

  const selectedLoad = getDayLoad(selectedTasks);

  const weekTasks = weekDays.flatMap(
    (day) => tasksByDate.get(day.key) ?? []
  );

  const activeWeekTasks = weekTasks.filter(
    (task) => !task.completed
  );

  const completedWeekTasks = weekTasks.filter(
    (task) => task.completed
  );

  const weekMinutes = activeWeekTasks.reduce(
    (total, task) =>
      total + (task.estimatedMinutes ?? 0),
    0
  );

  const overloadedDays = weekDays.filter((day) => {
    const dayTasks = tasksByDate.get(day.key) ?? [];
    return getDayLoad(dayTasks).overloaded;
  });

  // ==========================================
  // ACTIONS
  // ==========================================

  function changeWeek(direction: number) {
    const nextWeek = addDays(
      weekStart,
      direction * 7
    );

    setWeekStart(nextWeek);
    setSelectedDate(toLocalDate(nextWeek));
  }

  function goToToday() {
    const now = new Date();

    setWeekStart(startOfWeek(now));
    setSelectedDate(toLocalDate(now));
  }

  function getSubjectName(subjectId: string): string {
    return (
      subjects.find(
        (subject) => subject.id === subjectId
      )?.name ?? 'Невідомий предмет'
    );
  }

  function getSubjectColor(subjectId: string): string {
    return (
      subjects.find(
        (subject) => subject.id === subjectId
      )?.color ?? '#5946C8'
    );
  }

  function renderPriority(task: StudyTask) {
    if (task.completed) {
      return (
        <Badge variant="success">
          Виконано
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
        {PRIORITY_LABELS[task.priority]} пріоритет
      </Badge>
    );
  }

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="uf-week">

      {/* PAGE HEADER */}

      <header className="uf-week__heading">
        <div>
          <p className="uf-week__eyebrow">
            КАЛЕНДАР НАВЧАННЯ
          </p>

          <h1>Мій тиждень</h1>

          <p className="uf-week__subtitle">
            Плануй навчання, розподіляй завдання
            та контролюй навантаження.
          </p>
        </div>

        <Link
          to="/tasks"
          className="uf-week__tasks-link"
        >
          <ListTodo size={18} aria-hidden="true" />
          Усі завдання
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      {/* WEEK STATISTICS */}

      <section
        className="uf-week__stats"
        aria-label="Статистика тижня"
      >
        <Card variant="outlined">
          <div className="uf-week__stat">
            <ListTodo size={22} aria-hidden="true" />
            <span>Активні завдання</span>
            <strong>{activeWeekTasks.length}</strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-week__stat">
            <Clock3 size={22} aria-hidden="true" />
            <span>Навчальне навантаження</span>
            <strong>{formatMinutes(weekMinutes)}</strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-week__stat">
            <CheckCircle2 size={22} aria-hidden="true" />
            <span>Виконані завдання</span>
            <strong>{completedWeekTasks.length}</strong>
          </div>
        </Card>
      </section>

      {/* WEEK NAVIGATION */}

      <section
        className="uf-week__calendar-section"
        aria-labelledby="week-title"
      >
        <div className="uf-week__toolbar">
          <div>
            <h2 id="week-title">
              Тижневий календар
            </h2>

            <p className="uf-week__range">
              {formatShortDate(weekDays[0].date)}
              {' — '}
              {formatDate(weekDays[6].date)}
            </p>
          </div>

          <div className="uf-week__controls">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek(-1)}
              aria-label="Попередній тиждень"
            >
              <ChevronLeft
                size={18}
                aria-hidden="true"
              />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={goToToday}
            >
              Сьогодні
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek(1)}
              aria-label="Наступний тиждень"
            >
              <ChevronRight
                size={18}
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        {/* OVERLOAD WARNING */}

        {overloadedDays.length > 0 && (
          <div
            className="uf-week__warning"
            role="status"
          >
            <AlertTriangle
              size={20}
              aria-hidden="true"
            />

            <span>
              Виявлено перевантажені дні:{' '}
              <strong>{overloadedDays.length}</strong>.
              Переглянь розподіл завдань і за
              потреби перенеси заплановану роботу.
            </span>
          </div>
        )}

        {/* SEVEN-DAY CALENDAR */}

        <div className="uf-week__calendar">
          {weekDays.map((day) => {
            const dayTasks =
              tasksByDate.get(day.key) ?? [];

            const load = getDayLoad(dayTasks);

            const isToday = day.key === today;
            const isSelected =
              day.key === selectedDay.key;

            return (
              <section
                key={day.key}
                className={[
                  'uf-week__day',
                  isToday && 'uf-week__day--today',
                  isSelected &&
                    'uf-week__day--selected',
                  load.overloaded &&
                    'uf-week__day--overloaded',
                ].filter(Boolean).join(' ')}
                aria-label={
                  `${day.name}, ${formatDate(day.date)}`
                }
              >
                <button
                  type="button"
                  className="uf-week__day-button"
                  onClick={() =>
                    setSelectedDate(day.key)
                  }
                  aria-pressed={isSelected}
                  aria-current={
                    isToday ? 'date' : undefined
                  }
                >
                  <span className="uf-week__day-name">
                    {day.shortName}
                  </span>

                  <span className="uf-week__day-number">
                    {day.number}
                  </span>

                  {isToday && (
                    <span className="uf-week__today-label">
                      Сьогодні
                    </span>
                  )}
                </button>

                <div className="uf-week__day-content">
                  {load.overloaded && (
                    <Badge variant="danger">
                      Перевантажено
                    </Badge>
                  )}

                  {dayTasks.length === 0 ? (
                    <p className="uf-week__empty-day">
                      Немає завдань
                    </p>
                  ) : (
                    <ul className="uf-week__mini-list">
                      {dayTasks.map((task) => (
                        <li
                          key={task.id}
                          className={[
                            'uf-week__mini-task',
                            task.completed &&
                              'uf-week__mini-task--done',
                          ].filter(Boolean).join(' ')}
                        >
                          <span
                            className="uf-week__subject-dot"
                            style={{
                              backgroundColor:
                                getSubjectColor(
                                  task.subjectId
                                ),
                            }}
                            aria-hidden="true"
                          />

                          <span className="uf-week__mini-body">
                            <span className="uf-week__mini-title">
                              {task.title}
                            </span>

                            {task.scheduledTime && (
                              <span className="uf-week__mini-time">
                                {task.scheduledTime}
                              </span>
                            )}

                            {task.completed && (
                              <span className="uf-week__mini-time">
                                Виконано
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="uf-week__day-footer">
                  <span>
                    {load.activeCount} активних
                  </span>

                  {load.minutes > 0 && (
                    <span>
                      {formatMinutes(load.minutes)}
                    </span>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {/* SELECTED DAY DETAILS */}

      <section
        className="uf-week__details"
        aria-labelledby="selected-day-title"
      >
        <div className="uf-week__details-heading">
          <div>
            <p className="uf-week__eyebrow">
              ПЛАН НА ОБРАНИЙ ДЕНЬ
            </p>

            <h2 id="selected-day-title">
              {selectedDay.name},{' '}
              {formatDate(selectedDay.date)}
            </h2>
          </div>

          <Badge
            variant={
              selectedLoad.overloaded
                ? 'danger'
                : 'primary'
            }
          >
            {selectedLoad.overloaded
              ? 'Високе навантаження'
              : `Завдань: ${selectedTasks.length}`}
          </Badge>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="uf-week__empty">
            <CalendarDays
              size={34}
              aria-hidden="true"
            />

            <h3>На цей день завдань немає</h3>

            <p>
              Додай нове завдання та обери
              дату запланованої роботи.
            </p>

            <Link to="/tasks">
              Перейти до завдань
            </Link>
          </div>
        ) : (
          <div className="uf-week__details-list">
            {selectedTasks.map((task) => (
              <Card
                key={task.id}
                variant="outlined"
                className="uf-week__task-card"
              >
                <div className="uf-week__task-main">
                  <span
                    className="uf-week__task-color"
                    style={{
                      backgroundColor:
                        getSubjectColor(
                          task.subjectId
                        ),
                    }}
                    aria-hidden="true"
                  />

                  <div className="uf-week__task-info">
                    <h3
                      className={
                        task.completed
                          ? 'uf-week__completed-title'
                          : ''
                      }
                    >
                      {task.title}
                    </h3>

                    <p className="uf-week__subject-name">
                      {getSubjectName(
                        task.subjectId
                      )}
                    </p>

                    <div className="uf-week__badges">
                      {renderPriority(task)}

                      {!task.completed &&
                        task.deadline < today && (
                          <Badge variant="danger">
                            Прострочено
                          </Badge>
                        )}
                    </div>

                    <div className="uf-week__metadata">
                      <span>
                        <CalendarDays
                          size={15}
                          aria-hidden="true"
                        />
                        Дедлайн: {task.deadline}
                      </span>

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

                      {task.estimatedMinutes && (
                        <span>
                          <Clock3
                            size={15}
                            aria-hidden="true"
                          />
                          {formatMinutes(
                            task.estimatedMinutes
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant={
                    task.completed
                      ? 'outline'
                      : 'secondary'
                  }
                  size="sm"
                  onClick={() =>
                    toggleTask(task.id)
                  }
                >
                  <CheckCircle2
                    size={17}
                    aria-hidden="true"
                  />

                  {task.completed
                    ? 'Повернути в активні'
                    : 'Виконано'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* WORKLOAD EXPLANATION */}

      <aside className="uf-week__explanation">
        <h2>Як визначається навантаження?</h2>

        <p>
          День вважається перевантаженим, якщо
          має щонайменше{' '}
          <strong>{OVERLOAD_TASK_LIMIT}</strong>{' '}
          активні завдання або загальний
          оцінений час становить{' '}
          <strong>
            {OVERLOAD_MINUTES_LIMIT} хвилин
          </strong>{' '}
          чи більше.
        </p>

        <p>
          Завдання розміщуються за датою
          запланованої роботи. Якщо її не вказано,
          використовується дата дедлайну.
          Виконані завдання не збільшують
          навантаження.
        </p>
      </aside>
    </div>
  );
}
