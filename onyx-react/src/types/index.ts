// Export all types
export * from './Subject';
export * from './Timer';
export * from './StudyDeck';

// Common utility types

export interface TimeSpan {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  timer: {
    autoStart: boolean;
    autoBreak: boolean;
    longBreakInterval: number;
  };
  storage: {
    autoSave: boolean;
    backupEnabled: boolean;
  };
}