/**
 * Constantes de l'application - Migration de Constants.java
 */

// Limites des timers
export const TIMER_LIMITS = {
  MAX_HOURS: 99,
  MAX_MINUTES: 59,
  MAX_SECONDS: 59,
  MIN_VALUE: 0,
} as const;

// Dimensions de l'interface
export const UI_DIMENSIONS = {
  MAIN_WINDOW_WIDTH: 1000,
  MAIN_WINDOW_HEIGHT: 700,
  SIDEBAR_WIDTH: 250,
  TIMER_CARD_MIN_WIDTH: 280,
  TIMER_CARD_MIN_HEIGHT: 180,
} as const;

// Intervalles de mise à jour
export const UPDATE_INTERVALS = {
  TIMER_UPDATE_MS: 1000,
  AUTO_SAVE_MS: 30000,
  PROGRESS_ANIMATION_MS: 500,
} as const;

// Configuration Pomodoro par défaut
export const POMODORO_CONFIG = {
  WORK_DURATION: 25 * 60, // 25 minutes
  SHORT_BREAK_DURATION: 5 * 60, // 5 minutes
  LONG_BREAK_DURATION: 15 * 60, // 15 minutes
  LONG_BREAK_INTERVAL: 4, // après 4 sessions de travail
} as const;

// Stockage local
export const STORAGE_KEYS = {
  SUBJECTS: 'onyx_subjects',
  TIMERS: 'onyx_timers',
  STUDY_DECKS: 'onyx_study_decks',
  SETTINGS: 'onyx_settings',
  STUDY_SESSIONS: 'onyx_study_sessions',
} as const;

// Messages et labels
export const MESSAGES = {
  TIMER_FINISHED: 'Timer terminé !',
  SESSION_COMPLETED: 'Session d\'étude terminée',
  BREAK_TIME: 'C\'est l\'heure de la pause !',
  BACK_TO_WORK: 'Retour au travail !',
  SUBJECT_COMPLETED: 'Objectif de la matière atteint !',
} as const;

// Couleurs du thème
export const THEME_COLORS = {
  PRIMARY: '#3b82f6',
  PRIMARY_DARK: '#1d4ed8',
  SECONDARY: '#64748b',
  SUCCESS: '#16a34a',
  WARNING: '#d97706',
  DANGER: '#dc2626',
  BACKGROUND: '#f8fafc',
  SURFACE: '#ffffff',
  BORDER: '#e2e8f0',
} as const;

// Sons
export const SOUNDS = {
  TIMER_COMPLETE: '/sounds/timer-complete.mp3',
  NOTIFICATION: '/sounds/notification.mp3',
  TICK: '/sounds/tick.mp3',
} as const;

// Formats de date
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm:ss',
} as const;

// Validation
export const VALIDATION = {
  SUBJECT_NAME_MIN_LENGTH: 1,
  SUBJECT_NAME_MAX_LENGTH: 100,
  TIMER_MIN_SECONDS: 1,
  TIMER_MAX_SECONDS: TIMER_LIMITS.MAX_HOURS * 3600 + TIMER_LIMITS.MAX_MINUTES * 60 + TIMER_LIMITS.MAX_SECONDS,
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  TIMERS: '/timers',
  STUDY: '/study',
  SUBJECTS: '/subjects',
  SETTINGS: '/settings',
  STATISTICS: '/statistics',
} as const;