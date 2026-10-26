
import { createContext } from 'react';

import type {
  Semester,
  Subject,
  StudyTask,
  FocusSession,
} from '../types';

export interface StudyContextValue {
  semesters: Semester[];
  subjects: Subject[];
  tasks: StudyTask[];
  focusSessions: FocusSession[];

  addSemester: (semester: Semester) => void;
  updateSemester: (semester: Semester) => void;
  deleteSemester: (id: string) => void;
  restoreDeletedSemester: (semester: Semester, subjects: Subject[], tasks: StudyTask[]) => void;

  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  restoreDeletedSubject: (subject: Subject, tasks: StudyTask[]) => boolean;

  addTask: (task: StudyTask) => void;
  updateTask: (task: StudyTask) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  restoreDeletedTask: (task: StudyTask) => boolean;

  addFocusSession: (session: FocusSession) => void;
}

export const StudyContext =
  createContext<StudyContextValue | null>(null);
