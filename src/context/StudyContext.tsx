
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import type {
  Semester,
  Subject,
  StudyTask,
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

  useEffect(() => {
    const data: SavedStudyData = {
      semesters,
      subjects,
      tasks,
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Помилка збереження даних:', error);
    }
  }, [semesters, subjects, tasks]);

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
      previous.filter((task) => !subjectIds.has(task.subjectId))
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

  return (
    <StudyContext.Provider
      value={{
        semesters,
        subjects,
        tasks,
        addSemester,
        updateSemester,
        deleteSemester,
        addSubject,
        updateSubject,
        deleteSubject,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}
