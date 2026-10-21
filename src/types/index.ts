
export type Priority = 'low' | 'medium' | 'high';

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Subject {
  id: string;
  semesterId: string;
  name: string;
  teacher?: string;
  description?: string;
  color: string;
}


export interface StudyTask {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  deadline: string;
  scheduledTime?: string;
  priority: Priority;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}
