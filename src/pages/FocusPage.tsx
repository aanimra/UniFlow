
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  Pause,
  Play,
  RotateCcw,
  Square,
  Target,
} from 'lucide-react';

import { useStudy } from '../hooks/useStudy';
import { toLocalDate } from '../data/initialData';

import { Button } from '../components/ui/Button/Button';
import { Select } from '../components/ui/Select/Select';
import { Badge } from '../components/ui/Badge/Badge';
import { Card } from '../components/ui/Card/Card';

import './FocusPage.css';

// ============================================
// TYPES
// ============================================

type TimerStatus = 'idle' | 'running' | 'paused';

interface FocusTimer {
  status: TimerStatus;
  taskId: string;
  totalSeconds: number;
  remainingSeconds: number;
  endAt: number | null;
  startedAt: string | null;
}

interface SessionSummary {
  taskId: string;
  taskTitle: string;
  durationSeconds: number;
}

// ============================================
// CONSTANTS
// ============================================

const TIMER_STORAGE_KEY = 'uniflow-focus-timer-v1';

const DURATION_OPTIONS = [15, 25, 45, 60];

function createIdleTimer(): FocusTimer {
  return {
    status: 'idle',
    taskId: '',
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    endAt: null,
    startedAt: null,
  };
}

// ============================================
// STORAGE
// ============================================

function readStoredTimer(): FocusTimer {
  try {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);

    if (!saved) return createIdleTimer();

    const parsed: unknown = JSON.parse(saved);

    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('status' in parsed) ||
      !('taskId' in parsed) ||
      !('totalSeconds' in parsed) ||
      !('remainingSeconds' in parsed) ||
      !('endAt' in parsed) ||
      !('startedAt' in parsed)
    ) {
      return createIdleTimer();
    }

    if (
      (parsed.status !== 'idle' &&
        parsed.status !== 'running' &&
        parsed.status !== 'paused') ||
      typeof parsed.taskId !== 'string' ||
      typeof parsed.totalSeconds !== 'number' ||
      !Number.isFinite(parsed.totalSeconds) ||
      parsed.totalSeconds < 1 ||
      parsed.totalSeconds > 3600 ||
      typeof parsed.remainingSeconds !== 'number' ||
      !Number.isFinite(parsed.remainingSeconds) ||
      parsed.remainingSeconds < 0 ||
      parsed.remainingSeconds > parsed.totalSeconds ||
      (parsed.endAt !== null &&
        (typeof parsed.endAt !== 'number' ||
          !Number.isFinite(parsed.endAt))) ||
      (parsed.startedAt !== null &&
        typeof parsed.startedAt !== 'string')
    ) {
      return createIdleTimer();
    }

    if (
      parsed.status === 'running' &&
      parsed.endAt === null
    ) {
      return createIdleTimer();
    }

    return parsed as FocusTimer;
  } catch {
    return createIdleTimer();
  }
}

// ============================================
// FORMAT HELPERS
// ============================================

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);

  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;

  return (
    `${String(minutes).padStart(2, '0')}:` +
    String(remaining).padStart(2, '0')
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes === 0) {
    return `${remaining} с`;
  }

  if (remaining === 0) {
    return `${minutes} хв`;
  }

  return `${minutes} хв ${remaining} с`;
}

// ============================================
// FOCUS PAGE
// ============================================

