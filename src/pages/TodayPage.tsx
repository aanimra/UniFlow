
import { useMemo } from 'react';
import { CalendarDays, CheckCircle2, ListTodo, Target } from 'lucide-react';

import { useStudy } from '../hooks/useStudy';
import { toLocalDate } from '../data/initialData';
import { Button } from '../components/ui/Button/Button';
import { Badge } from '../components/ui/Badge/Badge';
import { Card } from '../components/ui/Card/Card';
import { Link } from 'react-router-dom';

import type { Priority, StudyTask } from '../types';

import './TodayPage.css';

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

function sortTasks(tasks: StudyTask[]) {
  return [...tasks].sort((a, b) => {
    const deadlineComparison = a.deadline.localeCompare(b.deadline);

    if (deadlineComparison !== 0) {
      return deadlineComparison;
    }

    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });
}

export function TodayPage() {
  const { tasks, subjects, toggleTask } = useStudy();

  const today = toLocalDate(new Date());

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks]
  );

  const dueToday = activeTasks.filter(
    (task) => task.deadline === today
  );

  const overdue = activeTasks.filter(
    (task) => task.deadline < today
  );

  const upcomingTasks = sortTasks(activeTasks).slice(0, 5);

  const focusTasks = [...activeTasks]
    .sort((a, b) => {
      const priorityDifference =
        priorityWeight[b.priority] - priorityWeight[a.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return a.deadline.localeCompare(b.deadline);
    })
    .slice(0, 3);

  function subjectName(subjectId: string) {
    return (
      subjects.find((subject) => subject.id === subjectId)?.name ??
      'Невідомий предмет'
    );
  }

  function formatDeadline(deadline: string) {
    if (deadline === today) return 'Сьогодні';

    return new Date(`${deadline}T12:00:00`).toLocaleDateString(
      'uk-UA',
      {
        day: 'numeric',
        month: 'short',
      }
    );
  }

  function taskBadge(task: StudyTask) {
    if (task.deadline < today) {
      return <Badge variant="danger">Прострочено</Badge>;
    }

    if (task.deadline === today) {
      return <Badge variant="warning">Сьогодні</Badge>;
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

  return (
    <div className="uf-dashboard">
      <div className="uf-dashboard__heading">
        <div>
          <p className="uf-dashboard__eyebrow">
            Твій навчальний планувальник
          </p>

          <h1>Мій день</h1>

          <p className="uf-dashboard__subtitle">
            Керуй навчальними завданнями та зосереджуйся на важливому.
          </p>
        </div>

        <div className="uf-dashboard__date">
          <CalendarDays size={18} aria-hidden="true" />
          {new Date().toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className="uf-dashboard__stats">
        <Card variant="outlined">
          <div className="uf-stat">
            <ListTodo aria-hidden="true" />
            <span>Активні завдання</span>
            <strong>{activeTasks.length}</strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-stat">
            <CalendarDays aria-hidden="true" />
            <span>На сьогодні</span>
            <strong>{dueToday.length}</strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-stat">
            <CheckCircle2 aria-hidden="true" />
            <span>Виконані</span>
            <strong>{completedTasks.length}</strong>
          </div>
        </Card>
      </div>

      {overdue.length > 0 && (
        <div className="uf-dashboard__notice" role="status">
          <Badge variant="danger">
            {overdue.length} прострочено
          </Badge>
          <span>
            Переглянь завдання з минулими дедлайнами.
          </span>
        </div>
      )}

      <div className="uf-dashboard__columns">
        <section>
          <Card
            title="Зосередься сьогодні"
            description="Почни з найважливіших завдань."
            variant="default"
          >
            <div className="uf-dashboard__section-icon">
              <Target size={20} aria-hidden="true" />
              <span>Фокус сьогодні</span>
            </div>

            {focusTasks.length === 0 ? (
              <p className="uf-dashboard__empty">
                Усі завдання виконані. Чудова робота!
              </p>
            ) : (
              <div className="uf-task-list">
                {focusTasks.map((task) => (
                  <div className="uf-task-row" key={task.id}>
                    <div className="uf-task-row__info">
                      <h3>{task.title}</h3>
                      <p>{subjectName(task.subjectId)}</p>

                      <div className="uf-task-row__metadata">
                        {taskBadge(task)}
                        <span>
                          Дедлайн: {formatDeadline(task.deadline)}
                        </span>
                      </div>
                    </div>
                        
                    <Link
                        to={`/focus?task=${encodeURIComponent(task.id)}`}
                        className="uf-dashboard__focus-link"
                        >
                        Почати фокус
                    </Link>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleTask(task.id)}
                      aria-label={`Позначити виконаним: ${task.title}`}
                    >
                      Виконано
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <Card
            title="Найближчі дедлайни"
            description="Наступні завдання за датою виконання."
            variant="outlined"
          >
            {upcomingTasks.length === 0 ? (
              <p className="uf-dashboard__empty">
                Немає активних завдань.
              </p>
            ) : (
              <div className="uf-upcoming-list">
                {upcomingTasks.map((task) => (
                  <div className="uf-upcoming-item" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <span>{subjectName(task.subjectId)}</span>
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
                      {formatDeadline(task.deadline)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>

      <p className="uf-dashboard__method">
        Принцип ранжування: блок «Фокус сьогодні» спочатку
        враховує пріоритет, потім дедлайн. Список дедлайнів
        сортується за датою.
      </p>
    </div>
  );
}
