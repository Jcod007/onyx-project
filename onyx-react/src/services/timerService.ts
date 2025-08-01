/**
 * Service de gestion des timers - Version améliorée du service JavaFX
 */

import { TimerState, TimerMode, TimerConfig, TimerData } from '@/types/Timer';

// Re-export types pour faciliter l'importation
export type { TimerMode, TimerConfig, TimerData, TimerState };
import { POMODORO_CONFIG } from '@/utils/constants';

export type TimerCallback = (data: TimerData) => void;

export class TimerService {
  private timeRemaining: number = 0;
  private totalTime: number = 0;
  private state: TimerState = 'idle';
  private mode: TimerMode = 'work';
  private sessionCount: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private config: TimerConfig;
  private isPomodoroMode: boolean = false;
  private currentCycle: number = 0;
  private maxCycles: number = 0;
  private autoTransitionTimeout: NodeJS.Timeout | null = null;
  
  private onTickCallback?: TimerCallback;
  private onStateChangedCallback?: TimerCallback;
  private onFinishedCallback?: TimerCallback;
  private onModeChangeCallback?: TimerCallback;
  private onCycleCompleteCallback?: TimerCallback;

  constructor(config: TimerConfig = {
    workDuration: POMODORO_CONFIG.WORK_DURATION,
    shortBreakDuration: POMODORO_CONFIG.SHORT_BREAK_DURATION,
    longBreakDuration: POMODORO_CONFIG.LONG_BREAK_DURATION,
    longBreakInterval: POMODORO_CONFIG.LONG_BREAK_INTERVAL
  }, isPomodoroMode: boolean = false, maxCycles: number = 0) {
    this.config = config;
    this.isPomodoroMode = isPomodoroMode;
    this.maxCycles = maxCycles;
    this.reset();
  }

