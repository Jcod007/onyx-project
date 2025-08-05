export type SubjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type DefaultTimerMode = 'simple' | 'quick_timer';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

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
  
  // 📅 PLANIFICATION CALENDRIER
  weeklyTimeGoal: number; // Objectif hebdomadaire en minutes (ex: 240 = 4h/semaine)
  studyDays: DayOfWeek[]; // Jours sélectionnés pour étude (ex: ['MONDAY', 'WEDNESDAY', 'FRIDAY'])
  
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
  
  // 📅 PLANIFICATION CALENDRIER
  weeklyTimeGoal?: number; // Objectif hebdomadaire en minutes
  studyDays?: DayOfWeek[]; // Jours sélectionnés pour étude
}

export interface UpdateSubjectDto {
  name?: string;
  targetTime?: number; // en minutes
  defaultTimerDuration?: number; // en minutes
  status?: SubjectStatus;
  
  // 📅 PLANIFICATION CALENDRIER
  weeklyTimeGoal?: number; // Objectif hebdomadaire en minutes
  studyDays?: DayOfWeek[]; // Jours sélectionnés pour étude
  
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

export const DayLabels: Record<DayOfWeek, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche'
};

// 📅 TYPES POUR CALENDRIER
export interface DayStudySession {
  id: string;
  subjectId: string;
  subject: Subject;
  date: Date;
  plannedDuration: number; // en minutes (calculé depuis timer lié ou rapide)
  timerType: 'quick' | 'linked';
  timerConfig: QuickTimerConfig | { timerId: string }; // Config directe ou référence au timer
}

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  sessions: DayStudySession[];
  totalPlannedTime: number; // en minutes
}