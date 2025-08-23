import { Subject } from './Subject';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';
export type TimerType = 'STUDY_SESSION' | 'FREE_SESSION' | 'MANUAL_ENTRY';
export type TimerMode = 'work' | 'break' | 'longBreak';

export interface TimerModel {
  id: string;
  hours: number;
  minutes: number;
  seconds: number;
  initHours: number;
  initMinutes: number; 
  initSeconds: number;
  timerType: TimerType;
  linkedSubject?: Subject;
  state: TimerState;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimerDto {
  hours: number;
  minutes: number;
  seconds: number;
  timerType: TimerType;
  linkedSubjectId?: string;
}

export interface TimerConfig {
  workDuration: number; // en secondes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // après combien de sessions work
}

export interface TimerConfigResult {
  hours: number;
  minutes: number;
  seconds: number;
  timerType: TimerType;
  linkedSubject?: Subject;
}

export interface TimerData {
  timeRemaining: number;
  totalTime: number;
  state: TimerState;
  mode: TimerMode;
  sessionCount: number;
  currentCycle?: number;
  maxCycles?: number;
  isPomodoroMode?: boolean;
}

export interface StudySession {
  id: string;
  subjectId: string;
  duration: number; // en secondes
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  timerType: TimerType;
  notes?: string;
}

export const TimerTypeLabels: Record<TimerType, string> = {
  STUDY_SESSION: '📖 Session d\'étude',
  FREE_SESSION: '🆓 Session libre',
  MANUAL_ENTRY: '✍️ Ajout manuel'
};

export const TimerStateLabels: Record<TimerState, string> = {
  idle: 'Prêt',
  running: 'En cours',
  paused: 'En pause',
  finished: 'Terminé'
};

export const TimerModeLabels: Record<TimerMode, string> = {
  work: 'Travail',
  break: 'Pause courte', 
  longBreak: 'Pause longue'
};