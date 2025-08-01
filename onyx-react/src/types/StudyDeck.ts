import { Subject } from './Subject';

export interface StudyDeck {
  id: string;
  name: string;
  description?: string;
  subjects: Subject[];
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

export interface CreateStudyDeckDto {
  name: string;
  description?: string;
  subjects?: string[]; // IDs des subjects
}

export interface StudyDeckStats {
  totalSubjects: number;
  completedSubjects: number;
  totalTargetTime: number;
  totalTimeSpent: number;
  overallProgress: number;
  averageSessionTime: number;
  mostStudiedSubject?: Subject;
  leastStudiedSubject?: Subject;
}