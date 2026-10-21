
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ListTodo,
  TrendingUp,
} from 'lucide-react';

import { useStudy } from '../hooks/useStudy';
import { toLocalDate } from '../data/initialData';

import { Card } from '../components/ui/Card/Card';
import { Badge } from '../components/ui/Badge/Badge';
import { Select } from '../components/ui/Select/Select';

import type { StudyTask } from '../types';

import './ProgressPage.css';

// ============================================
// TYPES AND CONSTANTS
// ============================================

type ProgressPeriod = 'week' | 'month' | 'all';

interface DateRange {
  start: string | null;
  end: string | null;
}

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Цей тиждень' },
  { value: 'month', label: 'Цей місяць' },
  { value: 'all', label: 'Весь час' },
];

const PRIORITY_SCORES = {
  high: 3,
  medium: 2,
  low: 1,
};

// ============================================
// DATE HELPERS
// ============================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() + days);
  return result;
}

function getPeriodRange(
  period: ProgressPeriod,
  now: Date
): DateRange {
  if (period === 'all') {
    return { start: null, end: null };
  }

  if (period === 'week') {
    const monday = new Date(now);
    monday.setHours(12, 0, 0, 0);

    const weekday = monday.getDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;

    monday.setDate(monday.getDate() + offset);

    const sunday = addDays(monday, 6);

    return {
      start: toLocalDate(monday),
      end: toLocalDate(sunday),
    };
  }

  const firstDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    12
  );

  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    12
  );

  return {
    start: toLocalDate(firstDay),
    end: toLocalDate(lastDay),
  };
}

function isDateInRange(
  date: string,
  range: DateRange
): boolean {
  if (range.start && date < range.start) {
    return false;
  }

  if (range.end && date > range.end) {
    return false;
  }

  return true;
}

function formatDate(date: string): string {
  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// STATISTICS HELPERS
// ============================================

function calculateCompletionRate(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;

  return Math.round((completed / total) * 100);
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(
    (safeSeconds % 3600) / 60
  );
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return minutes > 0
      ? `${hours} год ${minutes} хв`
      : `${hours} год`;
  }

  if (minutes > 0) {
    return `${minutes} хв`;
  }

  return `${remainingSeconds} с`;
}

// ============================================
// PROGRESS PAGE
// ============================================

