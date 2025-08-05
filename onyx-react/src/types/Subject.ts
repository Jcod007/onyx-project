export type SubjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type DefaultTimerMode = 'simple' | 'quick_timer';

export interface QuickTimerConfig {
  type: 'simple' | 'pomodoro';
  workDuration: number; // en minutes
  shortBreakDuration?: number; // en minutes
  longBreakDuration?: number; // en minutes
  cycles?: number;
}

export interface Subject {
  id: string;
  name: string;
  status: SubjectStatus;
  targetTime: number; // en secondes
  timeSpent: number; // en secondes
  defaultTimerDuration: number; // en secondes
  lastStudyDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Champs pour liaison avec timers
  linkedTimerId?: string;
  defaultTimerMode?: DefaultTimerMode;
  quickTimerConfig?: QuickTimerConfig;
  timerConversionNote?: string;
}

export interface CreateSubjectDto {
  name: string;
  targetTime: number; // en minutes
  defaultTimerDuration?: number; // en minutes
}

export interface UpdateSubjectDto {
  name?: string;
  targetTime?: number; // en minutes
  defaultTimerDuration?: number; // en minutes
  status?: SubjectStatus;
  
  // Champs pour liaison avec timers
  linkedTimerId?: string;
  defaultTimerMode?: DefaultTimerMode;
  quickTimerConfig?: QuickTimerConfig;
  timerConversionNote?: string;
}

export interface SubjectProgress {
  subject: Subject;
  progressPercentage: number;
  remainingTime: number;
  isCompleted: boolean;
  dailyProgress: {
    date: Date;
    timeSpent: number;
  }[];
}

export const SubjectStatusLabels: Record<SubjectStatus, string> = {
  NOT_STARTED: 'Non commencé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé'
};