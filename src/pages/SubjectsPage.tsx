
import { useState } from 'react';
import type { FormEvent } from 'react';

import {
  BookOpen,
  CalendarDays,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { useStudy } from '../hooks/useStudy';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button/Button';
import { Card } from '../components/ui/Card/Card';
import { Input } from '../components/ui/Input/Input';

import type { Semester, Subject } from '../types';

import './SubjectsPage.css';

type SemesterDraft = Pick<
  Semester,
  'name' | 'startDate' | 'endDate'
>;

type SubjectDraft = Pick<
  Subject,
  'name' | 'teacher' | 'description' | 'color'
>;

const emptySemester: SemesterDraft = {
  name: '',
  startDate: '',
  endDate: '',
};

const emptySubject: SubjectDraft = {
  name: '',
  teacher: '',
  description: '',
  color: '#5946C8',
};

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    'uk-UA',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

function normalizeSubjectName(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('uk-UA');
}

export function SubjectsPage() {
  const { notify } = useToast();
  const {
    semesters,
    subjects,
    tasks,
    addSemester,
    updateSemester,
    deleteSemester,
    restoreDeletedSemester,
    addSubject,
    updateSubject,
    deleteSubject,
    restoreDeletedSubject,
  } = useStudy();

  const [selectedSemesterId, setSelectedSemesterId] =
    useState('');

  const [semesterFormOpen, setSemesterFormOpen] =
    useState(false);

  const [subjectFormOpen, setSubjectFormOpen] =
    useState(false);

  const [editingSemesterId, setEditingSemesterId] =
    useState<string | null>(null);

  const [editingSubjectId, setEditingSubjectId] =
    useState<string | null>(null);

  const [semesterDraft, setSemesterDraft] =
    useState<SemesterDraft>(emptySemester);

  const [subjectDraft, setSubjectDraft] =
    useState<SubjectDraft>(emptySubject);

  const [semesterError, setSemesterError] = useState('');
  const [subjectError, setSubjectError] = useState('');

  const activeSemesterId =
    semesters.some((item) => item.id === selectedSemesterId)
      ? selectedSemesterId
      : (semesters[0]?.id ?? '');

  const activeSemester = semesters.find(
    (item) => item.id === activeSemesterId
  );

  const visibleSubjects = subjects.filter(
    (subject) => subject.semesterId === activeSemesterId
  );

  function openNewSemester() {
    setEditingSemesterId(null);
    setSemesterDraft(emptySemester);
    setSemesterError('');
    setSemesterFormOpen(true);
  }

  function openEditSemester(semester: Semester) {
    setEditingSemesterId(semester.id);
    setSemesterDraft({
      name: semester.name,
      startDate: semester.startDate,
      endDate: semester.endDate,
    });
    setSemesterError('');
    setSemesterFormOpen(true);
  }

  function saveSemester(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = semesterDraft.name.trim();

    if (!name) {
      setSemesterError('Введи назву семестру.');
      return;
    }

    if (!semesterDraft.startDate || !semesterDraft.endDate) {
      setSemesterError('Заповни початкову та кінцеву дати.');
      return;
    }

    if (semesterDraft.startDate > semesterDraft.endDate) {
      setSemesterError(
        'Дата завершення не може бути раніше дати початку.'
      );
      return;
    }

    if (editingSemesterId) {
      updateSemester({
        id: editingSemesterId,
        name,
        startDate: semesterDraft.startDate,
        endDate: semesterDraft.endDate,
      });
      notify({ type: 'success', title: 'Семестр оновлено', description: `«${name}»: зміни збережено.` });
    } else {
      const id = crypto.randomUUID();

      addSemester({
        id,
        name,
        startDate: semesterDraft.startDate,
        endDate: semesterDraft.endDate,
      });

      setSelectedSemesterId(id);
      notify({ type: 'success', title: 'Семестр створено', description: `«${name}» додано.` });
    }

    setSemesterFormOpen(false);
    setEditingSemesterId(null);
    setSemesterError('');
  }

  function removeSemester(semester: Semester) {
    const linkedSubjects = subjects.filter(
      (subject) => subject.semesterId === semester.id
    );

    const linkedIds = new Set(
      linkedSubjects.map((subject) => subject.id)
    );

    const linkedTasks = tasks.filter(
      (task) => linkedIds.has(task.subjectId)
    );

    const confirmed = window.confirm(
      `Видалити семестр «${semester.name}»?\n\n` +
      `Буде також видалено ${linkedSubjects.length} предметів ` +
      `і ${linkedTasks.length} завдань.\n\n` +
      'Після видалення дані можна відновити протягом 10 секунд.'
    );

    if (!confirmed) return;

    deleteSemester(semester.id);
    notify({
      type: 'success', title: 'Семестр видалено',
      description: `«${semester.name}» та пов’язані дані видалено.`, durationMs: 10000,
      action: { label: 'Відновити', onClick: () => {
        restoreDeletedSemester(semester, linkedSubjects, linkedTasks);
        setSelectedSemesterId(semester.id);
      } },
    });
    setSelectedSemesterId('');
    setSemesterFormOpen(false);
    setSubjectFormOpen(false);
  }

  function openNewSubject() {
    setEditingSubjectId(null);
    setSubjectDraft(emptySubject);
    setSubjectError('');
    setSubjectFormOpen(true);
  }

  function openEditSubject(subject: Subject) {
    setEditingSubjectId(subject.id);
    setSubjectDraft({
      name: subject.name,
      teacher: subject.teacher ?? '',
      description: subject.description ?? '',
      color: subject.color,
    });
    setSubjectError('');
    setSubjectFormOpen(true);
  }

  function saveSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = subjectDraft.name.trim();

    if (!activeSemesterId) {
      setSubjectError('Спочатку створи семестр.');
      return;
    }

    if (!name) {
      setSubjectError('Введи назву предмета.');
      return;
    }


    const normalizedName = normalizeSubjectName(name);

    const duplicate = subjects.some(
    (subject) =>
        subject.semesterId === activeSemesterId &&
        subject.id !== editingSubjectId &&
        normalizeSubjectName(subject.name) === normalizedName
    );

    if (duplicate) {
    setSubjectError(
        'Предмет із такою назвою вже існує в цьому семестрі.'
    );
    return;
    }

    const subject: Subject = {
      id: editingSubjectId ?? crypto.randomUUID(),
      semesterId: activeSemesterId,
      name,
      teacher: subjectDraft.teacher?.trim(),
      description: subjectDraft.description?.trim(),
      color: subjectDraft.color,
    };

    if (editingSubjectId) {
      updateSubject(subject);
      notify({ type: 'success', title: 'Предмет оновлено', description: `«${name}»: зміни збережено.` });
    } else {
      addSubject(subject);
      notify({ type: 'success', title: 'Предмет створено', description: `«${name}» додано до семестру.` });
    }

    setSubjectFormOpen(false);
    setEditingSubjectId(null);
    setSubjectError('');
  }

  function removeSubject(subject: Subject) {
    const linkedTasks = tasks.filter(
      (task) => task.subjectId === subject.id
    );

    const confirmed = window.confirm(
      `Видалити предмет «${subject.name}»?\n\n` +
      `Також буде видалено ${linkedTasks.length} завдань.\n` +
      'Після видалення дані можна відновити протягом 10 секунд.'
    );

    if (!confirmed) return;

    deleteSubject(subject.id);
    notify({
      type: 'success', title: 'Предмет видалено',
      description: `«${subject.name}» та пов’язані завдання видалено.`, durationMs: 10000,
      action: { label: 'Відновити', onClick: () => {
        const restored = restoreDeletedSubject(subject, linkedTasks);
        if (!restored) notify({ type: 'error', title: 'Не вдалося відновити предмет', description: 'Семестр видалено або предмет вже існує.' });
      } },
    });
    setSubjectFormOpen(false);
  }

  return (
    <div className="uf-subjects">
      <header className="uf-subjects__heading">
        <div>
          <p className="uf-subjects__eyebrow">
            ОРГАНІЗАЦІЯ НАВЧАННЯ
          </p>

          <h1>Мої предмети</h1>

          <p>
            Керуй семестрами та навчальними дисциплінами.
          </p>
        </div>

        <Button onClick={openNewSemester}>
          <Plus size={18} aria-hidden="true" />
          Новий семестр
        </Button>
      </header>

      <section aria-label="Семестри">
        <div className="uf-subjects__section-heading">
          <h2>Семестри</h2>
          <span>{semesters.length}</span>
        </div>

        <div className="uf-semester-list">
          {semesters.map((semester) => (
            <div
              key={semester.id}
              className={[
                'uf-semester',
                activeSemesterId === semester.id &&
                  'uf-semester--active',
              ].filter(Boolean).join(' ')}
            >
              <button
                type="button"
                className="uf-semester__select"
                onClick={() => {
                  setSelectedSemesterId(semester.id);
                  setSubjectFormOpen(false);
                }}
                aria-pressed={activeSemesterId === semester.id}
              >
                <CalendarDays size={17} aria-hidden="true" />
                <span>{semester.name}</span>
              </button>

              <button
                type="button"
                className="uf-icon-action"
                aria-label={`Редагувати ${semester.name}`}
                onClick={() => openEditSemester(semester)}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="uf-icon-action uf-icon-action--danger"
                aria-label={`Видалити ${semester.name}`}
                onClick={() => removeSemester(semester)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {semesterFormOpen && (
        <Card
          title={
            editingSemesterId
              ? 'Редагувати семестр'
              : 'Створити семестр'
          }
          variant="outlined"
        >
          <form
            className="uf-subjects__form"
            onSubmit={saveSemester}
          >
            <Input
              label="Назва семестру"
              required
              value={semesterDraft.name}
              onChange={(event) =>
                setSemesterDraft((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              placeholder="Наприклад, Осінній семестр 2026"
            />

            <div className="uf-subjects__form-grid">
              <Input
                label="Дата початку"
                type="date"
                required
                value={semesterDraft.startDate}
                onChange={(event) =>
                  setSemesterDraft((previous) => ({
                    ...previous,
                    startDate: event.target.value,
                  }))
                }
              />

              <Input
                label="Дата завершення"
                type="date"
                required
                value={semesterDraft.endDate}
                onChange={(event) =>
                  setSemesterDraft((previous) => ({
                    ...previous,
                    endDate: event.target.value,
                  }))
                }
              />
            </div>

            {semesterError && (
              <p role="alert" className="uf-subjects__error">
                {semesterError}
              </p>
            )}

            <div className="uf-subjects__actions">
              <Button type="submit">
                Зберегти семестр
              </Button>

              <Button
                variant="outline"
                onClick={() => setSemesterFormOpen(false)}
              >
                Скасувати
              </Button>
            </div>
          </form>
        </Card>
      )}

      <section aria-labelledby="subjects-heading">
        <div className="uf-subjects__section-heading">
          <div>
            <h2 id="subjects-heading">Навчальні предмети</h2>
            {activeSemester && (
              <p>
                {formatDate(activeSemester.startDate)}
                {' — '}
                {formatDate(activeSemester.endDate)}
              </p>
            )}
          </div>

          <Button
            onClick={openNewSubject}
            disabled={!activeSemester}
          >
            <Plus size={18} aria-hidden="true" />
            Додати предмет
          </Button>
        </div>

        {!activeSemester ? (
          <div className="uf-subjects__empty">
            <BookOpen size={32} aria-hidden="true" />
            <h3>Поки немає семестрів</h3>
            <p>
              Створи перший семестр, щоб додавати предмети.
            </p>
          </div>
        ) : visibleSubjects.length === 0 ? (
          <div className="uf-subjects__empty">
            <BookOpen size={32} aria-hidden="true" />
            <h3>Предметів поки немає</h3>
            <p>
              Додай навчальну дисципліну до цього семестру.
            </p>
          </div>
        ) : (
          <div className="uf-subjects__grid">
            {visibleSubjects.map((subject) => {
              const subjectTasks = tasks.filter(
                (task) => task.subjectId === subject.id
              );

              const activeTasks = subjectTasks.filter(
                (task) => !task.completed
              );

              return (
                <Card
                  key={subject.id}
                  variant="outlined"
                  className="uf-subject-card"
                >
                  <div
                    className="uf-subject-card__accent"
                    style={{ backgroundColor: subject.color }}
                    aria-hidden="true"
                  />

                  <div className="uf-subject-card__main">
                    <BookOpen
                      size={22}
                      color={subject.color}
                      aria-hidden="true"
                    />

                    <h3>{subject.name}</h3>

                    {subject.teacher && (
                      <p>Викладач: {subject.teacher}</p>
                    )}

                    {subject.description && (
                      <p>{subject.description}</p>
                    )}

                    <span className="uf-subject-card__count">
                      Активних завдань: {activeTasks.length}
                    </span>
                  </div>

                  <div className="uf-subject-card__actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditSubject(subject)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                      Редагувати
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeSubject(subject)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      Видалити
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {subjectFormOpen && activeSemester && (
        <Card
          title={
            editingSubjectId
              ? 'Редагувати предмет'
              : 'Новий предмет'
          }
          description={`Семестр: ${activeSemester.name}`}
          variant="outlined"
        >
          <form
            className="uf-subjects__form"
            onSubmit={saveSubject}
          >
            <Input
              label="Назва предмета"
              required
              value={subjectDraft.name}
              onChange={(event) =>
                setSubjectDraft((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              placeholder="Наприклад, Основи UI/UX"
            />

            <Input
              label="Викладач"
              value={subjectDraft.teacher ?? ''}
              onChange={(event) =>
                setSubjectDraft((previous) => ({
                  ...previous,
                  teacher: event.target.value,
                }))
              }
              placeholder="Необов'язкове поле"
            />

            <div className="uf-subjects__form-field">
              <label htmlFor="subject-description">
                Опис предмета
              </label>

              <textarea
                id="subject-description"
                rows={3}
                value={subjectDraft.description ?? ''}
                onChange={(event) =>
                  setSubjectDraft((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Коротка інформація про дисципліну"
              />
            </div>

            <div className="uf-subjects__form-field">
              <label htmlFor="subject-color">
                Колір предмета
              </label>

              <div className="uf-subjects__color-row">
                <input
                  id="subject-color"
                  type="color"
                  value={subjectDraft.color}
                  onChange={(event) =>
                    setSubjectDraft((previous) => ({
                      ...previous,
                      color: event.target.value,
                    }))
                  }
                />

                <span>{subjectDraft.color}</span>
              </div>
            </div>

            {subjectError && (
              <p role="alert" className="uf-subjects__error">
                {subjectError}
              </p>
            )}

            <div className="uf-subjects__actions">
              <Button type="submit">
                {editingSubjectId
                  ? 'Зберегти зміни'
                  : 'Створити предмет'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setSubjectFormOpen(false)}
              >
                Скасувати
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