export function ProgressPage() {
  const {
    tasks,
    subjects,
    focusSessions,
  } = useStudy();

  const [period, setPeriod] =
    useState<ProgressPeriod>('month');

  const now = new Date();
  const today = toLocalDate(now);

  const range = getPeriodRange(period, now);

  // ==========================================
  // FILTER DATA BY SELECTED PERIOD
  // ==========================================

  const periodTasks = tasks.filter((task) =>
    isDateInRange(task.deadline, range)
  );

  const periodSessions = focusSessions.filter(
    (session) => {
      const finishedDate = toLocalDate(
        new Date(session.endedAt)
      );

      return isDateInRange(finishedDate, range);
    }
  );

  // ==========================================
  // GENERAL STATISTICS
  // ==========================================

  const totalTasks = periodTasks.length;

  const completedTasks = periodTasks.filter(
    (task) => task.completed
  );

  const activeTasks = periodTasks.filter(
    (task) => !task.completed
  );

  const completionRate = calculateCompletionRate(
    completedTasks.length,
    totalTasks
  );

  const totalFocusSeconds = periodSessions.reduce(
    (sum, session) =>
      sum + Math.max(0, session.durationSeconds),
    0
  );

  // ==========================================
  // OVERDUE AND UPCOMING DEADLINES
  // ==========================================

  const allActiveTasks = tasks.filter(
    (task) => !task.completed
  );

  const overdueTasks = allActiveTasks.filter(
    (task) => task.deadline < today
  );

  // Today + following 6 days = 7 calendar days.
  const upcomingEnd = toLocalDate(
    addDays(now, 6)
  );

  const upcomingTasks = allActiveTasks
    .filter(
      (task) =>
        task.deadline >= today &&
        task.deadline <= upcomingEnd
    )
    .sort(
      (a, b) =>
        a.deadline.localeCompare(b.deadline) ||
        PRIORITY_SCORES[b.priority] -
          PRIORITY_SCORES[a.priority]
    )
    .slice(0, 5);

  // ==========================================
  // STATISTICS BY SUBJECT
  // ==========================================

  const subjectProgress = subjects
    .map((subject) => {
      const subjectTasks = periodTasks.filter(
        (task) => task.subjectId === subject.id
      );

      const completed = subjectTasks.filter(
        (task) => task.completed
      ).length;

      const active = subjectTasks.length - completed;

      const subjectFocusSeconds =
        periodSessions
          .filter(
            (session) =>
              session.subjectId === subject.id
          )
          .reduce(
            (sum, session) =>
              sum + Math.max(
                0,
                session.durationSeconds
              ),
            0
          );

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        total: subjectTasks.length,
        completed,
        active,
        percentage: calculateCompletionRate(
          completed,
          subjectTasks.length
        ),
        focusSeconds: subjectFocusSeconds,
      };
    })
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.name.localeCompare(b.name, 'uk-UA')
    );

  // ==========================================
  // RECENT COMPLETIONS
  // ==========================================

  const recentCompletions = [...completedTasks]
    .sort((a, b) =>
      (b.completedAt ?? '').localeCompare(
        a.completedAt ?? ''
      )
    )
    .slice(0, 5);

  // ==========================================
  // HELPERS
  // ==========================================

  function getSubjectName(
    task: StudyTask
  ): string {
    return (
      subjects.find(
        (subject) =>
          subject.id === task.subjectId
      )?.name ?? 'Невідомий предмет'
    );
  }

  function deadlineBadge(task: StudyTask) {
    if (task.deadline === today) {
      return (
        <Badge variant="warning">
          Сьогодні
        </Badge>
      );
    }

    return (
      <Badge variant="primary">
        {formatDate(task.deadline)}
      </Badge>
    );
  }

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="uf-progress">

      {/* HEADER */}

      <header className="uf-progress__heading">
        <div>
          <p className="uf-progress__eyebrow">
            АНАЛІТИКА НАВЧАННЯ
          </p>

          <h1>Мій прогрес</h1>

          <p>
            Аналізуй виконання завдань,
            результати за предметами
            та час концентрації.
          </p>
        </div>

        <div className="uf-progress__period">
          <Select
            label="Період статистики"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(event) =>
              setPeriod(
                event.target.value as ProgressPeriod
              )
            }
          />
        </div>
      </header>

      {/* STATISTICS */}

      <section
        className="uf-progress__stats"
        aria-label="Загальна статистика"
      >
        <Card variant="outlined">
          <div className="uf-progress__stat">
            <div className="uf-progress__stat-icon">
              <TrendingUp
                size={22}
                aria-hidden="true"
              />
            </div>

            <span>Відсоток виконання</span>

            <strong>
              {completionRate}%
            </strong>

            <small>
              {completedTasks.length} із {totalTasks}
            </small>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-progress__stat">
            <div className="uf-progress__stat-icon">
              <CheckCircle2
                size={22}
                aria-hidden="true"
              />
            </div>

            <span>Виконані завдання</span>

            <strong>
              {completedTasks.length}
            </strong>

            <small>
              Активні: {activeTasks.length}
            </small>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-progress__stat">
            <div className="uf-progress__stat-icon">
              <Clock3
                size={22}
                aria-hidden="true"
              />
            </div>

            <span>Час концентрації</span>

            <strong>
              {formatDuration(totalFocusSeconds)}
            </strong>

            <small>
              Сесій: {periodSessions.length}
            </small>
          </div>
        </Card>
      </section>

      {/* TOTAL PROGRESS */}

      <section
        aria-labelledby="overall-progress-title"
      >
        <Card variant="default">
          <div className="uf-progress__overall">
            <div className="uf-progress__section-heading">
              <div>
                <h2 id="overall-progress-title">
                  Загальний прогрес
                </h2>

                <p>
                  Частка виконаних завдань
                  у вибраному періоді.
                </p>
              </div>

              <span className="uf-progress__percentage">
                {completionRate}%
              </span>
            </div>

            <progress
              className="uf-progress__bar"
              value={completionRate}
              max={100}
              aria-label="Загальний відсоток виконаних завдань"
            >
              {completionRate}%
            </progress>

            {totalTasks === 0 ? (
              <p className="uf-progress__helper">
                У цьому періоді немає завдань.
                Відсоток виконання поки
                не можна оцінити.
              </p>
            ) : (
              <div className="uf-progress__legend">
                <span>
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                  Виконано: {completedTasks.length}
                </span>

                <span>
                  <ListTodo
                    size={16}
                    aria-hidden="true"
                  />
                  Залишилося: {activeTasks.length}
                </span>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* SUBJECT PROGRESS */}

      <section
        className="uf-progress__subjects-section"
        aria-labelledby="subject-progress-title"
      >
        <div className="uf-progress__section-heading">
          <div>
            <h2 id="subject-progress-title">
              Прогрес за предметами
            </h2>

            <p>
              Виконання завдань і час концентрації
              для кожного предмета.
            </p>
          </div>

          <Link
            to="/subjects"
            className="uf-progress__link"
          >
            Мої предмети
            <ArrowRight
              size={17}
              aria-hidden="true"
            />
          </Link>
        </div>

        {subjectProgress.length === 0 ? (
          <div className="uf-progress__empty">
            <GraduationCap
              size={34}
              aria-hidden="true"
            />

            <h3>Предметів поки немає</h3>

            <p>
              Створи семестр і додай навчальні
              дисципліни, щоб відстежувати прогрес.
            </p>

            <Link to="/subjects">
              Перейти до предметів
            </Link>
          </div>
        ) : (
          <div className="uf-progress__subjects">
            {subjectProgress.map((subject) => (
              <Card
                key={subject.id}
                variant="outlined"
                className="uf-progress__subject-card"
              >
                <div className="uf-progress__subject">
                  <div className="uf-progress__subject-top">
                    <div className="uf-progress__subject-name">
                      <span
                        className="uf-progress__subject-color"
                        style={{
                          backgroundColor: subject.color,
                        }}
                        aria-hidden="true"
                      />

                      <h3>{subject.name}</h3>
                    </div>

                    <strong>
                      {subject.percentage}%
                    </strong>
                  </div>

                  <progress
                    className="uf-progress__bar"
                    style={{
                      accentColor: subject.color,
                    }}
                    value={subject.percentage}
                    max={100}
                    aria-label={
                      `Виконання предмета ${subject.name}: ` +
                      `${subject.percentage}%`
                    }
                  >
                    {subject.percentage}%
                  </progress>

                  <div className="uf-progress__subject-meta">
                    <span>
                      Виконано: {subject.completed}
                      {' / '}
                      {subject.total}
                    </span>

                    <span>
                      Активні: {subject.active}
                    </span>

                    <span>
                      Фокус: {formatDuration(
                        subject.focusSeconds
                      )}
                    </span>
                  </div>

                  {subject.total === 0 && (
                    <p className="uf-progress__helper">
                      Немає завдань із дедлайном
                      у вибраному періоді.
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* UPCOMING DEADLINES */}

      <section
        className="uf-progress__deadlines-section"
        aria-labelledby="progress-deadlines-title"
      >
        <div className="uf-progress__section-heading">
          <div>
            <h2 id="progress-deadlines-title">
              Найближчі дедлайни
            </h2>

            <p>
              Активні завдання на найближчі
              сім календарних днів.
            </p>
          </div>

          <Link
            to="/tasks"
            className="uf-progress__link"
          >
            Усі завдання
            <ArrowRight
              size={17}
              aria-hidden="true"
            />
          </Link>
        </div>

        {overdueTasks.length > 0 && (
          <div
            className="uf-progress__warning"
            role="status"
          >
            <AlertTriangle
              size={19}
              aria-hidden="true"
            />

            <span>
              Прострочених активних завдань:{' '}
              <strong>
                {overdueTasks.length}
              </strong>.
              Переглянь їх у розділі
              «Мої завдання».
            </span>
          </div>
        )}

        {upcomingTasks.length === 0 ? (
          <div className="uf-progress__empty">
            <CalendarClock
              size={32}
              aria-hidden="true"
            />

            <h3>Немає найближчих дедлайнів</h3>

            <p>
              На наступні сім днів активних
              завдань із дедлайнами немає.
            </p>
          </div>
        ) : (
          <div className="uf-progress__deadline-list">
            {upcomingTasks.map((task) => (
              <Card
                key={task.id}
                variant="outlined"
                className="uf-progress__deadline-card"
              >
                <div className="uf-progress__deadline">
                  <div>
                    <h3>{task.title}</h3>

                    <p>
                      {getSubjectName(task)}
                    </p>
                  </div>

                  {deadlineBadge(task)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* RECENT COMPLETIONS */}

      <section
        aria-labelledby="recent-completions-title"
      >
        <div className="uf-progress__section-heading">
          <div>
            <h2 id="recent-completions-title">
              Виконані завдання
            </h2>

            <p>
              Останні завершені завдання
              з вибраного періоду дедлайнів.
            </p>
          </div>
        </div>

        {recentCompletions.length === 0 ? (
          <div className="uf-progress__empty">
            <CheckCircle2
              size={32}
              aria-hidden="true"
            />

            <h3>Поки немає виконаних завдань</h3>

            <p>
              Після завершення завдань
              вони з'являться в цьому розділі.
            </p>
          </div>
        ) : (
          <div className="uf-progress__completed-list">
            {recentCompletions.map((task) => (
              <div
                key={task.id}
                className="uf-progress__completed-item"
              >
                <CheckCircle2
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    {task.title}
                  </strong>

                  <span>
                    {getSubjectName(task)}
                  </span>

                  {task.completedAt && (
                    <small>
                      Завершено:{' '}
                      {formatDateTime(
                        task.completedAt
                      )}
                    </small>
                  )}
                </div>

                <Badge variant="success">
                  Виконано
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* EXPLANATION */}

      <aside className="uf-progress__explanation">
        <h2>Як розраховується статистика?</h2>

        <p>
          Відсоток виконання — це частка
          виконаних завдань серед усіх завдань,
          дедлайн яких потрапляє до вибраного
          періоду. Показники фокусу формуються
          за датою завершення навчальних сесій.
        </p>

        <p>
          Найближчі та прострочені дедлайни
          розраховуються від сьогоднішньої дати,
          незалежно від вибраного періоду.
        </p>
      </aside>
    </div>
  );
}