  start(): void {
    if (this.state === 'running') return;
    
    if (this.state === 'idle') {
      this.timeRemaining = this.getCurrentModeDuration();
      this.totalTime = this.timeRemaining;
    }
    
    this.state = 'running';
    this.notifyStateChanged();
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause(): void {
    if (this.state !== 'running') return;
    
    this.state = 'paused';
    this.clearInterval();
    this.notifyStateChanged();
  }

  stop(): void {
    this.state = 'idle';
    this.clearInterval();
    this.reset();
    this.notifyStateChanged();
  }

  reset(): void {
    this.clearInterval();
    this.clearAutoTransition();
    this.state = 'idle';
    this.mode = 'work';
    this.currentCycle = 0;
    this.timeRemaining = this.getCurrentModeDuration();
    this.totalTime = this.timeRemaining;
    this.notifyStateChanged();
  }

  switchMode(mode: TimerMode): void {
    this.stop();
    this.mode = mode;
    this.timeRemaining = this.getCurrentModeDuration();
    this.totalTime = this.timeRemaining;
    this.notifyStateChanged();
  }

  // Configuration
  updateConfig(newConfig: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Réinitialiser si le timer est en idle
    if (this.state === 'idle') {
      this.timeRemaining = this.getCurrentModeDuration();
      this.totalTime = this.timeRemaining;
      this.notifyStateChanged();
    }
  }

  getConfig(): TimerConfig {
    return { ...this.config };
  }

  // Données du timer
  getTimerData(): TimerData {
    return {
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      state: this.state,
      mode: this.mode,
      sessionCount: this.sessionCount,
      currentCycle: this.currentCycle,
      maxCycles: this.maxCycles,
      isPomodoroMode: this.isPomodoroMode
    };
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getProgress(): number {
    if (this.totalTime === 0) return 0;
    return ((this.totalTime - this.timeRemaining) / this.totalTime) * 100;
  }

  getRemainingTimeFormatted(): string {
    return this.formatTime(this.timeRemaining);
  }

  getTotalTimeFormatted(): string {
    return this.formatTime(this.totalTime);
  }

  // État du timer
  isRunning(): boolean {
    return this.state === 'running';
  }

  isPaused(): boolean {
    return this.state === 'paused';
  }

  isFinished(): boolean {
    return this.state === 'finished';
  }

  isIdle(): boolean {
    return this.state === 'idle';
  }

  // Sessions
  getSessionCount(): number {
    return this.sessionCount;
  }

  resetSessionCount(): void {
    this.sessionCount = 0;
    this.notifyStateChanged();
  }

  // Mode actuel
  getCurrentMode(): TimerMode {
    return this.mode;
  }

  getCurrentModeDuration(): number {
    switch (this.mode) {
      case 'work':
        return this.config.workDuration;
      case 'break':
        return this.config.shortBreakDuration;
      case 'longBreak':
        return this.config.longBreakDuration;
    }
  }

  // Callbacks
  onTick(callback: TimerCallback): void {
    this.onTickCallback = callback;
  }

  onStateChanged(callback: TimerCallback): void {
    this.onStateChangedCallback = callback;
  }

  onFinished(callback: TimerCallback): void {
    this.onFinishedCallback = callback;
  }

  onModeChange(callback: TimerCallback): void {
    this.onModeChangeCallback = callback;
  }

  onCycleComplete(callback: TimerCallback): void {
    this.onCycleCompleteCallback = callback;
  }

  // Méthodes privées
  private tick(): void {
    if (this.timeRemaining > 0) {
      this.timeRemaining--;
      this.onTickCallback?.(this.getTimerData());
    } else {
      this.handleTimerFinished();
    }
  }

  private handleTimerFinished(): void {
    this.clearInterval();
    this.state = 'finished';
    
    if (this.mode === 'work') {
      this.sessionCount++;
      this.currentCycle++;
    }
    
    this.onFinishedCallback?.(this.getTimerData());
    this.notifyStateChanged();
    
    // Auto-transition pour le mode Pomodoro
    if (this.isPomodoroMode) {
      this.autoTransitionTimeout = setTimeout(() => {
        this.autoSwitchToNextMode();
      }, 3000);
    }
  }

  private autoSwitchToNextMode(): void {
    if (!this.isPomodoroMode) return;
    
    // Vérifier si on a atteint le nombre maximum de cycles
    if (this.maxCycles > 0 && this.currentCycle >= this.maxCycles) {
      // Session Pomodoro terminée
      this.onCycleCompleteCallback?.(this.getTimerData());
      return;
    }
    
    if (this.mode === 'work') {
      // Passer en pause
      const isLongBreakTime = this.sessionCount % this.config.longBreakInterval === 0;
      const nextMode = isLongBreakTime ? 'longBreak' : 'break';
      this.switchMode(nextMode);
      this.onModeChangeCallback?.(this.getTimerData());
      // Auto-démarrer la pause
      setTimeout(() => this.start(), 1000);
    } else {
      // Passer au travail
      this.switchMode('work');
      this.onModeChangeCallback?.(this.getTimerData());
      // Auto-démarrer le travail
      setTimeout(() => this.start(), 1000);
    }
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private clearAutoTransition(): void {
    if (this.autoTransitionTimeout) {
      clearTimeout(this.autoTransitionTimeout);
      this.autoTransitionTimeout = null;
    }
  }

  private notifyStateChanged(): void {
    this.onStateChangedCallback?.(this.getTimerData());
  }

  // Configuration Pomodoro
  setPomodoroMode(isPomodoroMode: boolean, maxCycles?: number): void {
    this.isPomodoroMode = isPomodoroMode;
    if (maxCycles !== undefined) {
      this.maxCycles = maxCycles;
    }
    this.reset();
  }

  getCurrentCycle(): number {
    return this.currentCycle;
  }

  getMaxCycles(): number {
    return this.maxCycles;
  }

  getRemainingCycles(): number {
    return Math.max(0, this.maxCycles - this.currentCycle);
  }

  // Nettoyage
  destroy(): void {
    this.clearInterval();
    this.clearAutoTransition();
    this.onTickCallback = undefined;
    this.onStateChangedCallback = undefined;
    this.onFinishedCallback = undefined;
    this.onModeChangeCallback = undefined;
    this.onCycleCompleteCallback = undefined;
  }
}

// Factory pour créer des instances de timer
export function createTimer(config?: Partial<TimerConfig>, isPomodoroMode?: boolean, maxCycles?: number): TimerService {
  const fullConfig = {
    workDuration: POMODORO_CONFIG.WORK_DURATION,
    shortBreakDuration: POMODORO_CONFIG.SHORT_BREAK_DURATION,
    longBreakDuration: POMODORO_CONFIG.LONG_BREAK_DURATION,
    longBreakInterval: POMODORO_CONFIG.LONG_BREAK_INTERVAL,
    ...config
  };
  
  return new TimerService(fullConfig, isPomodoroMode || false, maxCycles || 0);
}

// Utilitaires
export function createPomodoroTimer(maxCycles: number = 4): TimerService {
  return createTimer(undefined, true, maxCycles);
}

export function createCustomTimer(workMinutes: number, breakMinutes: number, longBreakMinutes: number = 0, maxCycles: number = 0): TimerService {
  const isPomodoroMode = maxCycles > 0;
  return createTimer({
    workDuration: workMinutes * 60,
    shortBreakDuration: breakMinutes * 60,
    longBreakDuration: (longBreakMinutes || breakMinutes * 2) * 60,
    longBreakInterval: 4
  }, isPomodoroMode, maxCycles);
}

export function createSimpleTimer(minutes: number): TimerService {
  return createTimer({
    workDuration: minutes * 60,
    shortBreakDuration: 300,
    longBreakDuration: 900,
    longBreakInterval: 4
  }, false, 0);
}