export function FocusPage() {
  const {
    tasks,
    subjects,
    focusSessions,
    toggleTask,
    addFocusSession,
  } = useStudy();

  const [searchParams] = useSearchParams();

  const activeTasks = tasks.filter(
    (task) => !task.completed
  );

  const requestedTaskId = searchParams.get('task');

  const [timer, setTimer] = useState<FocusTimer>(
    readStoredTimer
  );

  const [selectedTaskId, setSelectedTaskId] = useState(
    () =>
      timer.taskId ||
      activeTasks.find(
        (task) => task.id === requestedTaskId
      )?.id ||
      activeTasks[0]?.id ||
      ''
  );

  const [durationMinutes, setDurationMinutes] =
    useState(() =>
      timer.status !== 'idle'
        ? timer.totalSeconds / 60
        : 25
    );

  const [now, setNow] = useState(() => Date.now());

  const [summary, setSummary] =
    useState<SessionSummary | null>(null);

  // ==========================================
  // TIMER PERSISTENCE
  // ==========================================

  useEffect(() => {
    try {
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify(timer)
      );
    } catch (error) {
      console.error(
        'Не вдалося зберегти стан таймера:',
        error
      );
    }
  }, [timer]);

  // ==========================================
  // UPDATE CLOCK
  // ==========================================

  useEffect(() => {
    if (timer.status !== 'running') {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [timer.status]);

  // ==========================================
  // DERIVED VALUES
  // ==========================================

  const isActive = timer.status !== 'idle';

  const effectiveSelectedId =
    activeTasks.some(
      (task) => task.id === selectedTaskId
    )
      ? selectedTaskId
      : activeTasks[0]?.id ?? '';

  const currentTaskId = isActive
    ? timer.taskId
    : effectiveSelectedId;

  const currentTask = tasks.find(
    (task) => task.id === currentTaskId
  );

  const currentSubject = subjects.find(
    (subject) =>
      subject.id === currentTask?.subjectId
  );

  const remainingSeconds =
    timer.status === 'running' &&
    timer.endAt !== null
      ? Math.max(
          0,
          Math.ceil((timer.endAt - now) / 1000)
        )
      : timer.remainingSeconds;

  const totalSeconds = isActive
    ? timer.totalSeconds
    : durationMinutes * 60;

  const displaySeconds = isActive
    ? remainingSeconds
    : totalSeconds;

  const workedSeconds = isActive
    ? Math.max(
        0,
        timer.totalSeconds - remainingSeconds
      )
    : 0;

  const progressPercent =
    totalSeconds > 0
      ? Math.min(
          100,
          ((totalSeconds - displaySeconds) /
            totalSeconds) *
            100
        )
      : 0;

  const timeIsUp =
    isActive && remainingSeconds === 0;

  const today = toLocalDate(new Date());

  const sessionsToday = focusSessions.filter(
    (session) =>
      toLocalDate(new Date(session.endedAt)) === today
  );

  const totalFocusedToday = sessionsToday.reduce(
    (sum, session) =>
      sum + session.durationSeconds,
    0
  );

  const recentSessions = [...focusSessions]
    .sort((a, b) =>
      b.endedAt.localeCompare(a.endedAt)
    )
    .slice(0, 5);

  const taskOptions = activeTasks.map((task) => {
    const subject = subjects.find(
      (item) => item.id === task.subjectId
    );

    return {
      value: task.id,
      label:
        `${task.title} — ` +
        (subject?.name ?? 'Предмет'),
    };
  });

  // ==========================================
  // START SESSION
  // ==========================================

  function startSession() {
    if (!currentTask || currentTask.completed) {
      return;
    }

    const timestamp = Date.now();
    const seconds = durationMinutes * 60;

    setNow(timestamp);
    setSummary(null);

    setTimer({
      status: 'running',
      taskId: currentTask.id,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      endAt: timestamp + seconds * 1000,
      startedAt: new Date(timestamp).toISOString(),
    });
  }

  // ==========================================
  // PAUSE SESSION
  // ==========================================

  function pauseSession() {
    if (
      timer.status !== 'running' ||
      timer.endAt === null
    ) {
      return;
    }

    const remaining = Math.max(
      0,
      Math.ceil(
        (timer.endAt - Date.now()) / 1000
      )
    );

    setTimer({
      ...timer,
      status: 'paused',
      remainingSeconds: remaining,
      endAt: null,
    });
  }

  // ==========================================
  // RESUME SESSION
  // ==========================================

  function resumeSession() {
    if (
      timer.status !== 'paused' ||
      timer.remainingSeconds <= 0
    ) {
      return;
    }

    const timestamp = Date.now();

    setNow(timestamp);

    setTimer({
      ...timer,
      status: 'running',
      endAt:
        timestamp +
        timer.remainingSeconds * 1000,
    });
  }

  // ==========================================
  // FINISH SESSION
  // ==========================================

  function finishSession() {
    if (!isActive || !currentTask) {
      return;
    }

    const actualRemaining =
      timer.status === 'running' &&
      timer.endAt !== null
        ? Math.max(
            0,
            Math.ceil(
              (timer.endAt - Date.now()) / 1000
            )
          )
        : timer.remainingSeconds;

    const actualWorked = Math.max(
      0,
      timer.totalSeconds - actualRemaining
    );

    if (actualWorked < 1) {
      return;
    }

    const subject = subjects.find(
      (item) =>
        item.id === currentTask.subjectId
    );

    addFocusSession({
      id: crypto.randomUUID(),
      taskId: currentTask.id,
      taskTitle: currentTask.title,
      subjectId: currentTask.subjectId,
      subjectName:
        subject?.name ?? 'Невідомий предмет',
      startedAt:
        timer.startedAt ??
        new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: actualWorked,
      plannedSeconds: timer.totalSeconds,
    });

    setSummary({
      taskId: currentTask.id,
      taskTitle: currentTask.title,
      durationSeconds: actualWorked,
    });

    setTimer(createIdleTimer());
  }

  // ==========================================
  // CANCEL SESSION
  // ==========================================

  function cancelSession() {
    if (!isActive) return;

    const confirmed = window.confirm(
      'Скасувати сесію концентрації?\n\n' +
      'Поточний результат не буде збережено.'
    );

    if (!confirmed) return;

    setTimer(createIdleTimer());
    setSummary(null);
  }

  // ==========================================
  // COMPLETE TASK
  // ==========================================

  function completeTask() {
    if (!summary) return;

    const task = tasks.find(
      (item) => item.id === summary.taskId
    );

    if (task && !task.completed) {
      toggleTask(task.id);
    }
  }

  const summaryTask = summary
    ? tasks.find(
        (task) => task.id === summary.taskId
      )
    : undefined;

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="uf-focus">
      <header className="uf-focus__heading">
        <div>
          <p className="uf-focus__eyebrow">
            РЕЖИМ КОНЦЕНТРАЦІЇ
          </p>

          <h1>Час зосередитися</h1>

          <p>
            Обери одне завдання та присвяти
            йому час без зайвих відволікань.
          </p>
        </div>

        <Link
          to="/"
          className="uf-focus__back-link"
        >
          <ArrowLeft
            size={18}
            aria-hidden="true"
          />
          Мій день
        </Link>
      </header>

      <div className="uf-focus__stats">
        <Card variant="outlined">
          <div className="uf-focus__stat">
            <Target
              size={22}
              aria-hidden="true"
            />
            <span>Сесій сьогодні</span>
            <strong>{sessionsToday.length}</strong>
          </div>
        </Card>

        <Card variant="outlined">
          <div className="uf-focus__stat">
            <Clock3
              size={22}
              aria-hidden="true"
            />
            <span>Час концентрації сьогодні</span>
            <strong>
              {formatDuration(totalFocusedToday)}
            </strong>
          </div>
        </Card>
      </div>

      <section
        aria-labelledby="focus-workspace-title"
      >
        <Card
          variant="outlined"
          className="uf-focus__workspace"
        >
          <div className="uf-focus__workspace-heading">
            <div>
              <h2 id="focus-workspace-title">
                Фокус-сесія
              </h2>

              <p>
                Керуй часом та працюй над
                вибраним завданням.
              </p>
            </div>

            <Badge
              variant={
                timeIsUp
                  ? 'success'
                  : timer.status === 'running'
                    ? 'primary'
                    : timer.status === 'paused'
                      ? 'warning'
                      : 'neutral'
              }
            >
              {timeIsUp
                ? 'Час вийшов'
                : timer.status === 'running'
                  ? 'Триває'
                  : timer.status === 'paused'
                    ? 'Пауза'
                    : 'Готовий до старту'}
            </Badge>
          </div>

          {activeTasks.length === 0 &&
            !isActive && (
              <div
                className="uf-focus__notice"
                role="status"
              >
                Немає активних завдань.
                Створи нове завдання
                або поверни виконане в активні.
              </div>
            )}

          <div className="uf-focus__settings">
            <Select
              label="Завдання для концентрації"
              options={taskOptions}
              placeholder="Обери завдання"
              value={
                isActive
                  ? timer.taskId
                  : effectiveSelectedId
              }
              disabled={
                isActive ||
                activeTasks.length === 0
              }
              onChange={(event) =>
                setSelectedTaskId(
                  event.target.value
                )
              }
            />

            <div className="uf-focus__duration">
              <span className="uf-focus__label">
                Тривалість сесії
              </span>

              <div
                className="uf-focus__presets"
                role="group"
                aria-label="Тривалість сесії"
              >
                {DURATION_OPTIONS.map(
                  (minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={[
                        'uf-focus__preset',
                        durationMinutes ===
                          minutes &&
                          'uf-focus__preset--selected',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() =>
                        setDurationMinutes(
                          minutes
                        )
                      }
                      disabled={isActive}
                      aria-pressed={
                        durationMinutes === minutes
                      }
                    >
                      {minutes} хв
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="uf-focus__timer-area">
            <div
              className="uf-focus__timer-icon"
              aria-hidden="true"
            >
              <Target size={26} />
            </div>

            <div
              className="uf-focus__timer"
              aria-label={
                `Залишилося часу: ` +
                formatTimer(displaySeconds)
              }
            >
              {formatTimer(displaySeconds)}
            </div>

            <div className="uf-focus__progress">
              <div
                className="uf-focus__progress-track"
                role="progressbar"
                aria-label="Прогрес фокус-сесії"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(
                  progressPercent
                )}
              >
                <div
                  className="uf-focus__progress-fill"
                  style={{
                    width:
                      `${progressPercent}%`,
                  }}
                />
              </div>

              <span>
                {Math.round(
                  progressPercent
                )}% завершено
              </span>
            </div>

            <p className="uf-focus__selected-task">
              {currentTask
                ? currentTask.title
                : 'Оберіть завдання'}
            </p>

            {currentSubject && (
              <p className="uf-focus__subject">
                {currentSubject.name}
              </p>
            )}

            {timeIsUp && (
              <p
                className="uf-focus__finished-notice"
                role="status"
              >
                Запланований час минув!
                Заверши сесію, щоб зберегти
                результат навчання.
              </p>
            )}

            {isActive && !currentTask && (
              <p
                className="uf-focus__notice"
                role="alert"
              >
                Завдання цієї сесії більше
                не існує. Скасуй сесію
                та вибери інше.
              </p>
            )}

            <div className="uf-focus__actions">
              {!isActive && (
                <Button
                  onClick={startSession}
                  disabled={!currentTask}
                  size="lg"
                >
                  <Play
                    size={19}
                    aria-hidden="true"
                  />
                  Почати фокус
                </Button>
              )}

              {timer.status === 'running' &&
                !timeIsUp && (
                  <Button
                    onClick={pauseSession}
                    variant="secondary"
                    size="lg"
                  >
                    <Pause
                      size={19}
                      aria-hidden="true"
                    />
                    Пауза
                  </Button>
                )}

              {timer.status === 'paused' &&
                remainingSeconds > 0 && (
                  <Button
                    onClick={resumeSession}
                    size="lg"
                  >
                    <Play
                      size={19}
                      aria-hidden="true"
                    />
                    Продовжити
                  </Button>
                )}

              {isActive && (
                <>
                  <Button
                    onClick={finishSession}
                    disabled={
                      workedSeconds < 1 ||
                      !currentTask
                    }
                    size="lg"
                  >
                    <Square
                      size={17}
                      aria-hidden="true"
                    />
                    Завершити сесію
                  </Button>

                  <Button
                    variant="outline"
                    onClick={cancelSession}
                    size="lg"
                  >
                    <RotateCcw
                      size={18}
                      aria-hidden="true"
                    />
                    Скасувати
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </section>

      {summary && (
        <section
          className="uf-focus__summary"
          aria-labelledby="focus-summary-title"
        >
          <Card variant="soft">
            <div className="uf-focus__summary-content">
              <CheckCircle2
                size={32}
                aria-hidden="true"
              />

              <h2 id="focus-summary-title">
                Сесію збережено!
              </h2>

              <p>
                Ти працювала над завданням
                «{summary.taskTitle}» протягом{' '}
                <strong>
                  {formatDuration(
                    summary.durationSeconds
                  )}
                </strong>.
              </p>

              <div className="uf-focus__summary-actions">
                {summaryTask &&
                  !summaryTask.completed && (
                    <Button
                      onClick={completeTask}
                    >
                      <CheckCircle2
                        size={18}
                        aria-hidden="true"
                      />
                      Позначити завдання виконаним
                    </Button>
                  )}

                <Link
                  to="/"
                  className="uf-focus__back-link"
                >
                  Повернутися до Мого дня
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}

      <section
        className="uf-focus__history"
        aria-labelledby="focus-history-title"
      >
        <div className="uf-focus__history-heading">
          <History
            size={21}
            aria-hidden="true"
          />

          <h2 id="focus-history-title">
            Останні фокус-сесії
          </h2>
        </div>

        {recentSessions.length === 0 ? (
          <div className="uf-focus__empty">
            <History
              size={30}
              aria-hidden="true"
            />

            <p>
              Поки немає завершених сесій.
              Твоя історія концентрації
              з'явиться тут.
            </p>
          </div>
        ) : (
          <div className="uf-focus__history-list">
            {recentSessions.map(
              (session) => (
                <Card
                  key={session.id}
                  variant="outlined"
                  className="uf-focus__history-card"
                >
                  <div className="uf-focus__history-item">
                    <div>
                      <h3>
                        {session.taskTitle}
                      </h3>

                      <p>
                        {session.subjectName}
                      </p>

                      <span>
                        {new Date(
                          session.endedAt
                        ).toLocaleString(
                          'uk-UA',
                          {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                    </div>

                    <Badge variant="success">
                      {formatDuration(
                        session.durationSeconds
                      )}
                    </Badge>
                  </div>
                </Card>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
