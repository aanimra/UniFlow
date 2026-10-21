
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

  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;

  addTask: (task: StudyTask) => void;
  updateTask: (task: StudyTask) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addFocusSession: (session: FocusSession) => void;
}

export const StudyContext =
  createContext<StudyContextValue | null>(null);
