
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import type {
  Semester,
  Subject,
  StudyTask,
  FocusSession,
} from '../types';

import {
  initialSemesters,
  initialSubjects,
  initialTasks,
} from '../data/initialData';

import { StudyContext } from './StudyContextDefinition';

const STORAGE_KEY = 'uniflow-study-data-v1';

interface SavedStudyData {
  semesters: Semester[];
  subjects: Subject[];
  tasks: StudyTask[];
  focusSessions: FocusSession[];
}

function readInitialData(): SavedStudyData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'semesters' in parsed &&
        'subjects' in parsed &&
        'tasks' in parsed &&
        Array.isArray(parsed.semesters) &&
        Array.isArray(parsed.subjects) &&
        Array.isArray(parsed.tasks)
      ) {
        return {
          semesters: parsed.semesters as Semester[],
          subjects: parsed.subjects as Subject[],
          tasks: parsed.tasks as StudyTask[],
          focusSessions:
            'focusSessions' in parsed &&
            Array.isArray(parsed.focusSessions)
              ? (parsed.focusSessions as FocusSession[])
              : [],
        };
      }
    }
  } catch (error) {
    console.error('Помилка читання localStorage:', error);
  }

  return {
    semesters: initialSemesters,
    subjects: initialSubjects,
    tasks: initialTasks,
    focusSessions: [],
  };
}

export function StudyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [initialData] = useState(readInitialData);

  const [semesters, setSemesters] = useState<Semester[]>(
    initialData.semesters
  );

  const [subjects, setSubjects] = useState<Subject[]>(
    initialData.subjects
  );

  const [tasks, setTasks] = useState<StudyTask[]>(
    initialData.tasks
  );

  const [focusSessions, setFocusSessions] = useState<
    FocusSession[]
  >(initialData.focusSessions);

  useEffect(() => {
    const data: SavedStudyData = {
      semesters,
      subjects,
      tasks,
      focusSessions,
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Помилка збереження даних:', error);
    }
  }, [semesters, subjects, tasks, focusSessions]);

  function addSemester(semester: Semester) {
    setSemesters((previous) => [...previous, semester]);
  }

  function updateSemester(updatedSemester: Semester) {
    setSemesters((previous) =>
      previous.map((semester) =>
        semester.id === updatedSemester.id
          ? updatedSemester
          : semester
      )
    );
  }

  function deleteSemester(id: string) {
    const subjectIds = new Set(
      subjects
        .filter((subject) => subject.semesterId === id)
        .map((subject) => subject.id)
    );

    setSemesters((previous) =>
      previous.filter((semester) => semester.id !== id)
    );

    setSubjects((previous) =>
      previous.filter((subject) => subject.semesterId !== id)
    );

    setTasks((previous) =>
      previous.filter(
        (task) => !subjectIds.has(task.subjectId)
      )
    );
  }

  function addSubject(subject: Subject) {
    setSubjects((previous) => [...previous, subject]);
  }

  function updateSubject(updatedSubject: Subject) {
    setSubjects((previous) =>
      previous.map((subject) =>
        subject.id === updatedSubject.id
          ? updatedSubject
          : subject
      )
    );
  }

  function deleteSubject(id: string) {
    setSubjects((previous) =>
      previous.filter((subject) => subject.id !== id)
    );

    setTasks((previous) =>
      previous.filter((task) => task.subjectId !== id)
    );
  }

  function addTask(task: StudyTask) {
    setTasks((previous) => [...previous, task]);
  }

  function updateTask(updatedTask: StudyTask) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  }

  function toggleTask(id: string) {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== id) return task;

        const completed = !task.completed;

        return {
          ...task,
          completed,
          completedAt: completed
            ? new Date().toISOString()
            : undefined,
        };
      })
    );
  }

  function deleteTask(id: string) {
    setTasks((previous) =>
      previous.filter((task) => task.id !== id)
    );
  }

  // Undo snapshots are restored by ID, without overwriting newer records.
  function restoreDeletedTask(task: StudyTask): boolean {
    if (!subjects.some((subject) => subject.id === task.subjectId)) return false;
    setTasks((previous) => previous.some((item) => item.id === task.id)
      ? previous : [...previous, task]);
    return true;
  }

  function restoreDeletedSubject(subject: Subject, deletedTasks: StudyTask[]): boolean {
    if (!semesters.some((semester) => semester.id === subject.semesterId)) return false;
    setSubjects((previous) => previous.some((item) => item.id === subject.id)
      ? previous : [...previous, subject]);
    const ownedTasks = deletedTasks.filter((task) => task.subjectId === subject.id);
    setTasks((previous) => {
      const existing = new Set(previous.map((task) => task.id));
      return [...previous, ...ownedTasks.filter((task) => !existing.has(task.id))];
    });
    return true;
  }

  function restoreDeletedSemester(semester: Semester, deletedSubjects: Subject[], deletedTasks: StudyTask[]) {
    setSemesters((previous) => previous.some((item) => item.id === semester.id)
      ? previous : [...previous, semester]);
    const ownedSubjects = deletedSubjects.filter((subject) => subject.semesterId === semester.id);
    setSubjects((previous) => {
      const existing = new Set(previous.map((subject) => subject.id));
      return [...previous, ...ownedSubjects.filter((subject) => !existing.has(subject.id))];
    });
    const ownedSubjectIds = new Set(ownedSubjects.map((subject) => subject.id));
    setTasks((previous) => {
      const existing = new Set(previous.map((task) => task.id));
      return [...previous, ...deletedTasks.filter((task) => ownedSubjectIds.has(task.subjectId) && !existing.has(task.id))];
    });
  }

  function addFocusSession(session: FocusSession) {
    setFocusSessions((previous) => [
      ...previous,
      session,
    ]);
  }

  return (
    <StudyContext.Provider
      value={{
        semesters,
        subjects,
        tasks,
        focusSessions,
        addSemester,
        updateSemester,
        deleteSemester,
        restoreDeletedSemester,
        addSubject,
        updateSubject,
        deleteSubject,
        restoreDeletedSubject,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
        restoreDeletedTask,
        addFocusSession,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}
