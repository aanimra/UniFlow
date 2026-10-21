
import { createContext } from 'react';

import type {
  Semester,
  Subject,
  StudyTask,
} from '../types';

export interface StudyContextValue {
  semesters: Semester[];
  subjects: Subject[];
  tasks: StudyTask[];

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
}

export const StudyContext =
  createContext<StudyContextValue | null>(null);
